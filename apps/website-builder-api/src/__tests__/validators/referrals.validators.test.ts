import { describe, expect, it } from 'vitest';
import { claimReferralSchema } from '../../validators/referrals.validators';

describe('claimReferralSchema', () => {
    it('accepts referral code with proof token', () => {
        const result = claimReferralSchema.parse({
            referralCode: 'ABC12345',
            proofToken: 'proof_token_123456',
        });

        expect(result.referralCode).toBe('ABC12345');
        expect(result.proofToken).toBe('proof_token_123456');
    });

    it('rejects payload without proof token', () => {
        const parsed = claimReferralSchema.safeParse({
            referralCode: 'ABC12345',
        });

        expect(parsed.success).toBe(false);
    });
});

