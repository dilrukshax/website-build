import { z } from 'zod';

// ---- Store commerce settings ----
export const updateStoreCommerceSettingsSchema = z.object({
    niche: z.string().max(255).optional().nullable(),
    storeCurrency: z.string().length(3).optional(),
    legalBusinessName: z.string().max(255).optional().nullable(),
    businessAddress: z.string().max(2000).optional().nullable(),
    supportEmail: z.string().email().max(255).optional().nullable(),
    supportPhone: z.string().max(64).optional().nullable(),
    supportWhatsapp: z.string().max(64).optional().nullable(),
    shippingPolicy: z.string().max(20000).optional().nullable(),
    returnsPolicy: z.string().max(20000).optional().nullable(),
    refundPolicy: z.string().max(20000).optional().nullable(),
    privacyPolicy: z.string().max(20000).optional().nullable(),
    termsPolicy: z.string().max(20000).optional().nullable(),
    shippingLeadDays: z.number().int().min(0).max(365).optional().nullable(),
    defaultFxRate: z.number().positive().optional().nullable(),
    orderNumberPrefix: z.string().max(12).optional().nullable(),
});

// ---- Pricing rule ----
export const upsertPricingRuleSchema = z.object({
    marginType: z.enum(['percent', 'fixed']),
    marginValue: z.number().min(0),
    roundingMode: z.enum(['none', 'end_99', 'nearest_int']).default('end_99'),
    minMargin: z.number().min(0).optional().nullable(),
    fxRate: z.number().positive().optional().nullable(),
});

// ---- Suppliers ----
export const createSupplierSchema = z.object({
    type: z.enum(['aliexpress']).default('aliexpress'),
    displayName: z.string().min(1).max(255),
});

// ---- Product imports (assisted-manual mode; identical pipeline to API mode) ----
export const createImportSchema = z.object({
    supplierId: z.string().uuid(),
    supplierItemRef: z.string().min(1).max(255),
    sourceUrl: z.string().url().max(2048).optional().nullable(),
    raw: z.record(z.unknown()).default({}),
    normalized: z
        .object({
            name: z.string().min(1).max(255),
            description: z.string().max(20000).optional().nullable(),
            imageUrl: z.string().url().max(2048).optional().nullable(),
            gallery: z.array(z.string().url()).max(20).optional(),
            variants: z
                .array(
                    z.object({
                        sku: z.string().max(120).optional().nullable(),
                        options: z.record(z.string()).optional(),
                        supplierVariantRef: z.string().max(255).optional().nullable(),
                        cost: z.number().min(0),
                        availability: z
                            .enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'unknown'])
                            .default('unknown'),
                        stockQty: z.number().int().min(0).optional().nullable(),
                    }),
                )
                .min(1),
        })
        .optional(),
});

export const reviewImportSchema = z.object({
    reviewNote: z.string().max(2000).optional().nullable(),
});

// ---- Product variants ----
export const createVariantSchema = z.object({
    sku: z.string().max(120).optional().nullable(),
    options: z.record(z.string()).optional(),
    supplierVariantRef: z.string().max(255).optional().nullable(),
    costPrice: z.number().min(0).optional().nullable(),
    price: z.number().positive(),
    compareAtPrice: z.number().min(0).optional().nullable(),
    currency: z.string().length(3).default('USD'),
    availability: z
        .enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'unknown'])
        .default('unknown'),
    stockQty: z.number().int().min(0).optional().nullable(),
    imageUrl: z.string().url().max(2048).optional().nullable(),
    isActive: z.boolean().optional(),
});
export const updateVariantSchema = createVariantSchema.partial();

// ---- Cart (public) ----
export const addCartItemSchema = z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99).default(1),
});
export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(0).max(99),
});

// ---- Checkout (public) ----
const addressSchema = z.object({
    fullName: z.string().min(1).max(255),
    line1: z.string().min(1).max(255),
    line2: z.string().max(255).optional().nullable(),
    city: z.string().min(1).max(120),
    region: z.string().max(120).optional().nullable(),
    postalCode: z.string().max(32).optional().nullable(),
    countryCode: z.string().min(2).max(2),
    phone: z.string().max(64).optional().nullable(),
});
export const checkoutSchema = z.object({
    cartToken: z.string().min(8).max(64),
    email: z.string().email().max(255),
    phone: z.string().max(64).optional().nullable(),
    customerNote: z.string().max(2000).optional().nullable(),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    paymentProvider: z.enum(['stripe', 'paypal', 'local', 'manual']).default('manual'),
});

// ---- Public order tracking ----
export const trackOrderSchema = z.object({
    orderNumber: z.string().min(1).max(64).optional(),
    email: z.string().email().optional(),
    accessToken: z.string().min(8).optional(),
}).refine(
    (v) => (v.orderNumber && v.email) || v.accessToken,
    { message: 'Provide accessToken, or orderNumber + email' },
);

// ---- Owner order actions ----
export const orderNoteSchema = z.object({
    internalNote: z.string().max(4000),
});
export const orderHoldSchema = z.object({
    reason: z.string().max(1000).optional().nullable(),
});
export const orderCancelSchema = z.object({
    reason: z.string().max(1000).optional().nullable(),
});
export const markPaidSchema = z.object({
    provider: z.enum(['stripe', 'paypal', 'local', 'manual']).default('manual'),
    providerRef: z.string().max(255).optional().nullable(),
    amount: z.number().positive().optional(),
});
export const createRefundSchema = z.object({
    amount: z.number().positive(),
    reason: z.string().max(1000).optional().nullable(),
});
export const placeSupplierOrderSchema = z.object({
    supplierOrderRef: z.string().min(1).max(255),
    placedCost: z.number().min(0).optional().nullable(),
});
export const upsertShipmentSchema = z.object({
    carrier: z.string().max(120).optional().nullable(),
    trackingNumber: z.string().max(255).optional().nullable(),
    trackingUrl: z.string().url().max(2048).optional().nullable(),
    status: z
        .enum(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled'])
        .optional(),
    estimatedDeliveryAt: z.string().datetime().optional().nullable(),
});
export const listOrdersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum([
            'pending', 'awaiting_payment', 'paid', 'awaiting_approval', 'approved',
            'fulfilling', 'shipped', 'delivered', 'cancelled', 'refunded', 'on_hold',
        ])
        .optional(),
});
