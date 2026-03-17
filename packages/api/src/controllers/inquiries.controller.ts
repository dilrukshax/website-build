import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '@booking-engine/auth';
import { ERROR_CODES } from '@booking-engine/core';

export class InquiriesController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId!;
            const { page = '1', limit = '20', status } = req.query;
            
            const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
            const take = parseInt(limit as string, 10);
            
            const whereClause: any = {
                tenantId,
                ...(status ? { status } : {})
            };
            
            const data = await db.inquiry.findMany({
                where: whereClause,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            });
            const total = await db.inquiry.count({ where: whereClause });
            
            res.json({ success: true, data, meta: { total, page: parseInt(page as string, 10), limit: take, totalPages: Math.ceil(total / take) } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const inquiry = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!inquiry) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            // Public endpoint — tenant resolved from middleware
            const tenantId = req.tenant?.id || req.user?.tenantId;
            const instanceId = req.instance?.id || req.body.instanceId;
            if (!tenantId || !instanceId) {
                throw new AppError(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant and Instance context required', 400);
            }
            const inquiry = await db.inquiry.create({
                data: { ...req.body, tenantId, instanceId }
            });
            res.status(201).json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            await db.inquiry.delete({
                where: { id: req.params.id }
            });
            res.json({ success: true, data: { message: 'Inquiry deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { status } = req.body;
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: { status: status as any }
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }
}
