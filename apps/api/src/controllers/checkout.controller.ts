import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import {
    allocateOrderNumber,
    assertCommerceEnabled,
    generateOrderAccessToken,
} from '../services/commerce.service';
import { upsertCustomerByEmail } from '../services/customer-upsert.service';
import { getPaymentProvider, type PaymentProviderName } from '../services/payment-providers';

/**
 * Public checkout (design §10). Creates the Order from the server-priced cart,
 * captures customer + address, opens a payment session, and moves the order to
 * awaiting_payment. Payment is only ever confirmed by webhook / owner action,
 * never by a client redirect.
 */
export class CheckoutController {
    static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            await assertCommerceEnabled(instanceId);

            const {
                cartToken, email, phone, customerNote,
                shippingAddress, billingAddress, paymentProvider,
            } = req.body;

            const cart = await db.cart.findFirst({
                where: { token: cartToken, instanceId, status: 'active' },
                include: { items: true },
            });
            if (!cart) throw new AppError(ERROR_CODES.CART_NOT_FOUND, 'Cart not found', 404);
            if (cart.items.length === 0) {
                throw new AppError(ERROR_CODES.CART_EMPTY, 'Cart is empty', 400);
            }

            // Re-validate variants server-side and re-snapshot prices/costs.
            const variantIds = cart.items.map((i) => i.productVariantId);
            const variants = await db.productVariant.findMany({
                where: { id: { in: variantIds }, instanceId },
                include: { product: true },
            });
            const byId = new Map(variants.map((v) => [v.id, v]));

            const lineItems = cart.items.map((item) => {
                const v = byId.get(item.productVariantId);
                if (!v || !v.isActive || v.product.status !== 'active') {
                    throw new AppError(
                        ERROR_CODES.PRODUCT_UNAVAILABLE,
                        `An item in your cart is no longer available`,
                        409,
                    );
                }
                if (v.availability === 'out_of_stock' || v.availability === 'discontinued') {
                    throw new AppError(
                        ERROR_CODES.PRODUCT_UNAVAILABLE,
                        `"${v.product.name}" is out of stock`,
                        409,
                    );
                }
                const unitPrice = Number(v.price);
                const unitCost = v.costPrice != null ? Number(v.costPrice) : null;
                return {
                    productId: v.productId,
                    productVariantId: v.id,
                    nameSnapshot: v.product.name,
                    optionsSnapshot: (v.optionsJsonb as object) ?? undefined,
                    skuSnapshot: v.sku ?? null,
                    supplierItemRef: v.product.supplierItemRef ?? null,
                    supplierVariantRef: v.supplierVariantRef ?? null,
                    quantity: item.quantity,
                    unitPrice,
                    unitCost,
                    lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
                };
            });

            const subtotal = Math.round(
                lineItems.reduce((s, l) => s + l.lineTotal, 0) * 100,
            ) / 100;
            const estimatedCost = Math.round(
                lineItems.reduce((s, l) => s + (l.unitCost ?? 0) * l.quantity, 0) * 100,
            ) / 100;

            const customer = await upsertCustomerByEmail({
                tenantId,
                instanceId,
                firstName: shippingAddress.fullName?.split(' ')[0] || 'Customer',
                lastName: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
                email,
                phone: phone ?? null,
            });

            const order = await db.$transaction(async (tx) => {
                const orderNumber = await allocateOrderNumber(tx, tenantId, instanceId);
                const created = await tx.order.create({
                    data: {
                        tenantId,
                        instanceId,
                        orderNumber,
                        customerId: customer.id,
                        email,
                        phone: phone ?? null,
                        currency: cart.currency,
                        subtotal,
                        grandTotal: subtotal,
                        estimatedCost,
                        status: 'pending',
                        paymentStatus: 'unpaid',
                        fulfillmentStatus: 'unfulfilled',
                        customerNote: customerNote ?? null,
                        accessToken: generateOrderAccessToken(),
                        items: { create: lineItems },
                        addresses: {
                            create: [
                                { type: 'shipping', ...shippingAddress },
                                ...(billingAddress
                                    ? [{ type: 'billing' as const, ...billingAddress }]
                                    : []),
                            ],
                        },
                        events: {
                            create: {
                                type: 'order.pending',
                                actor: 'customer',
                                message: 'Order created at checkout',
                            },
                        },
                    },
                });
                await tx.order.update({
                    where: { id: created.id },
                    data: { status: 'awaiting_payment' },
                });
                await tx.cart.update({
                    where: { id: cart.id },
                    data: { status: 'converted', email },
                });
                return created;
            });

            const provider = getPaymentProvider(paymentProvider as PaymentProviderName);
            const returnUrl = `/orders/track?accessToken=${order.accessToken}`;
            const session = await provider.createCheckoutSession({
                orderId: order.id,
                orderNumber: order.orderNumber,
                amount: subtotal,
                currency: cart.currency,
                customerEmail: email,
                returnUrl,
            });

            await db.payment.create({
                data: {
                    tenantId,
                    instanceId,
                    orderId: order.id,
                    provider: (provider.name === 'manual' ? 'local' : provider.name) as
                        'stripe' | 'paypal' | 'local',
                    amount: subtotal,
                    currency: cart.currency,
                    status: 'unpaid',
                    methodJsonb: { providerName: provider.name },
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    orderNumber: order.orderNumber,
                    accessToken: order.accessToken,
                    amount: subtotal,
                    currency: cart.currency,
                    payment: session,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
