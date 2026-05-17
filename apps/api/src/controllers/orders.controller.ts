import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { OrderStateService } from '../services/order-state.service';

/**
 * Owner orders & fulfillment (instance-scoped). The approval gate
 * (`approve`) is permission-guarded (orders.approve) and is the only path
 * that authorises a supplier purchase (design §12).
 */
export class OrdersController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const { page, limit, status } = req.query as unknown as {
                page: number;
                limit: number;
                status?: string;
            };
            const where = { tenantId, instanceId, ...(status ? { status: status as never } : {}) };
            const [total, orders] = await Promise.all([
                db.order.count({ where }),
                db.order.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                    include: { items: true, shipments: true },
                }),
            ]);
            res.json({
                success: true,
                data: orders,
                meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
            });
        } catch (error) {
            next(error);
        }
    }

    private static async loadOrder(req: Request) {
        const order = await db.order.findFirst({
            where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            include: {
                items: true,
                addresses: true,
                events: { orderBy: { createdAt: 'asc' } },
                payments: true,
                refunds: true,
                supplierOrders: true,
                shipments: true,
            },
        });
        if (!order) throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        return order;
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json({ success: true, data: await OrdersController.loadOrder(req) });
        } catch (error) {
            next(error);
        }
    }

    static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await OrdersController.loadOrder(req);
            await db.order.update({
                where: { id: order.id },
                data: { internalNote: req.body.internalNote },
            });
            await OrderStateService.recordEvent(order.id, 'internal.note', {
                actor: `owner:${req.auth!.userId}`,
                message: 'Internal note updated',
            });
            res.json({ success: true, data: { message: 'Note saved' } });
        } catch (error) {
            next(error);
        }
    }

    static async hold(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await OrdersController.loadOrder(req);
            await OrderStateService.transition(order.id, req.instance!.id, 'on_hold', {
                actor: `owner:${req.auth!.userId}`,
                message: req.body?.reason || 'Placed on hold by owner',
            });
            res.json({ success: true, data: { message: 'Order on hold' } });
        } catch (error) {
            next(error);
        }
    }

    static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await OrdersController.loadOrder(req);
            await OrderStateService.transition(order.id, req.instance!.id, 'cancelled', {
                actor: `owner:${req.auth!.userId}`,
                message: req.body?.reason || 'Cancelled by owner',
            });
            await OrderStateService.setFulfillmentStatus(order.id, req.instance!.id, 'cancelled', {
                actor: `owner:${req.auth!.userId}`,
            });
            res.json({ success: true, data: { message: 'Order cancelled' } });
        } catch (error) {
            next(error);
        }
    }

    /** Manual/offline payment confirmation (design §11 v1 default). */
    static async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await OrdersController.loadOrder(req);
            const provider = (req.body.provider === 'manual' ? 'local' : req.body.provider) as
                'stripe' | 'paypal' | 'local';
            await db.payment.create({
                data: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    orderId: order.id,
                    provider,
                    providerRef: req.body.providerRef ?? null,
                    amount: req.body.amount ?? Number(order.grandTotal),
                    currency: order.currency,
                    status: 'paid',
                    capturedAt: new Date(),
                    methodJsonb: { confirmedBy: req.auth!.userId, mode: 'manual' },
                },
            });
            await OrderStateService.markPaid(order.id, req.instance!.id, {
                actor: `owner:${req.auth!.userId}`,
                message: 'Payment confirmed manually by owner',
            });
            res.json({ success: true, data: { message: 'Payment recorded' } });
        } catch (error) {
            next(error);
        }
    }

    /** MANDATORY APPROVAL GATE — permission: orders.approve. */
    static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const order = await OrdersController.loadOrder(req);

            const productIds = order.items.map((i) => i.productId);
            const products = await db.product.findMany({
                where: { id: { in: productIds }, instanceId },
                select: { supplierId: true },
            });
            let supplierId = products.find((p) => p.supplierId)?.supplierId ?? null;
            if (!supplierId) {
                const supplier = await db.supplier.findFirst({
                    where: { tenantId, instanceId },
                    orderBy: { createdAt: 'asc' },
                });
                supplierId = supplier?.id ?? null;
            }
            if (!supplierId) {
                throw new AppError(
                    ERROR_CODES.SUPPLIER_NOT_FOUND,
                    'No supplier configured to fulfil this order',
                    409,
                );
            }

            await OrderStateService.approveSupplierPurchase(
                order.id,
                instanceId,
                tenantId,
                req.auth!.userId,
                supplierId,
            );
            res.json({ success: true, data: { message: 'Supplier purchase approved' } });
        } catch (error) {
            next(error);
        }
    }

    /** Record a placed supplier order — permission: orders.fulfill. v1 manual. */
    static async placeSupplierOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const order = await OrdersController.loadOrder(req);
            await OrderStateService.placeSupplierOrder(
                order.id,
                req.instance!.id,
                {
                    supplierOrderRef: req.body.supplierOrderRef,
                    placedCost: req.body.placedCost ?? null,
                },
                { actor: `owner:${req.auth!.userId}` },
            );
            res.json({ success: true, data: { message: 'Supplier order recorded' } });
        } catch (error) {
            next(error);
        }
    }

    /** Create/update the shipment + advance fulfillment — perm: orders.fulfill. */
    static async upsertShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const order = await OrdersController.loadOrder(req);
            const data = {
                carrier: req.body.carrier ?? null,
                trackingNumber: req.body.trackingNumber ?? null,
                trackingUrl: req.body.trackingUrl ?? null,
                status: req.body.status ?? 'in_transit',
                estimatedDeliveryAt: req.body.estimatedDeliveryAt
                    ? new Date(req.body.estimatedDeliveryAt)
                    : null,
            };
            const existing = order.shipments[0];
            const shipment = existing
                ? await db.shipment.update({ where: { id: existing.id }, data })
                : await db.shipment.create({
                    data: { tenantId, instanceId, orderId: order.id, ...data },
                });

            if (data.status === 'delivered') {
                await db.shipment.update({
                    where: { id: shipment.id },
                    data: { deliveredAt: new Date() },
                });
                await OrderStateService.transition(order.id, instanceId, 'delivered', {
                    actor: `owner:${req.auth!.userId}`,
                });
                await OrderStateService.setFulfillmentStatus(order.id, instanceId, 'delivered');
            } else {
                if (order.status === 'fulfilling') {
                    await OrderStateService.transition(order.id, instanceId, 'shipped', {
                        actor: `owner:${req.auth!.userId}`,
                    });
                }
                await OrderStateService.setFulfillmentStatus(order.id, instanceId, 'in_transit');
            }
            res.json({ success: true, data: shipment });
        } catch (error) {
            next(error);
        }
    }

    /** Issue a refund — permission: refunds.create. */
    static async createRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const order = await OrdersController.loadOrder(req);
            const amount = req.body.amount as number;
            if (amount > Number(order.grandTotal)) {
                throw new AppError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Refund amount exceeds order total',
                    400,
                    'amount',
                );
            }
            const lastPayment = order.payments[order.payments.length - 1];
            const refund = await db.refund.create({
                data: {
                    tenantId,
                    instanceId,
                    orderId: order.id,
                    paymentId: lastPayment?.id ?? null,
                    provider: lastPayment?.provider ?? 'local',
                    amount,
                    reason: req.body.reason ?? null,
                    status: 'succeeded',
                    createdBy: req.auth!.userId,
                },
            });
            const fullyRefunded = amount >= Number(order.grandTotal);
            await OrderStateService.setPaymentStatus(
                order.id,
                instanceId,
                fullyRefunded ? 'refunded' : 'partially_refunded',
                { actor: `owner:${req.auth!.userId}`, message: `Refund ${amount} ${order.currency}` },
            );
            if (fullyRefunded && order.status !== 'refunded') {
                await OrderStateService.transition(order.id, instanceId, 'refunded', {
                    actor: `owner:${req.auth!.userId}`,
                }).catch(() => undefined);
            }
            res.status(201).json({ success: true, data: refund });
        } catch (error) {
            next(error);
        }
    }
}
