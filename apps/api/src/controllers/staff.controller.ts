import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { PasswordService } from '@booking-engine/auth';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from '../services/plan-policy.service';

export class StaffController {
    /**
     * List all staff members for the current tenant.
     */
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const page = parseInt(req.query.page as string || '1', 10);
            const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
            const skip = (page - 1) * limit;

            const [userTenants, total] = await Promise.all([
                db.userTenant.findMany({
                    where: { tenantId },
                    include: {
                        user: { select: { id: true, email: true, fullName: true, status: true, createdAt: true } },
                        role: { select: { id: true, name: true } },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.userTenant.count({ where: { tenantId } }),
            ]);

            const data = userTenants.map((ut) => ({
                id: ut.id,
                userId: ut.user.id,
                email: ut.user.email,
                fullName: ut.user.fullName,
                userStatus: ut.user.status,
                role: ut.role,
                isOwner: ut.isOwner,
                status: ut.status,
                createdAt: ut.createdAt,
            }));

            res.json({
                success: true,
                data,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new staff member. Creates a User if the email doesn't exist,
     * then links them to the current tenant with the specified role.
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const { email, password, fullName, roleId } = req.body;

            await PlanPolicyService.assertCanCreateStaff(tenantId);

            // Verify the role belongs to this tenant
            const role = await db.role.findFirst({ where: { id: roleId, tenantId } });
            if (!role) {
                throw new AppError(ERROR_CODES.ROLE_NOT_FOUND, 'Role not found in this instance', 404, 'roleId');
            }

            // Check if user already exists
            let user = await db.user.findUnique({ where: { email } });

            if (user) {
                // Check if already assigned to this tenant
                const existingLink = await db.userTenant.findUnique({
                    where: { userId_tenantId: { userId: user.id, tenantId } },
                });
                if (existingLink) {
                    throw new AppError(
                        ERROR_CODES.ALREADY_EXISTS,
                        'This user is already a member of this instance',
                        409,
                        'email',
                    );
                }
            } else {
                // Create new user
                const passwordHash = await PasswordService.hash(password);
                user = await db.user.create({
                    data: { email, passwordHash, fullName },
                });
            }

            // Link user to tenant
            const userTenant = await db.userTenant.create({
                data: {
                    userId: user.id,
                    tenantId,
                    roleId,
                    isOwner: false,
                },
                include: {
                    user: { select: { id: true, email: true, fullName: true, status: true } },
                    role: { select: { id: true, name: true } },
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    id: userTenant.id,
                    userId: userTenant.user.id,
                    email: userTenant.user.email,
                    fullName: userTenant.user.fullName,
                    role: userTenant.role,
                    isOwner: userTenant.isOwner,
                    status: userTenant.status,
                    createdAt: userTenant.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific staff member by UserTenant ID.
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const userTenant = await db.userTenant.findFirst({
                where: { id, tenantId },
                include: {
                    user: { select: { id: true, email: true, fullName: true, status: true, createdAt: true } },
                    role: {
                        include: {
                            permissions: { include: { permission: true } },
                        },
                    },
                },
            });

            if (!userTenant) {
                throw new AppError(ERROR_CODES.STAFF_NOT_FOUND, 'Staff member not found', 404);
            }

            res.json({
                success: true,
                data: {
                    id: userTenant.id,
                    userId: userTenant.user.id,
                    email: userTenant.user.email,
                    fullName: userTenant.user.fullName,
                    userStatus: userTenant.user.status,
                    role: {
                        id: userTenant.role.id,
                        name: userTenant.role.name,
                        permissions: userTenant.role.permissions.map((rp) => ({
                            id: rp.permission.id,
                            key: rp.permission.key,
                            name: rp.permission.name,
                            module: rp.permission.module,
                        })),
                    },
                    isOwner: userTenant.isOwner,
                    status: userTenant.status,
                    createdAt: userTenant.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a staff member (change role or status).
     * Cannot modify the owner's assignment.
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const { fullName, roleId, status } = req.body;

            const userTenant = await db.userTenant.findFirst({
                where: { id, tenantId },
                include: { user: true },
            });

            if (!userTenant) {
                throw new AppError(ERROR_CODES.STAFF_NOT_FOUND, 'Staff member not found', 404);
            }

            if (userTenant.isOwner) {
                throw new AppError(ERROR_CODES.FORBIDDEN, 'Cannot modify the owner assignment', 403);
            }

            // Verify new role belongs to this tenant
            if (roleId) {
                const role = await db.role.findFirst({ where: { id: roleId, tenantId } });
                if (!role) {
                    throw new AppError(ERROR_CODES.ROLE_NOT_FOUND, 'Role not found in this instance', 404, 'roleId');
                }
            }

            // Update user's fullName if provided
            if (fullName) {
                await db.user.update({
                    where: { id: userTenant.userId },
                    data: { fullName },
                });
            }

            // Update the user-tenant link
            const updated = await db.userTenant.update({
                where: { id },
                data: {
                    ...(roleId ? { roleId } : {}),
                    ...(status ? { status: status as 'active' | 'inactive' } : {}),
                },
                include: {
                    user: { select: { id: true, email: true, fullName: true, status: true } },
                    role: { select: { id: true, name: true } },
                },
            });

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    userId: updated.user.id,
                    email: updated.user.email,
                    fullName: updated.user.fullName,
                    role: updated.role,
                    isOwner: updated.isOwner,
                    status: updated.status,
                    updatedAt: updated.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove a staff member from this instance (deactivates UserTenant).
     * Cannot remove the owner.
     */
    static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const userTenant = await db.userTenant.findFirst({
                where: { id, tenantId },
            });

            if (!userTenant) {
                throw new AppError(ERROR_CODES.STAFF_NOT_FOUND, 'Staff member not found', 404);
            }

            if (userTenant.isOwner) {
                throw new AppError(ERROR_CODES.FORBIDDEN, 'Cannot remove the owner from this instance', 403);
            }

            await db.userTenant.update({
                where: { id },
                data: { status: 'inactive' },
            });

            res.json({
                success: true,
                data: { message: 'Staff member removed from this instance' },
            });
        } catch (error) {
            next(error);
        }
    }
}
