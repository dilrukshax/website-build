/**
 * Pricing & margin engine.
 *
 * Pure, dependency-free price computation used at product import/review and
 * snapshotted onto order items at checkout. See
 * docs/ecommerce-dropshipping-automation-system-design.md §8.
 *
 * Money is handled as numbers rounded to 2 decimals at the boundary. Callers
 * persist results into Prisma Decimal columns; never mutate historical order
 * snapshots when rules/FX later change.
 */

export type MarginType = 'percent' | 'fixed';
export type RoundingMode = 'none' | 'end_99' | 'nearest_int';

export interface PricingRuleInput {
    marginType: MarginType;
    marginValue: number;
    roundingMode?: RoundingMode | string | null;
    minMargin?: number | null;
    fxRate?: number | null;
}

export interface ComputeSellPriceInput {
    /** Supplier cost in supplier currency. */
    cost: number;
    rule: PricingRuleInput;
    /** Overrides rule.fxRate when provided (e.g. store-profile default). */
    fxRate?: number | null;
}

export interface ComputedPrice {
    /** Final customer-facing price in store currency. */
    price: number;
    /** Cost converted to store currency (snapshot basis for profit). */
    costInStoreCurrency: number;
    /** Absolute margin applied (price - cost), store currency. */
    marginApplied: number;
}

function round2(value: number): number {
    // Avoid binary float drift (e.g. 1.005) before fixing to 2dp.
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Apply the configured rounding strategy to a positive price.
 */
export function applyRounding(price: number, mode: RoundingMode | string | null | undefined): number {
    const safe = Math.max(0, price);
    switch (mode) {
        case 'nearest_int':
            return Math.max(0, Math.round(safe));
        case 'end_99': {
            // Charm pricing: floor to integer then set .99 (never below 0.99).
            const floor = Math.floor(safe);
            const candidate = floor + 0.99;
            return candidate < 0.99 ? 0.99 : round2(candidate);
        }
        case 'none':
        default:
            return round2(safe);
    }
}

/**
 * Compute the customer-facing sell price from supplier cost and a pricing rule.
 *
 * Steps (per design §8): FX-convert cost → apply margin → enforce min margin
 * floor → apply rounding.
 */
export function computeSellPrice(input: ComputeSellPriceInput): ComputedPrice {
    const { cost, rule } = input;

    if (!isFiniteNumber(cost) || cost < 0) {
        throw new Error('Pricing: cost must be a non-negative finite number');
    }
    if (!isFiniteNumber(rule.marginValue) || rule.marginValue < 0) {
        throw new Error('Pricing: marginValue must be a non-negative finite number');
    }

    const fxRate = input.fxRate ?? rule.fxRate ?? 1;
    if (!isFiniteNumber(fxRate) || fxRate <= 0) {
        throw new Error('Pricing: fxRate must be a positive finite number');
    }

    const costInStoreCurrency = round2(cost * fxRate);

    let price: number;
    if (rule.marginType === 'percent') {
        price = costInStoreCurrency * (1 + rule.marginValue / 100);
    } else if (rule.marginType === 'fixed') {
        price = costInStoreCurrency + rule.marginValue;
    } else {
        throw new Error(`Pricing: unknown marginType "${String(rule.marginType)}"`);
    }

    // Enforce a minimum absolute margin floor before rounding.
    if (isFiniteNumber(rule.minMargin) && rule.minMargin !== null && rule.minMargin >= 0) {
        const floorPrice = costInStoreCurrency + rule.minMargin;
        if (price < floorPrice) {
            price = floorPrice;
        }
    }

    const finalPrice = applyRounding(price, rule.roundingMode ?? 'end_99');

    return {
        price: finalPrice,
        costInStoreCurrency,
        marginApplied: round2(finalPrice - costInStoreCurrency),
    };
}

/**
 * Per-order profit from snapshots (never recomputed from live cost/FX).
 */
export function computeOrderProfit(
    items: Array<{ unitPrice: number; unitCost?: number | null; quantity: number }>,
    extraFees = 0,
): number {
    const gross = items.reduce((sum, it) => {
        const revenue = (it.unitPrice || 0) * (it.quantity || 0);
        const cost = (it.unitCost ?? 0) * (it.quantity || 0);
        return sum + (revenue - cost);
    }, 0);
    return round2(gross - (extraFees || 0));
}
