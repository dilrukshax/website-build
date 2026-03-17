import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class ServicesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const page = parseInt(req.query.page as string || '1', 10);
            const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
            const skip = (page - 1) * limit;

            const [services, total] = await Promise.all([
                db.service.findMany({
                    where: { tenantId, instanceId, isActive: true },
                    skip,
                    take: limit,
                    orderBy: { name: 'asc' },
                }),
                db.service.count({ where: { tenantId, instanceId, isActive: true } }),
            ]);

            res.json({
                success: true,
                data: services,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
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
            const service = await db.service.create({
                data: { ...req.body, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            res.status(201).json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
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
}
