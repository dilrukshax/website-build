/**
 * OrderStateService — single owner of every order status transition.
 *
 * Orders carry three orthogonal status axes (design §6.7/§12):
 *   - status            : headline lifecycle
 *   - paymentStatus     : money state
 *   - fulfillmentStatus : supplier/shipping state
 *
 * The mandatory owner-approval gate is structural: no supplier purchase can be
 * placed unless `approveSupplierPurchase` (which requires an approver identity
 * and an order that is paid + awaiting_approval) has produced an `approved`
 * SupplierOrder. `placeSupplierOrder` throws otherwise.
 *
 * Every transition writes an OrderEvent audit row in the same transaction.
 */
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

type OrderStatus =
    | 'pending' | 'awaiting_payment' | 'paid' | 'awaiting_approval' | 'approved'
    | 'fulfilling' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'on_hold';
type PaymentStatus =
    | 'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';
type FulfillmentStatus =
    | 'unfulfilled' | 'awaiting_approval' | 'approved' | 'supplier_ordered'
    | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['awaiting_payment', 'cancelled'],
    awaiting_payment: ['paid', 'pending', 'cancelled'],
    paid: ['awaiting_approval', 'on_hold', 'cancelled', 'refunded'],
    awaiting_approval: ['approved', 'on_hold', 'cancelled', 'refunded'],
    approved: ['fulfilling', 'on_hold', 'cancelled'],
    fulfilling: ['shipped', 'on_hold', 'cancelled', 'delivered'],
    shipped: ['delivered', 'on_hold'],
    on_hold: ['approved', 'awaiting_approval', 'cancelled', 'refunded'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
};

export interface EventContext {
    actor?: string; // system | owner:<userId> | customer | provider:<name>
    message?: string;
    data?: Record<string, unknown>;
}

function actorOf(ctx?: EventContext): string {
    return ctx?.actor && ctx.actor.trim() ? ctx.actor.trim() : 'system';
}

export class OrderStateService {
    /** Append an audit event without changing status. */
    static async recordEvent(orderId: string, type: string, ctx?: EventContext): Promise<void> {
        await db.orderEvent.create({
            data: {
                orderId,
                type,
                actor: actorOf(ctx),
                message: ctx?.message ?? null,
                dataJsonb: (ctx?.data as object) ?? undefined,
            },
        });
    }

    /** Validate + apply a headline order status transition. */
    static async transition(
        orderId: string,
        instanceId: string,
        to: OrderStatus,
        ctx?: EventContext,
    ): Promise<void> {
        const order = await db.order.findFirst({ where: { id: orderId, instanceId } });
        if (!order) {
            throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        }
        const from = order.status as OrderStatus;
        if (from === to) return;
        if (!ORDER_TRANSITIONS[from]?.includes(to)) {
            throw new AppError(
                ERROR_CODES.INVALID_ORDER_TRANSITION,
                `Illegal order transition ${from} -> ${to}`,
                409,
            );
        }
        await db.$transaction([
            db.order.update({ where: { id: orderId }, data: { status: to } }),
            db.orderEvent.create({
                data: {
                    orderId,
                    type: `order.${to}`,
                    actor: actorOf(ctx),
                    message: ctx?.message ?? `Status ${from} -> ${to}`,
                    dataJsonb: (ctx?.data as object) ?? undefined,
                },
            }),
        ]);
    }

    static async setPaymentStatus(
        orderId: string,
        instanceId: string,
        to: PaymentStatus,
        ctx?: EventContext,
    ): Promise<void> {
        const order = await db.order.findFirst({ where: { id: orderId, instanceId } });
        if (!order) throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        await db.$transaction([
            db.order.update({ where: { id: orderId }, data: { paymentStatus: to } }),
            db.orderEvent.create({
                data: {
                    orderId, type: `payment.${to}`, actor: actorOf(ctx),
                    message: ctx?.message ?? null, dataJsonb: (ctx?.data as object) ?? undefined,
                },
            }),
        ]);
    }

    static async setFulfillmentStatus(
        orderId: string,
        instanceId: string,
        to: FulfillmentStatus,
        ctx?: EventContext,
    ): Promise<void> {
        const order = await db.order.findFirst({ where: { id: orderId, instanceId } });
        if (!order) throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        await db.$transaction([
            db.order.update({ where: { id: orderId }, data: { fulfillmentStatus: to } }),
            db.orderEvent.create({
                data: {
                    orderId, type: `fulfillment.${to}`, actor: actorOf(ctx),
                    message: ctx?.message ?? null, dataJsonb: (ctx?.data as object) ?? undefined,
                },
            }),
        ]);
    }

