import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';
import { PlanPolicyService } from '../services/plan-policy.service';

export class ServicesController {
    static async listCms(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const services = await db.service.findMany({
                where: { tenantId, instanceId },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });

            res.json({ success: true, data: services });
        } catch (error) {
            next(error);
        }
    }

    static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const services = await db.service.findMany({
                where: { tenantId, instanceId, isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });

            res.json({
                success: true,
                data: services,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const service = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!service) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
            res.json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            await PlanPolicyService.assertCanCreateOrActivateService({
                tenantId,
                instanceId,
                currentIsActive: false,
                nextIsActive: req.body.isActive ?? true,
            });

            const maxSort = await db.service.aggregate({
                where: { tenantId, instanceId },
                _max: { sortOrder: true },
            });

            const service = await db.service.create({
                data: {
                    ...req.body,
                    tenantId,
                    instanceId,
                    sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
                },
            });
            res.status(201).json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const existing = await db.service.findFirst({
                where: { id: req.params.id, tenantId, instanceId },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }

            await PlanPolicyService.assertCanCreateOrActivateService({
                tenantId,
                instanceId,
                currentIsActive: existing.isActive,
                nextIsActive: req.body.isActive ?? existing.isActive,
            });

            const service = await db.service.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
            // Soft delete: mark inactive rather than hard delete
            await db.service.update({
                where: { id: req.params.id },
                data: { isActive: false },
            });
            res.json({ success: true, data: { message: 'Service deactivated' } });
        } catch (error) {
            next(error);
        }
    }

    static async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const { services } = req.body as { services: Array<{ id: string; sortOrder: number }> };

            const [totalCount, matchedCount] = await Promise.all([
                db.service.count({ where: { tenantId, instanceId } }),
                db.service.count({
                    where: {
                        tenantId,
                        instanceId,
                        id: { in: services.map((service) => service.id) },
                    },
                }),
            ]);

            if (matchedCount !== services.length || totalCount !== services.length) {
                throw new AppError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Reorder payload must include all services for this instance',
                    400,
                    'services'
                );
            }

            await db.$transaction(
                services.map((service) =>
                    db.service.updateMany({
                        where: {
                            id: service.id,
                            tenantId,
                            instanceId,
                        },
                        data: {
                            sortOrder: service.sortOrder,
                        },
                    })
                )
            );

            res.json({ success: true, data: { message: 'Services reordered' } });
        } catch (error) {
            next(error);
        }
    }
}
