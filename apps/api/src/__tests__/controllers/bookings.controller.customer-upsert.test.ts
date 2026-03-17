import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingsController } from '../../controllers/bookings.controller';

const mocks = vi.hoisted(() => ({
    serviceFindFirst: vi.fn(),
    customerFindFirst: vi.fn(),
    customerCreate: vi.fn(),
    customerUpdate: vi.fn(),
    bookingCreate: vi.fn(),
    assertCanCreateBooking: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        service: {
            findFirst: mocks.serviceFindFirst,
        },
        customer: {
            findFirst: mocks.customerFindFirst,
            create: mocks.customerCreate,
            update: mocks.customerUpdate,
        },
        booking: {
            create: mocks.bookingCreate,
        },
    },
}));

vi.mock('../../services/plan-policy.service', () => ({
    PlanPolicyService: {
        assertCanCreateBooking: mocks.assertCanCreateBooking,
    },
}));

function createResponse() {
    const res: {
        status: ReturnType<typeof vi.fn>;
        json: ReturnType<typeof vi.fn>;
    } = {
        status: vi.fn(),
        json: vi.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    return res;
}

describe('BookingsController.create customer enrichment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.assertCanCreateBooking.mockResolvedValue(undefined);
        mocks.serviceFindFirst.mockResolvedValue({
            id: 'service-1',
            price: 120,
            currency: 'USD',
            isActive: true,
        });
        mocks.bookingCreate.mockResolvedValue({ id: 'booking-1' });
    });

    it('updates missing customer phone during booking submission', async () => {
        mocks.customerFindFirst.mockResolvedValue({
            id: 'cust-1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            phone: null,
        });
        mocks.customerUpdate.mockResolvedValue({ id: 'cust-1', phone: '+1-555-1234' });

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
            body: {
                serviceId: 'service-1',
                startTime: '2026-03-15T10:00:00.000Z',
                endTime: '2026-03-15T11:00:00.000Z',
                customer: {
                    firstName: 'John',
                    lastName: 'Smith',
                    email: 'john@example.com',
                    phone: '+1-555-1234',
                },
            },
        } as any;

        const res = createResponse();
        const next = vi.fn();

        await BookingsController.create(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.customerCreate).not.toHaveBeenCalled();
        expect(mocks.customerUpdate).toHaveBeenCalledWith({
            where: { id: 'cust-1' },
            data: { phone: '+1-555-1234' },
        });
        expect(mocks.bookingCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                customerId: 'cust-1',
                serviceId: 'service-1',
            }),
            include: { customer: true, service: true },
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
