import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { logger } from '@booking-engine/core';
import {
    getPaymentProvider,
    type PaymentProviderName,
} from '../services/payment-providers';
import { OrderStateService } from '../services/order-state.service';

/**
 * Payment webhook boundary (design §5/§11). Public but signature-verified and
 * idempotent (payment_webhook_events unique [provider, event_id]). Never
 * trusts client redirects. Unconfigured providers no-op safely.
 */
export class PaymentWebhooksController {
    static async handle(req: Request, res: Response, _next: NextFunction): Promise<void> {
        const providerName = req.params.provider as PaymentProviderName;
        const provider = getPaymentProvider(providerName);

        if (!provider || !provider.isConfigured()) {
            // Provider not wired yet (Phase-1/2 dependency). Acknowledge so the
            // gateway does not retry-storm; nothing is mutated.
            logger.warn('Payment webhook received for unconfigured provider', { providerName });
            res.status(200).json({ success: true, data: { received: true, processed: false } });
            return;
        }

        try {
            const rawBody =
                typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
            const signature =
                (req.headers['stripe-signature'] as string) ||
                (req.headers['paypal-transmission-sig'] as string) ||
                (req.headers['x-webhook-signature'] as string) ||
                undefined;

            const result = await provider.verifyAndParseWebhook(rawBody, signature);
            if (!result.eventId || result.status === 'ignored') {
                res.status(200).json({ success: true, data: { received: true, processed: false } });
                return;
            }

            // Idempotency: unique [provider, event_id]. Duplicate => already done.
            try {
                await db.paymentWebhookEvent.create({
                    data: {
                        provider: providerName as 'stripe' | 'paypal' | 'local',
                        eventId: result.eventId,
                        payloadJsonb: JSON.parse(rawBody || '{}'),
                    },
                });
            } catch {
                res.status(200).json({ success: true, data: { received: true, duplicate: true } });
                return;
            }

            const order = await db.order.findFirst({
                where: { OR: [{ id: result.orderRef }, { orderNumber: result.orderRef }] },
            });
            if (order) {
                if (result.status === 'paid') {
                    await db.payment.updateMany({
                        where: { orderId: order.id },
                        data: { status: 'paid', providerRef: result.providerRef, capturedAt: new Date() },
                    });
                    await OrderStateService.markPaid(order.id, order.instanceId, {
                        actor: `provider:${providerName}`,
                    });
                } else if (result.status === 'failed') {
                    await OrderStateService.setPaymentStatus(order.id, order.instanceId, 'failed', {
                        actor: `provider:${providerName}`,
                    });
                } else if (result.status === 'refunded') {
                    await OrderStateService.setPaymentStatus(order.id, order.instanceId, 'refunded', {
                        actor: `provider:${providerName}`,
                    });
                }
            }

            await db.paymentWebhookEvent.updateMany({
                where: { provider: providerName as 'stripe' | 'paypal' | 'local', eventId: result.eventId },
                data: { processedAt: new Date() },
            });
            res.status(200).json({ success: true, data: { received: true, processed: true } });
        } catch (error) {
            logger.error('Payment webhook processing error', { providerName, error });
            // 200 to avoid retry storms; failures are logged for reconciliation.
            res.status(200).json({ success: true, data: { received: true, processed: false } });
        }
    }
}
