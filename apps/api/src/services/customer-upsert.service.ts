import { db } from '@booking-engine/database';

export interface CustomerUpsertInput {
    tenantId: string;
    instanceId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
}

function hasText(value: string | null | undefined): value is string {
    return Boolean(value && value.trim().length > 0);
}

export function normalizeCustomerEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function normalizeOptionalString(value?: string | null): string | undefined {
    if (!hasText(value)) return undefined;
    return value.trim();
}

/**
 * Upsert a customer by normalized email in an instance.
 * Existing customers are only enriched when key profile fields are missing.
 */
export async function upsertCustomerByEmail(input: CustomerUpsertInput) {
    const tenantId = input.tenantId;
    const instanceId = input.instanceId;
    const firstName = normalizeOptionalString(input.firstName) || 'Customer';
    const lastName = normalizeOptionalString(input.lastName) || '';
    const email = normalizeCustomerEmail(input.email);
    const phone = normalizeOptionalString(input.phone);

    const existing = await db.customer.findFirst({
        where: {
            instanceId,
            email: {
                equals: email,
                mode: 'insensitive',
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    if (existing) {
        const updateData: { firstName?: string; lastName?: string; phone?: string } = {};

        if (!hasText(existing.firstName) && hasText(firstName)) {
            updateData.firstName = firstName;
        }

        if (!hasText(existing.lastName) && hasText(lastName)) {
            updateData.lastName = lastName;
        }

        if (!hasText(existing.phone) && hasText(phone)) {
            updateData.phone = phone;
        }

        if (Object.keys(updateData).length > 0) {
            return db.customer.update({
                where: { id: existing.id },
                data: updateData,
            });
        }

        return existing;
    }

    return db.customer.create({
        data: {
            tenantId,
            instanceId,
            firstName,
            lastName,
            email,
            phone,
        },
    });
}
