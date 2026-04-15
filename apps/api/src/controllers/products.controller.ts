import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class ProductsController {
    static async listCms(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const products = await db.product.findMany({
                where: { tenantId, instanceId },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });

            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const products = await db.product.findMany({
                where: { tenantId, instanceId, isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });

            res.json({
                success: true,
                data: products,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await db.product.findFirst({
                where: {
                    id: req.params.id,
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                },
            });
            if (!product) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Product not found', 404);
            }
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const maxSort = await db.product.aggregate({
                where: { tenantId, instanceId },
                _max: { sortOrder: true },
            });

            const product = await db.product.create({
                data: {
                    ...req.body,
                    tenantId,
                    instanceId,
                    sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
                },
            });
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const existing = await db.product.findFirst({
                where: { id: req.params.id, tenantId, instanceId },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Product not found', 404);
            }

            const product = await db.product.update({
                where: { id: req.params.id },
                data: req.body,
            });
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.product.findFirst({
                where: {
                    id: req.params.id,
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Product not found', 404);
            }

            await db.product.update({
                where: { id: req.params.id },
                data: { isActive: false },
            });
            res.json({ success: true, data: { message: 'Product deactivated' } });
        } catch (error) {
            next(error);
        }
    }

    static async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const { products } = req.body as { products: Array<{ id: string; sortOrder: number }> };

            const [totalCount, matchedCount] = await Promise.all([
                db.product.count({ where: { tenantId, instanceId } }),
                db.product.count({
                    where: {
                        tenantId,
                        instanceId,
                        id: { in: products.map((product) => product.id) },
                    },
                }),
            ]);

            if (matchedCount !== products.length || totalCount !== products.length) {
                throw new AppError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Reorder payload must include all products for this instance',
                    400,
                    'products'
                );
            }

            await db.$transaction(
                products.map((product) =>
                    db.product.updateMany({
                        where: {
                            id: product.id,
                            tenantId,
                            instanceId,
                        },
                        data: {
                            sortOrder: product.sortOrder,
                        },
                    })
                )
            );

            res.json({ success: true, data: { message: 'Products reordered' } });
        } catch (error) {
            next(error);
        }
    }
}
