import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

/**
 * Public order tracking (design §10/§18). Lookup by non-enumerable
 * accessToken, or orderNumber + matching email. Never exposes internal notes,
 * costs, supplier refs, or sequential ids.
 */
export class OrderTrackingController {
    static async track(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const { orderNumber, email, accessToken } = req.body as {
                orderNumber?: string;
                email?: string;
                accessToken?: string;
            };

            const where = accessToken
                ? { instanceId, accessToken }
                : {
                    instanceId,
                    orderNumber: orderNumber!,
                    email: { equals: email!, mode: 'insensitive' as const },
                };

            const order = await db.order.findFirst({
                where,
                include: {
                    items: true,
                    shipments: { orderBy: { createdAt: 'desc' } },
                    events: { orderBy: { createdAt: 'asc' } },
                },
            });
            if (!order) {
                throw new AppError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
            }

            res.json({
                success: true,
                data: {
                    orderNumber: order.orderNumber,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    fulfillmentStatus: order.fulfillmentStatus,
                    currency: order.currency,
                    grandTotal: Number(order.grandTotal),
                    placedAt: order.placedAt,
                    items: order.items.map((i) => ({
                        name: i.nameSnapshot,
                        options: i.optionsSnapshot,
                        quantity: i.quantity,
                        unitPrice: Number(i.unitPrice),
                    })),
                    shipments: order.shipments.map((s) => ({
                        carrier: s.carrier,
                        trackingNumber: s.trackingNumber,
                        trackingUrl: s.trackingUrl,
                        status: s.status,
                        shippedAt: s.shippedAt,
                        estimatedDeliveryAt: s.estimatedDeliveryAt,
                        deliveredAt: s.deliveredAt,
                    })),
                    timeline: order.events
                        .filter((e) => !e.type.startsWith('internal.'))
                        .map((e) => ({
                            type: e.type,
                            message: e.message,
                            at: e.createdAt,
                        })),
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
