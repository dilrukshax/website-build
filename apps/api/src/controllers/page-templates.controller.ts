import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { PlanPolicyService } from '../services/plan-policy.service';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class PageTemplatesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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
}