    /**
     * Payment confirmed → move into the approval queue.
     * Called by payment webhooks (idempotent: no-op if already past paid).
     */
    static async markPaid(orderId: string, instanceId: string, ctx?: EventContext): Promise<void> {
        const order = await db.order.findFirst({ where: { id: orderId, instanceId } });
        if (!order) throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        if (order.paymentStatus === 'paid' && order.status !== 'pending' && order.status !== 'awaiting_payment') {
            return; // already processed
        }
        await db.$transaction([
            db.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'paid',
                    status: 'awaiting_approval',
                    fulfillmentStatus: 'awaiting_approval',
                    placedAt: order.placedAt ?? new Date(),
                },
            }),
            db.orderEvent.create({
                data: {
                    orderId, type: 'payment.paid', actor: actorOf(ctx),
                    message: ctx?.message ?? 'Payment confirmed; awaiting owner approval',
                    dataJsonb: (ctx?.data as object) ?? undefined,
                },
            }),
        ]);
    }

    /**
     * MANDATORY APPROVAL GATE.
     * Requires an explicit approver identity and an order that is paid and
     * awaiting_approval (or on_hold being released). Creates/updates the
     * SupplierOrder to `approved`. This is the only path that authorises a
     * later supplier purchase.
     */
    static async approveSupplierPurchase(
        orderId: string,
        instanceId: string,
        tenantId: string,
        approverUserId: string,
        supplierId: string,
    ): Promise<void> {
        if (!approverUserId) {
            throw new AppError(ERROR_CODES.FORBIDDEN, 'Approver identity required', 403);
        }
        const order = await db.order.findFirst({
            where: { id: orderId, instanceId, tenantId },
        });
        if (!order) throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
        if (order.paymentStatus !== 'paid') {
            throw new AppError(
                ERROR_CODES.APPROVAL_REQUIRED,
                'Order must be paid before the supplier purchase can be approved',
                409,
            );
        }
        if (order.status !== 'awaiting_approval' && order.status !== 'on_hold') {
            throw new AppError(
                ERROR_CODES.INVALID_ORDER_TRANSITION,
                `Cannot approve from status ${order.status}`,
                409,
            );
        }

        const idempotencyKey = `so_${orderId}`;
        await db.$transaction(async (tx) => {
            const existing = await tx.supplierOrder.findUnique({ where: { idempotencyKey } });
            if (existing) {
                await tx.supplierOrder.update({
                    where: { id: existing.id },
                    data: { status: 'approved', approvedBy: approverUserId, approvedAt: new Date() },
                });
            } else {
                await tx.supplierOrder.create({
                    data: {
                        tenantId, instanceId, orderId, supplierId,
                        status: 'approved',
                        approvedBy: approverUserId,
                        approvedAt: new Date(),
                        idempotencyKey,
                        currency: order.currency,
                    },
                });
            }
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'approved', fulfillmentStatus: 'approved' },
            });
            await tx.orderEvent.create({
                data: {
                    orderId,
                    type: 'approval.granted',
                    actor: `owner:${approverUserId}`,
                    message: 'Supplier purchase approved by owner',
                },
            });
        });
    }

    /**
     * Post-approval supplier purchase. Throws unless an `approved` SupplierOrder
     * exists — the structural guarantee that nothing is purchased un-approved.
     * The actual external call (AliExpress API) is performed by the caller /
     * automation runner; this only flips state once a placement result exists.
     */
    static async placeSupplierOrder(
        orderId: string,
        instanceId: string,
        result: { supplierOrderRef: string; placedCost?: number | null; raw?: unknown },
        ctx?: EventContext,
    ): Promise<void> {
        const supplierOrder = await db.supplierOrder.findFirst({
            where: { orderId, instanceId },
            orderBy: { createdAt: 'desc' },
        });
        if (!supplierOrder || (supplierOrder.status !== 'approved' && supplierOrder.status !== 'placing')) {
            throw new AppError(
                ERROR_CODES.APPROVAL_REQUIRED,
                'Supplier purchase is not approved; cannot place order',
                409,
            );
        }
        await db.$transaction([
            db.supplierOrder.update({
                where: { id: supplierOrder.id },
                data: {
                    status: 'placed',
                    supplierOrderRef: result.supplierOrderRef,
                    placedCost: result.placedCost ?? undefined,
                    placedAt: new Date(),
                    responseJsonb: (result.raw as object) ?? undefined,
                },
            }),
            db.order.update({
                where: { id: orderId },
                data: { status: 'fulfilling', fulfillmentStatus: 'supplier_ordered' },
            }),
            db.orderEvent.create({
                data: {
                    orderId,
                    type: 'supplier.placed',
                    actor: actorOf(ctx),
                    message: `Supplier order placed (${result.supplierOrderRef})`,
                    dataJsonb: { supplierOrderRef: result.supplierOrderRef },
                },
            }),
        ]);
    }
}
