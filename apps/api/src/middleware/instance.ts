import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { logger } from '@booking-engine/core';

/**
 * Instance resolution middleware.
 * Resolves instance from X-Instance-ID header.
 * Must run AFTER requireTenant so that req.tenant is available.
 */
export async function requireInstance(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        // Tenant-scoped instance-management routes do not require X-Instance-ID.
        // This safeguard prevents accidental middleware blocking if router order changes.
        const normalizedPath = (req.path || '').toLowerCase();
        if (normalizedPath === '/instances' || normalizedPath.startsWith('/instances/')) {
            next();
            return;
        }

        const instanceId = req.headers['x-instance-id'] as string | undefined;

        if (!instanceId) {
            res.status(400).json({
                success: false,
                error: { code: 'INSTANCE_REQUIRED', message: 'Instance context required. Send X-Instance-ID header.' },
            });
            return;
        }

        const instance = await db.instance.findFirst({
            where: {
                id: instanceId,
                tenantId: req.tenant!.id,
                status: 'active',
            },
            select: { id: true, subdomain: true, name: true, status: true, timezone: true },
        });

        if (!instance) {
            res.status(404).json({
                success: false,
                error: { code: 'INSTANCE_NOT_FOUND', message: 'Instance not found or inactive' },
            });
            return;
        }

        req.instance = {
            id: instance.id,
            subdomain: instance.subdomain,
            name: instance.name,
            status: instance.status,
            timezone: instance.timezone,
        };

        next();
    } catch (error) {
        logger.error('Instance middleware error', { error });
        next(error);
    }
}
