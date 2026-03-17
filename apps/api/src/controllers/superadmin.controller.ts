import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export class SuperAdminController {
    /**
     * Super admin dashboard summary with platform totals and instance usage.
     */
    static async dashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

            const [
                tenantsTotal,
                activeTenants,
                instancesTotal,
                activeInstances,
                activeStaffAssignments,
                pendingCharges,
                pendingReferralClaims,
                activeSuperAdmins,
            ] = await Promise.all([
                db.tenant.count(),
                db.tenant.count({ where: { status: 'active' } }),
                db.instance.count(),
                db.instance.count({ where: { status: 'active' } }),
                db.userTenant.count({ where: { status: 'active' } }),
                db.billingCharge.count({ where: { status: 'pending' } }),
                db.referralClaim.count({ where: { status: { in: ['pending', 'verify', 'review'] } } }),
                db.user.count({ where: { isSuperAdmin: true, status: 'active' } }),
            ]);

            const instances = await db.instance.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            businessName: true,
                            plan: true,
                            status: true,
                        },
                    },
                    _count: {
                        select: {
                            pages: true,
                            services: true,
                            bookings: true,
                            inquiries: true,
                            customers: true,
                        },
                    },
                },
            });

            const instanceIds = instances.map((instance) => instance.id);
            const [
                activeServicesRows,
                bookingsLast30DaysRows,
                newInquiriesRows,
            ] = instanceIds.length > 0
                ? await Promise.all([
                    db.service.groupBy({
                        by: ['instanceId'],
                        where: {
                            instanceId: { in: instanceIds },
                            isActive: true,
                        },
                        _count: { _all: true },
                    }),
                    db.booking.groupBy({
                        by: ['instanceId'],
                        where: {
                            instanceId: { in: instanceIds },
                            startTime: { gte: thirtyDaysAgo },
                        },
                        _count: { _all: true },
                    }),
                    db.inquiry.groupBy({
                        by: ['instanceId'],
                        where: {
                            instanceId: { in: instanceIds },
                            status: 'new',
                        },
                        _count: { _all: true },
                    }),
                ])
                : [[], [], []];

            const activeServicesByInstance = new Map(
                activeServicesRows.map((row) => [row.instanceId, row._count._all]),
            );
            const bookingsLast30DaysByInstance = new Map(
                bookingsLast30DaysRows.map((row) => [row.instanceId, row._count._all]),
            );
            const newInquiriesByInstance = new Map(
                newInquiriesRows.map((row) => [row.instanceId, row._count._all]),
            );

            const formattedInstances = instances.map((instance) => ({
                id: instance.id,
                name: instance.name,
                subdomain: instance.subdomain,
                fullDomain: instance.fullDomain,
                customDomain: instance.customDomain,
                timezone: instance.timezone,
                status: instance.status,
                createdAt: instance.createdAt,
                tenant: instance.tenant,
                usage: {
                    customers: instance._count.customers,
                    pages: instance._count.pages,
                    servicesTotal: instance._count.services,
                    servicesActive: activeServicesByInstance.get(instance.id) || 0,
                    bookingsTotal: instance._count.bookings,
                    bookingsLast30Days: bookingsLast30DaysByInstance.get(instance.id) || 0,
                    inquiriesTotal: instance._count.inquiries,
                    inquiriesNew: newInquiriesByInstance.get(instance.id) || 0,
                },
            }));

            res.json({
                success: true,
                data: {
                    totals: {
                        tenantsTotal,
                        activeTenants,
                        instancesTotal,
                        activeInstances,
                        activeStaffAssignments,
                        pendingCharges,
                        pendingReferralClaims,
                        activeSuperAdmins,
                    },
                    instances: formattedInstances,
                    generatedAt: new Date().toISOString(),
                },
            });
        } catch (error) {
            next(error);
        }
    }

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
                            fullDomain: true,
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
