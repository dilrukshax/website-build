import { ERROR_CODES } from '@project-aurora/core';
import { db, runWithoutTenantContext } from '@project-aurora/database';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middleware/error';

const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export class PublicSitesController {
    static async getPublishedBySubdomain(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const subdomain = String(req.params.subdomain || '').trim().toLowerCase();
            if (!SUBDOMAIN_PATTERN.test(subdomain)) {
                throw new AppError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Invalid subdomain',
                    400,
                    'subdomain',
                );
            }

            const instance = await runWithoutTenantContext(async () => db.instance.findFirst({
                where: {
                    subdomain,
                    status: 'active',
                },
                select: {
                    id: true,
                    tenantId: true,
                    subdomain: true,
                    fullDomain: true,
                },
            }));

            if (!instance) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Site not found', 404);
            }

            const publishRecord = await runWithoutTenantContext(async () => db.publishRecord.findFirst({
                where: {
                    instanceId: instance.id,
                    status: 'published',
                },
                orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
                select: {
                    version: true,
                    publishedAt: true,
                    manifestJsonb: true,
                },
            }));

            if (!publishRecord?.manifestJsonb || typeof publishRecord.manifestJsonb !== 'object') {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Published manifest not found', 404);
            }

            res.json({
                success: true,
                data: {
                    instanceId: instance.id,
                    tenantId: instance.tenantId,
                    subdomain: instance.subdomain,
                    fullDomain: instance.fullDomain || null,
                    version: publishRecord.version,
                    publishedAt: publishRecord.publishedAt,
                    manifest: publishRecord.manifestJsonb,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
