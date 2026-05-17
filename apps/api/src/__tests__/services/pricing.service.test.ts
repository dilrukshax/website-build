import { describe, expect, it } from 'vitest';
import {
    applyRounding,
    computeOrderProfit,
    computeSellPrice,
} from '../../services/pricing.service';

describe('pricing engine — computeSellPrice', () => {
    it('applies a percent margin with end_99 rounding', () => {
        const result = computeSellPrice({
            cost: 10,
            rule: { marginType: 'percent', marginValue: 50, roundingMode: 'end_99' },
        });
        // 10 * 1.5 = 15 -> charm 15.99
        expect(result.price).toBe(15.99);
        expect(result.costInStoreCurrency).toBe(10);
        expect(result.marginApplied).toBe(5.99);
    });

    it('applies a fixed margin', () => {
        const result = computeSellPrice({
            cost: 8,
            rule: { marginType: 'fixed', marginValue: 7, roundingMode: 'none' },
        });
        expect(result.price).toBe(15);
        expect(result.marginApplied).toBe(7);
    });

    it('FX-converts supplier cost into store currency', () => {
        const result = computeSellPrice({
            cost: 100, // supplier currency
            rule: { marginType: 'percent', marginValue: 0, roundingMode: 'none' },
            fxRate: 0.012, // -> 1.20 store currency
        });
        expect(result.costInStoreCurrency).toBe(1.2);
        expect(result.price).toBe(1.2);
    });

    it('enforces the minimum margin floor', () => {
        const result = computeSellPrice({
            cost: 20,
            rule: { marginType: 'percent', marginValue: 5, roundingMode: 'none', minMargin: 10 },
        });
        // 20 * 1.05 = 21, but min margin floor = 20 + 10 = 30
        expect(result.price).toBe(30);
        expect(result.marginApplied).toBe(10);
    });

    it('rejects invalid input', () => {
        expect(() =>
            computeSellPrice({ cost: -1, rule: { marginType: 'percent', marginValue: 10 } }),
        ).toThrow();
        expect(() =>
            computeSellPrice({ cost: 10, rule: { marginType: 'percent', marginValue: 10 }, fxRate: 0 }),
        ).toThrow();
    });
});

describe('pricing engine — applyRounding', () => {
    it('charm-prices with end_99', () => {
        expect(applyRounding(15.4, 'end_99')).toBe(15.99);
        expect(applyRounding(0.2, 'end_99')).toBe(0.99);
    });
    it('rounds to nearest integer', () => {
        expect(applyRounding(15.4, 'nearest_int')).toBe(15);
        expect(applyRounding(15.6, 'nearest_int')).toBe(16);
    });
    it('passes through with none (2dp)', () => {
        expect(applyRounding(15.005, 'none')).toBe(15.01);
    });
});

describe('pricing engine — computeOrderProfit', () => {
    it('computes profit from order snapshots only', () => {
        const profit = computeOrderProfit(
            [
                { unitPrice: 15.99, unitCost: 10, quantity: 2 },
                { unitPrice: 9.99, unitCost: 4, quantity: 1 },
            ],
            3, // fees/shipping
        );
        // (5.99*2) + (5.99*1) - 3 = 11.98 + 5.99 - 3 = 14.97
        expect(profit).toBe(14.97);
    });
});
