import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class CustomersController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const page = parseInt(req.query.page as string || '1', 10);
            const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
            const skip = (page - 1) * limit;

            const [customers, total] = await Promise.all([
                db.customer.findMany({
                    where: { tenantId, instanceId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.customer.count({ where: { tenantId, instanceId } }),
            ]);

            res.json({
                success: true,
                data: customers,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const customer = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!customer) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const existing = await db.customer.findFirst({
                where: { instanceId, email: req.body.email },
            });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Customer with this email already exists', 409);
            }
            const customer = await db.customer.create({
                data: { ...req.body, tenantId, instanceId },
            });
            res.status(201).json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const customer = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!customer) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            const updated = await db.customer.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const customer = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!customer) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            await db.customer.delete({ where: { id: req.params.id } });
            res.json({ success: true, data: { message: 'Customer deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { q, limit = 20 } = req.body as { q: string; limit?: number };
            const customers = await db.customer.findMany({
                where: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    OR: [
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
                take: Math.min(limit, 100),
            });
            res.json({ success: true, data: customers });
        } catch (error) {
            next(error);
        }
    }
}
