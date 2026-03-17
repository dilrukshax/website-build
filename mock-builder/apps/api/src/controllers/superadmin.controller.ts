import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export class SuperAdminController {
    /**
     * Get a list of all tenants in the system along with their owner's details.
     */
    static async listTenants(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenants = await db.tenant.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    owner: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            instances: true,
                        }
                    }
                },
            });

            const formattedTenants = tenants.map(tenant => ({
                id: tenant.id,
                businessName: tenant.businessName,
                status: tenant.status,
                plan: tenant.plan,
                createdAt: tenant.createdAt,
                owner: tenant.owner,
                staffCount: tenant._count.users,
                instanceCount: tenant._count.instances,
            }));

            res.json({ success: true, data: formattedTenants });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed information for a specific tenant, including instances and stats.
     */
    static async getTenantDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const tenant = await db.tenant.findUnique({
                where: { id },
                include: {
                    owner: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                    instances: {
                        select: {
                            id: true,
                            subdomain: true,
                            name: true,
                            businessType: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                            instances: true,
                        },
                    },
                },
            });

            if (!tenant) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Tenant not found', 404);
            }

            res.json({
                success: true,
                data: {
                    id: tenant.id,
                    businessName: tenant.businessName,
                    status: tenant.status,
                    plan: tenant.plan,
                    createdAt: tenant.createdAt,
                    updatedAt: tenant.updatedAt,
                    owner: tenant.owner,
                    instances: tenant.instances,
                    stats: {
                        staffCount: tenant._count.users,
                        instanceCount: tenant._count.instances,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a list of all staff members (users) for a specific tenant.
     */
    static async listTenantStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const staff = await db.userTenant.findMany({
                where: { tenantId: id },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            status: true,
                            createdAt: true,
                        }
                    },
                    role: {
                        select: {
                            id: true,
                            name: true,
                            isSystemRole: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            const formattedStaff = staff.map(member => ({
                id: member.id,
                userId: member.userId,
                email: member.user.email,
                fullName: member.user.fullName,
                userStatus: member.user.status,
                userTenantStatus: member.status,
                isOwner: member.isOwner,
                role: member.role,
                joinedAt: member.createdAt,
            }));

            res.json({ success: true, data: formattedStaff });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update the status of a specific tenant (e.g. suspend/activate).
     */
    static async updateTenantStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive', 'suspended'].includes(status)) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid status', 400);
            }

            const tenant = await db.tenant.update({
                where: { id },
                data: { status },
            });

            res.json({
                success: true,
                data: {
                    id: tenant.id,
                    status: tenant.status
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
