import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { PlanPolicyService } from '../services/plan-policy.service';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@project-aurora/core';

export class PageTemplatesController {
    private static async resolveTemplateAccess(req: Request): Promise<{ allowPremiumTemplates: boolean; tenantId: string | null }> {
        const tenantId = (typeof req.headers['x-tenant-id'] === 'string'
            ? req.headers['x-tenant-id']
            : req.auth?.tenantId) || null;

        let allowPremiumTemplates = true;
        if (tenantId) {
            if (req.auth?.userId && req.user?.isSuperAdmin !== true) {
                const userTenant = await db.userTenant.findUnique({
                    where: {
                        userId_tenantId: {
                            userId: req.auth.userId,
                            tenantId,
                        },
                    },
                    select: { status: true },
                });

                if (!userTenant || userTenant.status !== 'active') {
                    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this tenant templates list', 403);
                }
            }

            const limits = await PlanPolicyService.getEffectiveLimits(tenantId);
            allowPremiumTemplates = limits.allowPremiumTemplates;
        }

        return {
            allowPremiumTemplates,
            tenantId,
        };
    }

    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { allowPremiumTemplates } = await PageTemplatesController.resolveTemplateAccess(req);

            const curatedTemplateIds = [
                'template-2026-clean-appointments',
                'template-2026-elegant-concierge',
                'template-2026-motion-studio',
                'template-2026-signal-horizon',
                'template-2026-acquisition-shop',
                'template-2026-fusion-growth',
                'template-2026-editorial-pulse',
                'template-2026-harmozi-vsl',
            ];

            // Self-healing check: ensure curated templates are active in the database
            const activeCuratedCount = await db.pageTemplate.count({
                where: {
                    id: { in: curatedTemplateIds },
                    isActive: true,
                },
            });

            if (activeCuratedCount < curatedTemplateIds.length) {
                const existingCount = await db.pageTemplate.count({
                    where: { id: { in: curatedTemplateIds } },
                });

                if (existingCount > 0) {
                    await db.pageTemplate.updateMany({
                        where: { id: { in: curatedTemplateIds } },
                        data: { isActive: true },
                    });
                }
            }

            const templates = await db.pageTemplate.findMany({
                where: {
                    isActive: true,
                },
                orderBy: { name: 'asc' },
            });

            res.json({
                success: true,
                data: templates.map((template) => ({
                    ...template,
                    isPlanRestricted: template.isPremium && !allowPremiumTemplates,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { allowPremiumTemplates } = await PageTemplatesController.resolveTemplateAccess(req);
            const templateId = req.params.id;

            const template = await db.pageTemplate.findFirst({
                where: {
                    id: templateId,
                    isActive: true,
                },
            });

            if (!template) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Template not found', 404);
            }

            res.json({
                success: true,
                data: {
                    ...template,
                    isPlanRestricted: template.isPremium && !allowPremiumTemplates,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
