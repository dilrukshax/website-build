import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

/** Product variants (owner, instance-scoped). Nested under a product. */
export class ProductVariantsController {
    private static async ensureProduct(req: Request) {
        const product = await db.product.findFirst({
            where: {
                id: req.params.productId,
                tenantId: req.tenant!.id,
                instanceId: req.instance!.id,
            },
        });
        if (!product) throw new AppError(ERROR_CODES.NOT_FOUND, 'Product not found', 404);
        return product;
    }

    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await ProductVariantsController.ensureProduct(req);
            const variants = await db.productVariant.findMany({
                where: { productId: req.params.productId, instanceId: req.instance!.id },
                orderBy: { createdAt: 'asc' },
            });
            res.json({ success: true, data: variants });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await ProductVariantsController.ensureProduct(req);
            const { options, ...rest } = req.body;
            const variant = await db.productVariant.create({
                data: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    productId: req.params.productId,
                    optionsJsonb: options ?? undefined,
                    ...rest,
                },
            });
            res.status(201).json({ success: true, data: variant });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const existing = await db.productVariant.findFirst({
                where: { id: req.params.id, instanceId, productId: req.params.productId },
            });
            if (!existing) throw new AppError(ERROR_CODES.VARIANT_NOT_FOUND, 'Variant not found', 404);
            const { options, ...rest } = req.body;
            const variant = await db.productVariant.update({
                where: { id: existing.id },
                data: { ...rest, ...(options !== undefined ? { optionsJsonb: options } : {}) },
            });
            res.json({ success: true, data: variant });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const existing = await db.productVariant.findFirst({
                where: { id: req.params.id, instanceId, productId: req.params.productId },
            });
            if (!existing) throw new AppError(ERROR_CODES.VARIANT_NOT_FOUND, 'Variant not found', 404);
            await db.productVariant.delete({ where: { id: existing.id } });
            res.json({ success: true, data: { message: 'Variant deleted' } });
        } catch (error) {
            next(error);
        }
    }
}
