import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertCustomerByEmail } from '../../services/customer-upsert.service';

const mocks = vi.hoisted(() => ({
    customerFindFirst: vi.fn(),
    customerCreate: vi.fn(),
    customerUpdate: vi.fn(),
}));

vi.mock('@project-aurora/database', () => ({
    db: {
        customer: {
            findFirst: mocks.customerFindFirst,
            create: mocks.customerCreate,
            update: mocks.customerUpdate,
        },
    },
}));

describe('upsertCustomerByEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a new customer when no existing email match is found', async () => {
        mocks.customerFindFirst.mockResolvedValue(null);
        mocks.customerCreate.mockResolvedValue({ id: 'cust-1' });

        const result = await upsertCustomerByEmail({
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            firstName: 'John',
            lastName: 'Smith',
            email: ' John.Smith@Example.com ',
            phone: ' +1-555-0199 ',
        });

        expect(mocks.customerFindFirst).toHaveBeenCalledWith({
            where: {
                instanceId: 'instance-1',
                email: {
                    equals: 'john.smith@example.com',
                    mode: 'insensitive',
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        expect(mocks.customerCreate).toHaveBeenCalledWith({
            data: {
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                phone: '+1-555-0199',
            },
        });

        expect(result).toEqual({ id: 'cust-1' });
    });

    it('updates only missing profile fields for existing customers', async () => {
        mocks.customerFindFirst.mockResolvedValue({
            id: 'cust-2',
            firstName: 'Jane',
            lastName: '',
            email: 'jane@example.com',
            phone: null,
        });
        mocks.customerUpdate.mockResolvedValue({ id: 'cust-2', lastName: 'Doe', phone: '+1-555-0100' });

        await upsertCustomerByEmail({
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '+1-555-0100',
        });

        expect(mocks.customerUpdate).toHaveBeenCalledWith({
            where: { id: 'cust-2' },
            data: {
                lastName: 'Doe',
                phone: '+1-555-0100',
            },
        });
    });

    it('returns existing customer without update when profile is already complete', async () => {
        const existing = {
            id: 'cust-3',
            firstName: 'Alex',
            lastName: 'Rivera',
            email: 'alex@example.com',
            phone: '+1-555-7777',
        };
        mocks.customerFindFirst.mockResolvedValue(existing);

        const result = await upsertCustomerByEmail({
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            firstName: 'Alex',
            lastName: 'Rivera',
            email: 'alex@example.com',
            phone: '+1-555-7777',
        });

        expect(mocks.customerUpdate).not.toHaveBeenCalled();
        expect(result).toEqual(existing);
    });
});
