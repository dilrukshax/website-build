import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderStateService } from '../../services/order-state.service';

const mocks = vi.hoisted(() => ({
    orderFindFirst: vi.fn(),
    supplierOrderFindFirst: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        order: { findFirst: mocks.orderFindFirst },
        supplierOrder: { findFirst: mocks.supplierOrderFindFirst },
        orderEvent: { create: vi.fn() },
        $transaction: vi.fn(),
    },
}));

describe('OrderStateService — mandatory approval gate (design §12)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('refuses approval when the order is not paid', async () => {
        mocks.orderFindFirst.mockResolvedValue({
            id: 'o1', instanceId: 'i1', tenantId: 't1',
            status: 'awaiting_approval', paymentStatus: 'unpaid', currency: 'USD',
        });
        await expect(
            OrderStateService.approveSupplierPurchase('o1', 'i1', 't1', 'user-1', 'sup-1'),
        ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });
    });

    it('refuses approval without an approver identity', async () => {
        await expect(
            OrderStateService.approveSupplierPurchase('o1', 'i1', 't1', '', 'sup-1'),
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('refuses approval from an illegal status', async () => {
        mocks.orderFindFirst.mockResolvedValue({
            id: 'o1', instanceId: 'i1', tenantId: 't1',
            status: 'shipped', paymentStatus: 'paid', currency: 'USD',
        });
        await expect(
            OrderStateService.approveSupplierPurchase('o1', 'i1', 't1', 'user-1', 'sup-1'),
        ).rejects.toMatchObject({ code: 'INVALID_ORDER_TRANSITION' });
    });

    it('cannot place a supplier order without an approved SupplierOrder', async () => {
        mocks.supplierOrderFindFirst.mockResolvedValue(null);
        await expect(
            OrderStateService.placeSupplierOrder('o1', 'i1', { supplierOrderRef: 'X' }),
        ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });
    });

    it('cannot place a supplier order when SupplierOrder is still awaiting_approval', async () => {
        mocks.supplierOrderFindFirst.mockResolvedValue({
            id: 'so1', status: 'awaiting_approval',
        });
        await expect(
            OrderStateService.placeSupplierOrder('o1', 'i1', { supplierOrderRef: 'X' }),
        ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });
    });
});

describe('OrderStateService — transition legality', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects an illegal headline transition', async () => {
        mocks.orderFindFirst.mockResolvedValue({ id: 'o1', instanceId: 'i1', status: 'pending' });
        await expect(
            OrderStateService.transition('o1', 'i1', 'delivered'),
        ).rejects.toMatchObject({ code: 'INVALID_ORDER_TRANSITION' });
    });

    it('404s when the order is missing', async () => {
        mocks.orderFindFirst.mockResolvedValue(null);
        await expect(
            OrderStateService.transition('nope', 'i1', 'cancelled'),
        ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
    });
});
