import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '@booking-engine/auth';
import { ERROR_CODES } from '@booking-engine/core';

export class CustomersController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId!;
            const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
            const take = parseInt(limit as string, 10);
            
            const data = await db.customer.findMany({
                where: { tenantId },
                skip,
                take,
                orderBy: { [sortBy as string]: sortOrder }
            });
            const total = await db.customer.count({ where: { tenantId } });
            
            res.json({ success: true, data, meta: { total, page: parseInt(page as string, 10), limit: take, totalPages: Math.ceil(total / take) } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const customer = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!customer) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId!;
            // Check for duplicates
            const existing = await db.customer.findFirst({
                where: { tenantId, email: req.body.email }
            });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Customer with this email already exists', 409);
            }
            const customer = await db.customer.create({
                data: { ...req.body, tenantId }
            });
            res.status(201).json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            const customer = await db.customer.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const existing = await db.customer.findFirst({
                where: { id: req.params.id, tenantId: req.user!.tenantId! }
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
            }
            await db.customer.delete({
                where: { id: req.params.id }
            });
            res.json({ success: true, data: { message: 'Customer deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async search(req: Request, res: Response, next: NextFunction) {
        try {
            const { q, limit } = req.body;
            const take = limit || 20;
            const queryRaw = typeof q === 'string' ? q : '';
            
            const results = await db.customer.findMany({
                where: {
                    tenantId: req.user!.tenantId!,
                    OR: [
                        { firstName: { contains: queryRaw, mode: 'insensitive' } },
                        { lastName: { contains: queryRaw, mode: 'insensitive' } },
                        { email: { contains: queryRaw, mode: 'insensitive' } }
                    ]
                },
                take
            });
            
            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }
}
