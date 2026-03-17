import { Request, Response, NextFunction } from 'express';
import { db, setTenantContext } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';

declare global {
    namespace Express {
        interface Request {
            tenant?: {
                id: string;
                businessName: string;
                status: string;
            };
            instance?: {
                id: string;
                subdomain: string;
            };
        }
    }
}

/**
 * Tenant resolution middleware
 * Resolves tenant from the X-Tenant-ID header, subdomain, or custom domain
 */
export async function tenantMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // First check for explicit tenant header (useful for development)
        const tenantHeader = req.headers['x-tenant-id'] as string | undefined;

        if (tenantHeader) {
            const tenant = await db.tenant.findUnique({ where: { id: tenantHeader } });
            if (tenant && tenant.status === 'active') {
                req.tenant = {
                    id: tenant.id,
                    businessName: tenant.businessName,
                    status: tenant.status,
                };
                return setTenantContext(tenant.id, async () => next());
            }
        }

        // Try subdomain/custom domain resolution
        const host = req.hostname;
        const subdomain = host.split('.')[0];

        const instance = await db.instance.findFirst({
            where: {
                OR: [
                    { subdomain },
                    { customDomain: host }
                ]
            },
            include: { tenant: true }
        });

        if (!instance || !instance.tenant) {
            res.status(404).json({
                success: false,
                errors: [{ code: ERROR_CODES.TENANT_NOT_FOUND, message: 'Tenant or Instance not found' }],
            });
            return;
        }

        if (instance.tenant.status !== 'active') {
            res.status(403).json({
                success: false,
                errors: [{ code: ERROR_CODES.TENANT_INACTIVE, message: 'Tenant is not active' }],
            });
            return;
        }

        req.tenant = {
            id: instance.tenant.id,
            businessName: instance.tenant.businessName,
            status: instance.tenant.status,
        };
        
        req.instance = {
            id: instance.id,
            subdomain: instance.subdomain,
        };

        return setTenantContext(instance.tenant.id, async () => next());
    } catch (error) {
        next(error);
    }
}
