import { z } from 'zod';

export const listClaimsQuerySchema = z.object({
    status: z.enum(['pending', 'verify', 'review', 'blocked', 'rewarded']).optional(),
});

export const approveClaimSchema = z.object({
    notes: z.string().trim().max(2000).optional(),
});

export const blockClaimSchema = z.object({
    reason: z.string().trim().max(2000).optional(),
});

export const approveEnterpriseRewardSchema = z.object({
    tier: z.enum(['small', 'medium', 'large']),
});

export const rejectEnterpriseRewardSchema = z.object({
    reason: z.string().trim().max(2000).optional(),
});

