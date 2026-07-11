import { z } from 'zod';

export const claimReferralSchema = z.object({
    referralCode: z.string().trim().min(3).max(64),
    proofToken: z.string().trim().min(12).max(256),
});
