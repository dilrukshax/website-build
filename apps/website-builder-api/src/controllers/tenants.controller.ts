import { Request, Response, NextFunction } from 'express';
import { db, seedDefaultRoles } from '@project-aurora/database';
import { ERROR_CODES } from '@project-aurora/core';
import { AppError } from '../middleware/error';
import { AuthService } from '@project-aurora/auth';
import { PlanPolicyService } from '../services/plan-policy.service';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};
export class TenantsController {
    /**
     * List all tenants the current user has access to.
     */
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth!.userId;

            const userTenants = await db.userTenant.findMany({
                where: { userId, status: 'active' },
                include: {
                    tenant: true,
                    role: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            const tenants = userTenants.map((ut) => ({
                id: ut.tenant.id,
                businessName: ut.tenant.businessName,
                status: ut.tenant.status,
                plan: ut.tenant.plan,
                role: ut.role.name,
                isOwner: ut.isOwner,
                createdAt: ut.tenant.createdAt,
            }));

            res.json({ success: true, data: tenants });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new tenant (organization). The authenticated user becomes owner.
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth!.userId;
            const { businessName } = req.body;

            const result = await db.$transaction(async (tx) => {
                // Create tenant
                const tenant = await tx.tenant.create({
                    data: {
                        businessName,
                        ownerId: userId,
                    },
                });

                // Seed default roles
                const roles = await seedDefaultRoles(tenant.id, tx as any);
                const ownerRole = roles['Owner'];

                // Link current user as owner
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

            const authResult = await AuthService.switchTenant(userId, { tenantId: result.id });

            res.cookie('refreshToken', authResult.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

            res.status(201).json({
                success: true,
                data: {
                    accessToken: authResult.tokens.accessToken,
                    tenant: authResult.tenant,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific tenant by ID. User must have access.
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth!.userId;
            const id = req.params.id!;

            const userTenant = await db.userTenant.findUnique({
                where: { userId_tenantId: { userId, tenantId: id } },
                include: {
                    tenant: true,
                    role: true,
                },
            });

            if (!userTenant || userTenant.status !== 'active') {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);
            }

            res.json({
                success: true,
                data: {
                    id: userTenant.tenant.id,
                    businessName: userTenant.tenant.businessName,
                    status: userTenant.tenant.status,
                    plan: userTenant.tenant.plan,
                    role: userTenant.role.name,
                    isOwner: userTenant.isOwner,
                    createdAt: userTenant.tenant.createdAt,
                    updatedAt: userTenant.tenant.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a tenant. Only the owner can update.
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth!.userId;
            const id = req.params.id!;

            const userTenant = await db.userTenant.findUnique({
                where: { userId_tenantId: { userId, tenantId: id } },
            });

            if (!userTenant || !userTenant.isOwner) {
                throw new AppError(ERROR_CODES.FORBIDDEN, 'Only the owner can update this tenant', 403);
            }

            const { businessName } = req.body;
            const updated = await db.tenant.update({
                where: { id },
                data: { ...(businessName && { businessName }) },
            });

            PlanPolicyService.invalidateCache(id);

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    businessName: updated.businessName,
                    status: updated.status,
                    updatedAt: updated.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deactivate a tenant. Only the owner can deactivate.
     */
    static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth!.userId;
            const id = req.params.id!;

            const userTenant = await db.userTenant.findUnique({
                where: { userId_tenantId: { userId, tenantId: id } },
            });

            if (!userTenant || !userTenant.isOwner) {
                throw new AppError(ERROR_CODES.FORBIDDEN, 'Only the owner can deactivate this tenant', 403);
            }

            await db.tenant.update({
                where: { id },
                data: { status: 'inactive' },
            });

            PlanPolicyService.invalidateCache(id);

            res.json({
                success: true,
                data: { message: 'Tenant deactivated successfully' },
            });
        } catch (error) {
            next(error);
        }
    }
}
