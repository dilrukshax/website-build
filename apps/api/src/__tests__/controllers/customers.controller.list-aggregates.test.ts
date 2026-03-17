import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomersController } from '../../controllers/customers.controller';

const mocks = vi.hoisted(() => ({
    customerFindMany: vi.fn(),
    customerCount: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        customer: {
            findMany: mocks.customerFindMany,
            count: mocks.customerCount,
        },
    },
}));

function createResponse() {
    const res: { json: ReturnType<typeof vi.fn> } = {
        json: vi.fn(),
    };

    res.json.mockReturnValue(res);
    return res;
}

describe('CustomersController.list aggregates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns booking/inquiry counts and latest inquiry source fields', async () => {
        const lastInquiryAt = new Date('2026-03-10T10:00:00.000Z');

        mocks.customerFindMany.mockResolvedValue([
            {
                id: 'cust-1',
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@example.com',
                phone: '+1-555-0100',
                notes: null,
                createdAt: new Date('2026-03-01T00:00:00.000Z'),
                updatedAt: new Date('2026-03-10T00:00:00.000Z'),
                _count: {
                    bookings: 4,
                    inquiries: 2,
                },
                inquiries: [
                    {
                        createdAt: lastInquiryAt,
                        sourcePageSlug: '/contact',
                    },
                ],
            },
        ]);

        mocks.customerCount.mockResolvedValue(1);

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
            query: {},
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await CustomersController.list(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [
                expect.objectContaining({
                    id: 'cust-1',
                    bookingCount: 4,
                    inquiryCount: 2,
                    lastInquiryAt,
                    lastInquirySourcePageSlug: '/contact',
                }),
            ],
            meta: {
                page: 1,
                limit: 20,
                total: 1,
                pages: 1,
            },
        });
    });
});
