import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class InquiriesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const page = parseInt(req.query.page as string || '1', 10);
            const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
            const skip = (page - 1) * limit;
            const status = req.query.status as string | undefined;

            const where = { tenantId, instanceId, ...(status && { status: status as never }) };

            const [inquiries, total] = await Promise.all([
                db.inquiry.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.inquiry.count({ where }),
            ]);

            res.json({
                success: true,
                data: inquiries,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const inquiry = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!inquiry) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant?.id;
            const instanceId = req.instance?.id;
            if (!tenantId || !instanceId) {
                throw new AppError(ERROR_CODES.INSTANCE_REQUIRED, 'Tenant and instance context required', 400);
            }
            const inquiry = await db.inquiry.create({
                data: { ...req.body, tenantId, instanceId },
            });
            res.status(201).json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: { status: req.body.status },
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            await db.inquiry.delete({ where: { id: req.params.id } });
            res.json({ success: true, data: { message: 'Inquiry deleted' } });
        } catch (error) {
            next(error);
        }
    }
}
