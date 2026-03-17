import { z } from 'zod';

const planTierSchema = z.enum(['free', 'starter', 'freelance', 'enterprise']);
const billingIntervalSchema = z.enum(['monthly', 'annual']);
const chargeStatusSchema = z.enum(['pending', 'confirmed', 'rejected']);

export const planChangeSchema = z.object({
    requestedPlan: planTierSchema,
    requestedInterval: billingIntervalSchema,
    notes: z.string().trim().max(2000).optional(),
});

export const addonPurchaseSchema = z.object({
    bundles: z.number().int().min(1).max(100),
    notes: z.string().trim().max(2000).optional(),
});

export const redeemPointsSchema = z.object({
    tenantId: z.string().uuid('Tenant ID must be a valid UUID'),
    points: z.number().int().min(600),
});

export const listChargesQuerySchema = z.object({
    status: chargeStatusSchema.optional(),
});

export const rejectChargeSchema = z.object({
    reason: z.string().trim().max(2000).optional(),
});

