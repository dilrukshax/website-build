import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { logger } from '@project-aurora/core';

/**
 * Tenant resolution middleware.
 * Resolves tenant from X-Tenant-ID header or JWT tenantId.
 */
export async function requireTenant(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        // Resolve from X-Tenant-ID header or JWT tenantId
        const tenantId = (req.headers['x-tenant-id'] as string | undefined) || req.auth?.tenantId;

        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: { code: 'TENANT_REQUIRED', message: 'Tenant context required. Send X-Tenant-ID header.' },
            });
            return;
        }

        if (!req.auth?.userId) {
            const tenant = await db.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, businessName: true, status: true },
            });

            if (!tenant) {
                res.status(404).json({
                    success: false,
                    error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
                });
                return;
            }

            if (tenant.status !== 'active') {
                res.status(403).json({
                    success: false,
                    error: { code: 'TENANT_INACTIVE', message: 'Tenant is not active' },
                });
                return;
            }

            req.tenant = {
                id: tenant.id,
                businessName: tenant.businessName,
                status: tenant.status,
            };

            next();
            return;
        }

        const membership = await db.userTenant.findUnique({
            where: {
                userId_tenantId: {
                    userId: req.auth.userId,
                    tenantId,
                },
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        businessName: true,
                        status: true,
                        ownerId: true,
                    },
                },
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!membership || membership.status !== 'active') {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have access to this tenant' },
            });
            return;
        }

        const tenant = membership.tenant;
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
            });
            return;
        }

        if (tenant.status !== 'active') {
            res.status(403).json({
                success: false,
                error: { code: 'TENANT_INACTIVE', message: 'Tenant is not active' },
            });
            return;
        }

        const isTenantOwner = membership.isOwner || tenant.ownerId === req.auth.userId;
        req.auth = {
            ...req.auth,
            tenantId,
            role: isTenantOwner ? 'owner' : membership.role.name.toLowerCase(),
            permissions: membership.role.permissions.map((rp) => rp.permission.key),
        };

        req.tenant = {
            id: tenant.id,
            businessName: tenant.businessName,
            status: tenant.status,
        };

        next();
    } catch (error) {
        logger.error('Tenant middleware error', { error });
        next(error);
    }
}
