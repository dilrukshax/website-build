import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { ERROR_CODES } from '@project-aurora/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from '../services/plan-policy.service';

export class SuperAdminController {
    private static computeCustomDomainStatus(input: {
        customDomain: string | null;
        customDomainHostnameStatus: string | null;
        customDomainSslStatus: string | null;
        customDomainActivatedAt: Date | null;
    }): 'pending' | 'connected' | null {
        if (!input.customDomain) {
            return null;
        }

        const hostnameStatus = (input.customDomainHostnameStatus || '').toLowerCase();
        const sslStatus = (input.customDomainSslStatus || '').toLowerCase();
        const isConnected = Boolean(
            input.customDomainActivatedAt
            || (hostnameStatus === 'active' && sslStatus === 'active'),
        );

        return isConnected ? 'connected' : 'pending';
    }

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
                customDomainStatus: SuperAdminController.computeCustomDomainStatus({
                    customDomain: instance.customDomain,
                    customDomainHostnameStatus: instance.customDomainHostnameStatus,
                    customDomainSslStatus: instance.customDomainSslStatus,
                    customDomainActivatedAt: instance.customDomainActivatedAt,
                }),
                id: instance.id,
                name: instance.name,
                subdomain: instance.subdomain,
                fullDomain: instance.fullDomain,
                customDomain: instance.customDomain,
                customDomainHostnameStatus: instance.customDomainHostnameStatus,
                customDomainSslStatus: instance.customDomainSslStatus,
                customDomainLastCheckedAt: instance.customDomainLastCheckedAt,
                customDomainActivatedAt: instance.customDomainActivatedAt,
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
                        pendingCustomDomains: formattedInstances.filter((instance) => instance.customDomainStatus === 'pending').length,
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
            if (!id) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Tenant ID is required', 400);
            }
            const { status } = req.body;

            if (!['active', 'inactive', 'suspended'].includes(status)) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid status', 400);
            }

            const tenant = await db.tenant.update({
                where: { id },
                data: { status },
            });

            PlanPolicyService.invalidateCache(id);

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

    static async listCustomDomainRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestedStatus = typeof req.query.status === 'string'
                ? req.query.status.trim().toLowerCase()
                : '';
            const statusFilter = requestedStatus === 'connected'
                ? 'connected'
                : requestedStatus === 'pending'
                    ? 'pending'
                    : 'all';

            const rows = await db.instance.findMany({
                where: {
                    customDomain: { not: null },
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    fullDomain: true,
                    customDomain: true,
                    customDomainHostnameStatus: true,
                    customDomainSslStatus: true,
                    customDomainLastCheckedAt: true,
                    customDomainActivatedAt: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            businessName: true,
                            plan: true,
                            status: true,
                        },
                    },
                },
            });

            const allRows = rows.map((row) => ({
                id: row.id,
                name: row.name,
                subdomain: row.subdomain,
                fullDomain: row.fullDomain,
                customDomain: row.customDomain,
                customDomainHostnameStatus: row.customDomainHostnameStatus,
                customDomainSslStatus: row.customDomainSslStatus,
                customDomainLastCheckedAt: row.customDomainLastCheckedAt,
                customDomainActivatedAt: row.customDomainActivatedAt,
                status: SuperAdminController.computeCustomDomainStatus({
                    customDomain: row.customDomain,
                    customDomainHostnameStatus: row.customDomainHostnameStatus,
                    customDomainSslStatus: row.customDomainSslStatus,
                    customDomainActivatedAt: row.customDomainActivatedAt,
                }) || 'pending',
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                tenant: row.tenant,
            }));

            const filteredRows = statusFilter === 'all'
                ? allRows
                : allRows.filter((row) => row.status === statusFilter);

            res.json({
                success: true,
                data: {
                    rows: filteredRows,
                    totals: {
                        all: allRows.length,
                        pending: allRows.filter((row) => row.status === 'pending').length,
                        connected: allRows.filter((row) => row.status === 'connected').length,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async markCustomDomainRequestConnected(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.params.instanceId;
            if (!instanceId) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'instanceId is required', 400, 'instanceId');
            }

            const instance = await db.instance.findUnique({
                where: { id: instanceId },
                select: {
                    id: true,
                    customDomain: true,
                    customDomainHostnameStatus: true,
                    customDomainSslStatus: true,
                    customDomainLastCheckedAt: true,
                    customDomainActivatedAt: true,
                },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Instance not found', 404);
            }

            if (!instance.customDomain) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Custom domain is not configured for this instance', 400);
            }

            const now = new Date();
            const updated = await db.instance.update({
                where: { id: instance.id },
                data: {
                    customDomainHostnameStatus: 'active',
                    customDomainSslStatus: 'active',
                    customDomainLastCheckedAt: now,
                    customDomainActivatedAt: now,
                },
                select: {
                    id: true,
                    customDomain: true,
                    customDomainHostnameStatus: true,
                    customDomainSslStatus: true,
                    customDomainLastCheckedAt: true,
                    customDomainActivatedAt: true,
                },
            });

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    customDomain: updated.customDomain,
                    status: 'connected',
                    customDomainHostnameStatus: updated.customDomainHostnameStatus,
                    customDomainSslStatus: updated.customDomainSslStatus,
                    customDomainLastCheckedAt: updated.customDomainLastCheckedAt,
                    customDomainActivatedAt: updated.customDomainActivatedAt,
                },
                message: 'Custom domain marked as connected.',
            });
        } catch (error) {
            next(error);
        }
    }
}
