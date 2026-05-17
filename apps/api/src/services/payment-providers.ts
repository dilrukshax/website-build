/**
 * Payment provider abstraction (design §11).
 *
 * One interface, swappable implementations. v1 ships a working **manual /
 * offline** provider (no external keys needed): the owner confirms payment
 * from the dashboard. Stripe / PayPal / local-gateway implementations are
 * scaffolded behind the same interface and report `configured:false` until
 * their env credentials are supplied — they never silently no-op a charge.
 *
 * Webhooks are verified + idempotent at the controller layer
 * (payment_webhook_events unique [provider, event_id]).
 */

export type PaymentProviderName = 'stripe' | 'paypal' | 'local' | 'manual';

export interface CheckoutSessionInput {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    customerEmail: string;
    /** Where to send the buyer after the gateway (order tracking page). */
    returnUrl: string;
}

export interface CheckoutSession {
    provider: PaymentProviderName;
    /** Redirect URL or client token the storefront uses to collect payment. */
    redirectUrl?: string;
    clientSecret?: string;
    providerRef?: string;
    /** Manual provider: payment is confirmed later by the owner. */
    manualConfirmation?: boolean;
}

export interface WebhookResult {
    eventId: string;
    orderRef: string;
    status: 'paid' | 'failed' | 'refunded' | 'ignored';
    amount?: number;
    currency?: string;
    providerRef?: string;
}

export interface RefundInput {
    paymentRef: string;
    amount: number;
    currency: string;
    reason?: string;
}

export interface RefundResult {
    providerRef?: string;
    status: 'succeeded' | 'processing' | 'failed';
}

export interface PaymentProvider {
    readonly name: PaymentProviderName;
    isConfigured(): boolean;
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;
    verifyAndParseWebhook(rawBody: string, signature: string | undefined): Promise<WebhookResult>;
    refund(input: RefundInput): Promise<RefundResult>;
}

class NotConfiguredError extends Error {
    constructor(provider: string) {
        super(`Payment provider "${provider}" is not configured. Set its credentials in env.`);
        this.name = 'NotConfiguredError';
    }
}

/** v1 default: capture the order, owner confirms payment manually. */
export class ManualPaymentProvider implements PaymentProvider {
    readonly name = 'manual' as const;
    isConfigured(): boolean { return true; }

    async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
        return {
            provider: 'manual',
            redirectUrl: input.returnUrl,
            manualConfirmation: true,
        };
    }

    async verifyAndParseWebhook(): Promise<WebhookResult> {
        // Manual provider has no webhook; payment is confirmed via owner action.
        return { eventId: '', orderRef: '', status: 'ignored' };
    }

    async refund(): Promise<RefundResult> {
        // Recorded as an offline refund; no external call.
        return { status: 'succeeded' };
    }
}

/** Scaffold — wire with STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (design §11/§23). */
export class StripePaymentProvider implements PaymentProvider {
    readonly name = 'stripe' as const;
    isConfigured(): boolean {
        return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    }
    async createCheckoutSession(): Promise<CheckoutSession> {
        if (!this.isConfigured()) throw new NotConfiguredError('stripe');
        // TODO(phase-1 payments): Stripe PaymentIntents/Checkout Session.
        throw new NotConfiguredError('stripe');
    }
    async verifyAndParseWebhook(): Promise<WebhookResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('stripe');
        throw new NotConfiguredError('stripe');
    }
    async refund(): Promise<RefundResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('stripe');
        throw new NotConfiguredError('stripe');
    }
}

/** Scaffold — wire with PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (design §11/§23). */
export class PayPalPaymentProvider implements PaymentProvider {
    readonly name = 'paypal' as const;
    isConfigured(): boolean {
        return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    }
    async createCheckoutSession(): Promise<CheckoutSession> {
        if (!this.isConfigured()) throw new NotConfiguredError('paypal');
        throw new NotConfiguredError('paypal');
    }
    async verifyAndParseWebhook(): Promise<WebhookResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('paypal');
        throw new NotConfiguredError('paypal');
    }
    async refund(): Promise<RefundResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('paypal');
        throw new NotConfiguredError('paypal');
    }
}

/** Scaffold — local gateway (assumption: PayHere; confirm per design §22). */
export class LocalPaymentProvider implements PaymentProvider {
    readonly name = 'local' as const;
    isConfigured(): boolean {
        return Boolean(process.env.LOCAL_GATEWAY_MERCHANT_ID && process.env.LOCAL_GATEWAY_SECRET);
    }
    async createCheckoutSession(): Promise<CheckoutSession> {
        if (!this.isConfigured()) throw new NotConfiguredError('local');
        throw new NotConfiguredError('local');
    }
    async verifyAndParseWebhook(): Promise<WebhookResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('local');
        throw new NotConfiguredError('local');
    }
    async refund(): Promise<RefundResult> {
        if (!this.isConfigured()) throw new NotConfiguredError('local');
        throw new NotConfiguredError('local');
    }
}

const REGISTRY: Record<PaymentProviderName, PaymentProvider> = {
    manual: new ManualPaymentProvider(),
    stripe: new StripePaymentProvider(),
    paypal: new PayPalPaymentProvider(),
    local: new LocalPaymentProvider(),
};

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
    return REGISTRY[name] ?? REGISTRY.manual;
}

/** Providers that are usable right now (manual always; others when keyed). */
export function listEnabledProviders(): PaymentProviderName[] {
    return (Object.keys(REGISTRY) as PaymentProviderName[]).filter((n) =>
        REGISTRY[n].isConfigured(),
    );
}
