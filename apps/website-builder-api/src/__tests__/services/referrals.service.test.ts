import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    referralProfileFindUnique: vi.fn(),
    referralProfileCreate: vi.fn(),
    referralProfileUpdate: vi.fn(),
    referralClaimCount: vi.fn(),
    referralClaimFindUnique: vi.fn(),
    referralClaimCreate: vi.fn(),
    referralFraudLogCreate: vi.fn(),
    consumeProof: vi.fn(),
}));

vi.mock('@project-aurora/database', () => ({
    db: {
        referralProfile: {
            findUnique: mocks.referralProfileFindUnique,
            create: mocks.referralProfileCreate,
            update: mocks.referralProfileUpdate,
        },
        referralClaim: {
            count: mocks.referralClaimCount,
            findUnique: mocks.referralClaimFindUnique,
            create: mocks.referralClaimCreate,
        },
        referralFraudLog: {
            create: mocks.referralFraudLogCreate,
        },
    },
}));

vi.mock('../../services/referral-fraud-proof.service', () => ({
    ReferralFraudProofService: {
        consumeProof: mocks.consumeProof,
    },
}));

vi.mock('../../services/referral-rewards.service', () => ({
    ReferralRewardsService: {
        getReferrerSummary: vi.fn(async () => ({
            availablePoints: 0,
            rewards: [],
            redemptions: [],
        })),
        grantActivationRewardIfEligible: vi.fn(),
    },
}));

import { ReferralsService } from '../../services/referrals.service';

describe('ReferralsService.claimReferral', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.referralProfileCreate.mockResolvedValue({
            accountId: 'referee-1',
            referralCode: 'MYCODE99',
        });
        mocks.referralProfileUpdate.mockResolvedValue({ accountId: 'referrer-1' });
        mocks.referralClaimCount.mockResolvedValue(0);
        mocks.referralClaimFindUnique.mockResolvedValue(null);
        mocks.referralClaimCreate.mockResolvedValue({
            id: 'claim-1',
            status: 'blocked',
        });
        mocks.referralFraudLogCreate.mockResolvedValue({ id: 'fraud-log-1' });
        mocks.consumeProof.mockResolvedValue({
            id: 'proof-1',
            actionTaken: 'block',
            riskScore: 90,
            flags: ['HARD_BLOCK_SHARED_REFERRER_FINGERPRINT'],
            deviceId: 'device-1',
        });
    });

    it('creates blocked claim without incrementing referrer totals', async () => {
        mocks.referralProfileFindUnique.mockImplementation((args: { where?: { accountId?: string; referralCode?: string } }) => {
            if (args.where?.referralCode === 'REF12345') {
                return Promise.resolve({
                    accountId: 'referrer-1',
                    referralCode: 'REF12345',
                });
            }

            if (args.where?.accountId === 'referee-1') {
                return Promise.resolve({
                    accountId: 'referee-1',
                    referralCode: 'MYCODE99',
                });
            }

            return Promise.resolve(null);
        });

        const result = await ReferralsService.claimReferral({
            refereeId: 'referee-1',
            referralCode: 'ref12345',
            proofToken: 'proof-token-1',
        });

        expect(result.status).toBe('blocked');
        expect(result.flags).toContain('HARD_BLOCK_SHARED_REFERRER_FINGERPRINT');
        expect(mocks.referralProfileUpdate).not.toHaveBeenCalled();
        expect(mocks.referralClaimCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                status: 'blocked',
                actionTaken: 'block',
            }),
        });
    });
});
