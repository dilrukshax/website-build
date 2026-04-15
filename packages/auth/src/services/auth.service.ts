import crypto from 'crypto';
import { JWTService } from './jwt.service';
import { PasswordService } from './password.service';
import { db, seedDefaultRoles } from '@booking-engine/database';
import {
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SwitchTenantRequest,
    AuthTokens,
    JWTPayload,
    logger,
    ERROR_CODES,
} from '@booking-engine/core';

export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 500,
        public readonly field?: string,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class AuthService {
    private static capWithAddons(base: number | null, addonBundles: number, allowAddonBundle: boolean): number | null {
        if (!allowAddonBundle || base === null) {
            return base;
        }
        return base + Math.max(0, addonBundles);
    }

    private static async buildTenantPlanSummary(tenant: {
        id: string;
        plan: 'free' | 'starter' | 'freelance' | 'enterprise';
        billingInterval: 'monthly' | 'annual';
        addonBundles: number;
    }) {
        const [catalog, instancesUsed, customDomainsUsed, staffAccountsUsed] = await Promise.all([
            db.planCatalog.findUnique({ where: { plan: tenant.plan } }),
            db.instance.count({ where: { tenantId: tenant.id, status: 'active' } }),
            db.instance.count({ where: { tenantId: tenant.id, status: 'active', customDomain: { not: null } } }),
            db.userTenant.count({ where: { tenantId: tenant.id, status: 'active', isOwner: false } }),
        ]);

        const maxInstances = catalog
            ? this.capWithAddons(catalog.maxInstances, tenant.addonBundles, catalog.allowAddonBundle)
            : null;
        const maxCustomDomains = catalog
            ? this.capWithAddons(catalog.maxCustomDomains, tenant.addonBundles, catalog.allowAddonBundle)
            : null;

        return {
            plan: tenant.plan,
            billingInterval: tenant.billingInterval,
            addonBundles: tenant.addonBundles,
            usageSummary: {
                instances: {
                    used: instancesUsed,
                    limit: maxInstances,
                },
                customDomains: {
                    used: customDomainsUsed,
                    limit: maxCustomDomains,
                },
                staffAccounts: {
                    used: staffAccountsUsed,
                    allowed: catalog?.allowStaffAccounts ?? true,
                },
            },
        };
    }

    /**
     * Register a new user account only (no tenant creation).
     * The user will create a tenant separately after registration.
     */
    static async register(data: RegisterRequest) {
        // Validate password strength
        const passwordValidation = PasswordService.validate(data.password);
        if (!passwordValidation.valid) {
            throw new AppError(
                ERROR_CODES.VALIDATION_ERROR,
                passwordValidation.errors.join('. '),
                400,
            );
        }

        // Check email uniqueness
        const existingUser = await db.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError(ERROR_CODES.EMAIL_ALREADY_EXISTS, 'A user with this email already exists', 409, 'email');
        }

        // Hash password
        const passwordHash = await PasswordService.hash(data.password);

        // Create user
        const user = await db.user.create({
            data: {
                email: data.email,
                passwordHash,
                fullName: data.fullName,
            },
        });

        // Generate session-level token (no tenantId — user has no tenant yet)
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
        };
        const tokens = JWTService.generateTokenPair(payload);

        // Store refresh token
        const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await db.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        logger.info('New user registered', { userId: user.id });

        return {
            tokens,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
            },
        };
    }

    /**
     * Create a new tenant (organization) for the user.
     * Creates Tenant + default Roles + UserTenant(owner) atomically.
     */
    static async createTenant(userId: string, data: { businessName: string }) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
        }

        const result = await db.$transaction(async (tx) => {
            // 1. Create tenant
            const tenant = await tx.tenant.create({
                data: {
                    businessName: data.businessName,
                    ownerId: userId,
                },
            });

            // 2. Seed default roles for this tenant
            const roles = await seedDefaultRoles(tenant.id, tx as any);
            const ownerRole = roles['Owner'];

            // 3. Link user to tenant as owner
            await tx.userTenant.create({
                data: {
                    userId,
                    tenantId: tenant.id,
                    roleId: ownerRole!.id,
                    isOwner: true,
                },
            });

            return tenant;
        });

        // Generate tenant-scoped token
        const payload: JWTPayload = {
            userId,
            email: user.email,
            tenantId: result.id,
            role: 'owner',
            isSuperAdmin: user.isSuperAdmin || undefined,
        };
        const tokens = JWTService.generateTokenPair(payload);

        // Store refresh token
        const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await db.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        logger.info('New tenant created', { tenantId: result.id, userId });

        return {
            tokens,
            tenant: {
                id: result.id,
                businessName: result.businessName,
                status: result.status,
            },
        };
    }

    /**
     * Login with email and password.
     * Returns tokens + user + list of tenants the user has access to.
     */
    static async login(data: LoginRequest): Promise<{
        tokens: AuthTokens;
        user: { id: string; email: string; fullName: string; isSuperAdmin: boolean };
        tenants: Array<{
            id: string; businessName: string;
            role: string; isOwner: boolean; status: string; permissions: string[];
            plan: 'free' | 'starter' | 'freelance' | 'enterprise';
            billingInterval: 'monthly' | 'annual';
            addonBundles: number;
            usageSummary: {
                instances: { used: number; limit: number | null };
                customDomains: { used: number; limit: number | null };
                staffAccounts: { used: number; allowed: boolean };
            };
        }>;
    }> {
        // Find user by email
        const user = await db.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', 401);
        }

        // Verify password
        const isValid = await PasswordService.compare(data.password, user.passwordHash);
        if (!isValid) {
            throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password', 401);
        }

        // Check status
        if (user.status !== 'active') {
            throw new AppError(ERROR_CODES.FORBIDDEN, 'Your account is not active', 403);
        }

        // Fetch all tenant assignments
        const userTenants = await db.userTenant.findMany({
            where: { userId: user.id, status: 'active' },
            include: {
                tenant: true,
                role: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });

        const tenants = await Promise.all(userTenants.map(async (ut) => {
            const isOwner = ut.isOwner || ut.tenant.ownerId === user.id;
            const planSummary = await this.buildTenantPlanSummary({
                id: ut.tenant.id,
                plan: ut.tenant.plan as 'free' | 'starter' | 'freelance' | 'enterprise',
                billingInterval: ut.tenant.billingInterval as 'monthly' | 'annual',
                addonBundles: ut.tenant.addonBundles,
            });

            return {
                id: ut.tenant.id,
                businessName: ut.tenant.businessName,
                role: ut.role.name,
                isOwner,
                status: ut.tenant.status,
                permissions: ut.role.permissions.map((rp) => rp.permission.key),
                ...planSummary,
            };
        }));

        // Auto-select tenant if only one
        let payload: JWTPayload;
        const firstTenant = tenants[0];
        if (tenants.length === 1 && firstTenant) {
            payload = {
                userId: user.id,
                email: user.email,
                tenantId: firstTenant.id,
                role: firstTenant.isOwner ? 'owner' : firstTenant.role.toLowerCase(),
                isSuperAdmin: user.isSuperAdmin || undefined,
            };
        } else {
            // Session-level token (no tenant context yet)
            payload = {
                userId: user.id,
                email: user.email,
                isSuperAdmin: user.isSuperAdmin || undefined,
            };
        }

        const tokens = JWTService.generateTokenPair(payload);

        // Store refresh token
        const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await db.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        logger.info('User logged in', { userId: user.id });

        return {
            tokens,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isSuperAdmin: user.isSuperAdmin,
            },
            tenants,
        };
    }

    /**
     * Switch to a different tenant. Generates new scoped token pair.
     */
    static async switchTenant(userId: string, data: SwitchTenantRequest) {
        const userTenant = await db.userTenant.findUnique({
            where: {
                userId_tenantId: { userId, tenantId: data.tenantId },
            },
            include: {
                tenant: true,
                role: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });

        if (!userTenant || userTenant.status !== 'active') {
            throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this tenant', 403);
        }

        if (userTenant.tenant.status !== 'active') {
            throw new AppError(ERROR_CODES.TENANT_INACTIVE, 'This tenant is not active', 403);
        }

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
        }

        const isOwner = userTenant.isOwner || userTenant.tenant.ownerId === userId;

        const payload: JWTPayload = {
            userId,
            email: user.email,
            tenantId: data.tenantId,
            role: isOwner ? 'owner' : userTenant.role.name.toLowerCase(),
            isSuperAdmin: user.isSuperAdmin || undefined,
        };

        const tokens = JWTService.generateTokenPair(payload);

        // Store refresh token
        const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await db.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return {
            tokens,
            tenant: {
                id: userTenant.tenant.id,
                businessName: userTenant.tenant.businessName,
                role: userTenant.role.name,
                isOwner,
                permissions: userTenant.role.permissions.map((rp) => rp.permission.key),
                ...(await this.buildTenantPlanSummary({
                    id: userTenant.tenant.id,
                    plan: userTenant.tenant.plan as 'free' | 'starter' | 'freelance' | 'enterprise',
                    billingInterval: userTenant.tenant.billingInterval as 'monthly' | 'annual',
                    addonBundles: userTenant.tenant.addonBundles,
                })),
            },
        };
    }

    /**
     * Refresh access token using refresh token.
     */
    static async refreshToken(refreshToken: string): Promise<AuthTokens> {
        let payload: JWTPayload;
        try {
            payload = JWTService.verifyRefreshToken(refreshToken);
        } catch {
            throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid or expired refresh token', 401);
        }

        // Check token exists in DB and is not revoked
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedToken = await db.refreshToken.findUnique({ where: { tokenHash } });

        if (!storedToken || storedToken.revokedAt) {
            throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Refresh token has been revoked', 401);
        }

        const user = await db.user.findUnique({
            where: { id: payload.userId },
            select: { isSuperAdmin: true },
        });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
        }

        // Revoke old token
        await db.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Generate new pair
        const newPayload: JWTPayload = {
            userId: payload.userId,
            email: payload.email,
            tenantId: payload.tenantId,
            role: payload.role,
            isSuperAdmin: user.isSuperAdmin || undefined,
        };
        const tokens = JWTService.generateTokenPair(newPayload);

        // Store new refresh token
        const newTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
        await db.refreshToken.create({
            data: {
                userId: payload.userId,
                tokenHash: newTokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return tokens;
    }

    /**
     * Get current user profile with all tenant assignments.
     */
    static async getCurrentUser(userId: string) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
        }

        const userTenants = await db.userTenant.findMany({
            where: { userId: user.id, status: 'active' },
            include: {
                tenant: true,
                role: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                status: user.status,
                isSuperAdmin: user.isSuperAdmin,
            },
            tenants: await Promise.all(userTenants.map(async (ut) => {
                const isOwner = ut.isOwner || ut.tenant.ownerId === user.id;
                return {
                    id: ut.tenant.id,
                    businessName: ut.tenant.businessName,
                    role: ut.role.name,
                    isOwner,
                    status: ut.tenant.status,
                    permissions: ut.role.permissions.map((rp) => rp.permission.key),
                    ...(await this.buildTenantPlanSummary({
                        id: ut.tenant.id,
                        plan: ut.tenant.plan as 'free' | 'starter' | 'freelance' | 'enterprise',
                        billingInterval: ut.tenant.billingInterval as 'monthly' | 'annual',
                        addonBundles: ut.tenant.addonBundles,
                    })),
                };
            })),
        };
    }

    /**
     * Logout — revoke all refresh tokens for the user.
     */
    static async logout(userId: string): Promise<void> {
        await db.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        logger.info('User logged out', { userId });
    }

    /**
     * Initiate password reset — creates a token.
     */
    static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
        const user = await db.user.findUnique({ where: { email: data.email } });
        if (!user) {
            logger.info('Forgot password requested for unknown email', { email: data.email });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        await db.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        const resetLink = `${process.env.CMS_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

        // In production: send via email service
        logger.info('PASSWORD RESET LINK (development only)', {
            userId: user.id,
            resetLink,
        });
    }

    /**
     * Complete password reset using a valid token.
     */
    static async resetPassword(data: ResetPasswordRequest): Promise<void> {
        const resetToken = await db.passwordResetToken.findUnique({
            where: { token: data.token },
        });

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
            throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid or expired reset token', 400);
        }

        const passwordValidation = PasswordService.validate(data.newPassword);
        if (!passwordValidation.valid) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, passwordValidation.errors.join('. '), 400);
        }

        const passwordHash = await PasswordService.hash(data.newPassword);

        await db.$transaction([
            db.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            db.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        logger.info('Password reset successful', { userId: resetToken.userId });
    }
}
