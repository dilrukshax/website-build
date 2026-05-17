/**
 * Commerce helpers: feature gating, store-profile bootstrap, atomic
 * per-instance order numbering, opaque token generation. See design §6.1/§18.
 */
import { randomBytes } from 'crypto';
import { db, type StoreCommerceProfile } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

const ECOMMERCE_TOGGLE_KEY = 'ecommerce_enabled';

export async function isCommerceEnabled(instanceId: string): Promise<boolean> {
    const toggle = await db.featureToggle.findFirst({
        where: { instanceId, toggleKey: ECOMMERCE_TOGGLE_KEY },
    });
    return Boolean(toggle?.isEnabled);
}

export async function assertCommerceEnabled(instanceId: string): Promise<void> {
    if (!(await isCommerceEnabled(instanceId))) {
        throw new AppError(
            ERROR_CODES.COMMERCE_DISABLED,
            'E-commerce is not enabled for this store',
            403,
        );
    }
}

export async function getOrCreateStoreProfile(
    tenantId: string,
    instanceId: string,
): Promise<StoreCommerceProfile> {
    const existing = await db.storeCommerceProfile.findUnique({ where: { instanceId } });
    if (existing) return existing;
    return db.storeCommerceProfile.create({
        data: { tenantId, instanceId },
    });
}

/**
 * Atomically allocate the next human-readable order number for an instance.
 * Must run inside a transaction; uses an UPDATE ... RETURNING-style increment.
 */
export async function allocateOrderNumber(
    tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
    tenantId: string,
    instanceId: string,
): Promise<string> {
    // Ensure a profile row exists for the counter.
    let profile = await tx.storeCommerceProfile.findUnique({ where: { instanceId } });
    if (!profile) {
        profile = await tx.storeCommerceProfile.create({ data: { tenantId, instanceId } });
    }
    const updated = await tx.storeCommerceProfile.update({
        where: { instanceId },
        data: { nextOrderSeq: { increment: 1 } },
        select: { nextOrderSeq: true, orderNumberPrefix: true },
    });
    const seq = updated.nextOrderSeq - 1;
    const prefix = (updated.orderNumberPrefix || 'ORD').trim();
    return `${prefix}-${1000 + seq}`;
}

/** Non-enumerable token for public order tracking (design §18). */
export function generateOrderAccessToken(): string {
    return randomBytes(24).toString('base64url');
}

/** Opaque guest cart token (cookie value). */
export function generateCartToken(): string {
    return randomBytes(18).toString('base64url');
}
