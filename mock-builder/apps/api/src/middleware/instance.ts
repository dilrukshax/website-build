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
            select: { id: true, subdomain: true, name: true, status: true },
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
        };

        next();
    } catch (error) {
        logger.error('Instance middleware error', { error });
        next(error);
    }
}
