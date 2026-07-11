import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InquiriesController } from '../../controllers/inquiries.controller';

const mocks = vi.hoisted(() => ({
    customerFindFirst: vi.fn(),
    customerCreate: vi.fn(),
    customerUpdate: vi.fn(),
    inquiryCreate: vi.fn(),
}));

vi.mock('@project-aurora/database', () => ({
    db: {
        customer: {
            findFirst: mocks.customerFindFirst,
            create: mocks.customerCreate,
            update: mocks.customerUpdate,
        },
        inquiry: {
            create: mocks.inquiryCreate,
        },
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

describe('InquiriesController.create customer linking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates inquiry + customer link with source metadata for a new contact', async () => {
        mocks.customerFindFirst.mockResolvedValue(null);
        mocks.customerCreate.mockResolvedValue({
            id: 'cust-1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            phone: '+1-555-0100',
        });
        mocks.inquiryCreate.mockResolvedValue({ id: 'inq-1' });

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
            body: {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@example.com',
                phone: '+1-555-0100',
                message: 'Hello',
                sourceType: 'contact_form',
                sourcePageSlug: '/contact',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InquiriesController.create(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.customerCreate).toHaveBeenCalled();
        expect(mocks.inquiryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                customerId: 'cust-1',
                name: 'John Smith',
                email: 'john@example.com',
                phone: '+1-555-0100',
                message: 'Hello',
                sourceType: 'contact_form',
                sourcePageSlug: '/contact',
            }),
            select: expect.any(Object),
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('reuses an existing customer and updates only missing fields', async () => {
        mocks.customerFindFirst.mockResolvedValue({
            id: 'cust-2',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: null,
        });
        mocks.customerUpdate.mockResolvedValue({
            id: 'cust-2',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '+1-555-0999',
        });
        mocks.inquiryCreate.mockResolvedValue({ id: 'inq-2' });

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
            body: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'JANE@EXAMPLE.COM',
                phone: '+1-555-0999',
                message: 'Need details',
                sourcePageSlug: 'Contact',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InquiriesController.create(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.customerCreate).not.toHaveBeenCalled();
        expect(mocks.customerUpdate).toHaveBeenCalledWith({
            where: { id: 'cust-2' },
            data: { phone: '+1-555-0999' },
        });
        expect(mocks.inquiryCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                customerId: 'cust-2',
                sourceType: 'contact_form',
                sourcePageSlug: '/contact',
                email: 'jane@example.com',
            }),
            select: expect.any(Object),
        });
    });
});
