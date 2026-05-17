import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { assertCommerceEnabled, generateCartToken } from '../services/commerce.service';

/**
 * Guest cart (public storefront, token-keyed). Server is authoritative for
 * prices — client-sent prices are never trusted (design §10/§18).
 */
function serializeCart(
    cart: { id: string; token: string; currency: string; status: string },
    items: Array<{
        id: string;
        productId: string;
        productVariantId: string;
        quantity: number;
        unitPriceSnapshot: unknown;
    }>,
) {
    const lines = items.map((i) => {
        const unit = Number(i.unitPriceSnapshot);
        return {
            id: i.id,
            productId: i.productId,
            productVariantId: i.productVariantId,
            quantity: i.quantity,
            unitPrice: unit,
            lineTotal: Math.round(unit * i.quantity * 100) / 100,
        };
    });
    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    return {
        token: cart.token,
        currency: cart.currency,
        status: cart.status,
        items: lines,
        subtotal,
    };
}

export class CartController {
    static async createOrGet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            await assertCommerceEnabled(instanceId);

            const token = (req.body?.token as string) || (req.query?.token as string);
            if (token) {
                const cart = await db.cart.findFirst({
                    where: { token, instanceId, status: 'active' },
                    include: { items: true },
                });
                if (cart) {
                    res.json({ success: true, data: serializeCart(cart, cart.items) });
                    return;
                }
            }

            const profile = await db.storeCommerceProfile.findUnique({ where: { instanceId } });
            const cart = await db.cart.create({
                data: {
                    tenantId,
                    instanceId,
                    token: generateCartToken(),
                    currency: profile?.storeCurrency || 'USD',
                },
            });
            res.status(201).json({ success: true, data: serializeCart(cart, []) });
        } catch (error) {
            next(error);
        }
    }

    private static async loadActiveCart(instanceId: string, token: string | undefined) {
        if (!token) throw new AppError(ERROR_CODES.CART_NOT_FOUND, 'Cart not found', 404);
        const cart = await db.cart.findFirst({
            where: { token, instanceId, status: 'active' },
            include: { items: true },
        });
        if (!cart) throw new AppError(ERROR_CODES.CART_NOT_FOUND, 'Cart not found', 404);
        return cart;
    }

    static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cart = await CartController.loadActiveCart(req.instance!.id, req.params.token);
            res.json({ success: true, data: serializeCart(cart, cart.items) });
        } catch (error) {
            next(error);
        }
    }

    static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const cart = await CartController.loadActiveCart(instanceId, req.params.token);
            const { productVariantId, quantity } = req.body;

            const variant = await db.productVariant.findFirst({
                where: { id: productVariantId, instanceId, isActive: true },
                include: { product: true },
            });
            if (!variant || variant.product.status !== 'active') {
                throw new AppError(ERROR_CODES.VARIANT_NOT_FOUND, 'Variant unavailable', 404);
            }
            if (variant.availability === 'out_of_stock' || variant.availability === 'discontinued') {
                throw new AppError(ERROR_CODES.PRODUCT_UNAVAILABLE, 'Variant is out of stock', 409);
            }

            const existing = cart.items.find((i) => i.productVariantId === productVariantId);
            if (existing) {
                await db.cartItem.update({
                    where: { id: existing.id },
                    data: { quantity: existing.quantity + quantity },
                });
            } else {
                await db.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: variant.productId,
                        productVariantId,
                        quantity,
                        unitPriceSnapshot: Number(variant.price),
                    },
                });
            }
            const fresh = await CartController.loadActiveCart(instanceId, req.params.token);
            res.status(201).json({ success: true, data: serializeCart(fresh, fresh.items) });
        } catch (error) {
            next(error);
        }
    }

    static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const cart = await CartController.loadActiveCart(instanceId, req.params.token);
            const item = cart.items.find((i) => i.id === req.params.itemId);
            if (!item) throw new AppError(ERROR_CODES.NOT_FOUND, 'Cart item not found', 404);

            if (req.body.quantity === 0) {
                await db.cartItem.delete({ where: { id: item.id } });
            } else {
                await db.cartItem.update({
                    where: { id: item.id },
                    data: { quantity: req.body.quantity },
                });
            }
            const fresh = await CartController.loadActiveCart(instanceId, req.params.token);
            res.json({ success: true, data: serializeCart(fresh, fresh.items) });
        } catch (error) {
            next(error);
        }
    }

    static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const cart = await CartController.loadActiveCart(instanceId, req.params.token);
            const item = cart.items.find((i) => i.id === req.params.itemId);
            if (!item) throw new AppError(ERROR_CODES.NOT_FOUND, 'Cart item not found', 404);
            await db.cartItem.delete({ where: { id: item.id } });
            const fresh = await CartController.loadActiveCart(instanceId, req.params.token);
            res.json({ success: true, data: serializeCart(fresh, fresh.items) });
        } catch (error) {
            next(error);
        }
    }
}
