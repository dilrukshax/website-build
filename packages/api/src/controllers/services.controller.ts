import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '@booking-engine/auth';
import { ERROR_CODES } from '@booking-engine/core';

export class ServicesController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId!;
            const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
            const take = parseInt(limit as string, 10);
            
            const data = await db.service.findMany({
                where: { tenantId },
                skip,
                take,
                orderBy: { [sortBy as string]: sortOrder }
            });
            const total = await db.service.count({ where: { tenantId } });
            
            res.json({ success: true, data, meta: { total, page: parseInt(page as string, 10), limit: take, totalPages: Math.ceil(total / take) } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const service = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!service) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
            res.json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const service = await db.service.create({
                data: { ...req.body, tenantId: req.user!.tenantId! }
            });
            res.status(201).json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
            const service = await db.service.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json({ success: true, data: service });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.service.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }
            await db.service.delete({
                where: { id: req.params.id }
            });
            res.json({ success: true, data: { message: 'Service deleted' } });
        } catch (error) {
            next(error);
        }
    }
}
