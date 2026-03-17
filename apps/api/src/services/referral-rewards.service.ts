import crypto from 'crypto';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export type RewardMilestone =
    | 'free_activation'
    | 'starter_monthly'
    | 'starter_annual'
    | 'freelance_monthly'
    | 'freelance_annual'
    | 'enterprise_small'
    | 'enterprise_medium'
    | 'enterprise_large';

export type EnterpriseTier = 'small' | 'medium' | 'large';

const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DEFAULT_MULTIPLIERS: Record<'free' | 'starter' | 'freelance' | 'enterprise', number> = {
    free: 1,
    starter: 1.1,
    freelance: 1.25,
    enterprise: 1.5,
};

const DEFAULT_REWARD_RULES: Record<RewardMilestone, number> = {
    free_activation: 100,
    starter_monthly: 600,
    starter_annual: 1200,
    freelance_monthly: 2900,
    freelance_annual: 5800,
    enterprise_small: 19900,
    enterprise_medium: 39800,
    enterprise_large: 79600,
};

let seedPromise: Promise<void> | null = null;

function generateReferralCode(): string {
    const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
    let code = '';

    for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
        const index = bytes[i]! % REFERRAL_CODE_ALPHABET.length;
        code += REFERRAL_CODE_ALPHABET[index];
    }

    return code;
}

function toTierMilestone(tier: EnterpriseTier): RewardMilestone {
    if (tier === 'medium') {
        return 'enterprise_medium';
    }
    if (tier === 'large') {
        return 'enterprise_large';
    }
    return 'enterprise_small';
}

function planPriority(plan: string): number {
    if (plan === 'enterprise') return 4;
    if (plan === 'freelance') return 3;
    if (plan === 'starter') return 2;
    return 1;
}

async function ensureRewardCatalogSeeded(): Promise<void> {
    if (!seedPromise) {
        seedPromise = (async () => {
            await db.$transaction(async (tx) => {
                for (const [plan, multiplier] of Object.entries(DEFAULT_MULTIPLIERS) as Array<[keyof typeof DEFAULT_MULTIPLIERS, number]>) {
                    await tx.planReferralMultiplier.upsert({
                        where: { plan },
                        update: { multiplier },
                        create: {
                            plan,
                            multiplier,
                        },
                    });
                }

                for (const [milestone, basePoints] of Object.entries(DEFAULT_REWARD_RULES) as Array<[RewardMilestone, number]>) {
                    await tx.referralRewardRule.upsert({
                        where: { milestone },
                        update: { basePoints },
                        create: {
                            milestone,
                            basePoints,
                        },
                    });
                }
            });
        })();
    }

    await seedPromise;
}

async function ensureReferralProfile(accountId: string): Promise<{ accountId: string; referralCode: string }> {
    const existing = await db.referralProfile.findUnique({ where: { accountId } });
    if (existing) {
        return existing;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const referralCode = generateReferralCode();
        const collision = await db.referralProfile.findUnique({ where: { referralCode } });
        if (collision) {
            continue;
        }

        return db.referralProfile.create({
            data: {
                accountId,
                referralCode,
            },
        });
    }

    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Failed to create referral profile', 500);
}

export class ReferralRewardsService {
    static async ensurePointsWallet(accountId: string) {
        await ensureReferralProfile(accountId);

        const existing = await db.referralPointsWallet.findUnique({ where: { accountId } });
        if (existing) {
            return existing;
        }

        return db.referralPointsWallet.create({
            data: {
                accountId,
            },
        });
    }

    static async getHighestPlanMultiplier(accountId: string): Promise<number> {
        await ensureRewardCatalogSeeded();

        const tenantPlans = await db.tenant.findMany({
            where: {
                ownerId: accountId,
                status: 'active',
            },
            select: {
                plan: true,
            },
        });

        const highestPlan = tenantPlans
            .map((row) => row.plan)
            .sort((a, b) => planPriority(b) - planPriority(a))[0] || 'free';

        const multiplier = await db.planReferralMultiplier.findUnique({ where: { plan: highestPlan } });
        if (!multiplier) {
            return DEFAULT_MULTIPLIERS[highestPlan as keyof typeof DEFAULT_MULTIPLIERS] || 1;
        }

        return Number(multiplier.multiplier);
    }

    static async getRuleBasePoints(milestone: RewardMilestone): Promise<number> {
        await ensureRewardCatalogSeeded();

        const rule = await db.referralRewardRule.findUnique({ where: { milestone } });
        if (!rule) {
            throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Missing reward rule for ${milestone}`, 500);
        }

        return rule.basePoints;
    }

    private static async creditPointsFromEvent(tx: any, input: {
        accountId: string;
        rewardEventId: string;
        points: number;
        note: string;
    }) {
        const wallet = await this.ensurePointsWallet(input.accountId);
        const expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));

        await tx.referralPointsLedger.create({
            data: {
                walletId: wallet.id,
                accountId: wallet.accountId,
                rewardEventId: input.rewardEventId,
                entryType: 'credit',
                points: input.points,
                remainingPoints: input.points,
                expiresAt,
                note: input.note,
            },
        });

        await tx.referralPointsWallet.update({
            where: { id: wallet.id },
            data: {
                availablePoints: {
                    increment: input.points,
                },
            },
        });
    }

    static async expirePointsForAccount(accountId: string, now: Date = new Date()): Promise<number> {
        const wallet = await db.referralPointsWallet.findUnique({ where: { accountId } });
        if (!wallet) {
            return 0;
        }

        const expiringCredits = await db.referralPointsLedger.findMany({
            where: {
                walletId: wallet.id,
                entryType: 'credit',
                remainingPoints: { gt: 0 },
                expiresAt: { lte: now },
            },
            orderBy: { expiresAt: 'asc' },
        });

        if (expiringCredits.length === 0) {
            return 0;
        }

        const expired = expiringCredits.reduce((sum, row) => sum + (row.remainingPoints || 0), 0);

        await db.$transaction(async (tx) => {
            for (const credit of expiringCredits) {
                const remaining = credit.remainingPoints || 0;
                if (remaining <= 0) continue;

                await tx.referralPointsLedger.create({
                    data: {
                        walletId: wallet.id,
                        accountId: wallet.accountId,
                        sourceEntryId: credit.id,
                        entryType: 'expiry',
                        points: -remaining,
                        note: 'Points expired after 12 months',
                    },
                });

                await tx.referralPointsLedger.update({
                    where: { id: credit.id },
                    data: {
                        remainingPoints: 0,
                    },
                });
            }

            await tx.referralPointsWallet.update({
                where: { id: wallet.id },
                data: {
                    availablePoints: {
                        decrement: expired,
                    },
                },
            });
        });

        return expired;
    }

    static async sweepExpiredPoints(): Promise<{ accounts: number; expiredPoints: number }> {
        const now = new Date();
        const candidates = await db.referralPointsLedger.findMany({
            where: {
                entryType: 'credit',
                remainingPoints: { gt: 0 },
                expiresAt: { lte: now },
            },
            distinct: ['accountId'],
            select: { accountId: true },
        });

        let totalExpired = 0;
        for (const row of candidates) {
            totalExpired += await this.expirePointsForAccount(row.accountId, now);
        }

        return {
            accounts: candidates.length,
            expiredPoints: totalExpired,
        };
    }

    static async grantActivationRewardIfEligible(refereeId: string): Promise<void> {
        const claim = await db.referralClaim.findUnique({ where: { refereeId } });
        if (!claim) {
            return;
        }

        if (claim.status === 'blocked' || claim.status === 'verify' || claim.status === 'review') {
            return;
        }

        const [ownedTenants, ownedInstances] = await Promise.all([
            db.tenant.count({
                where: {
                    ownerId: refereeId,
                    status: 'active',
                },
            }),
            db.instance.count({
                where: {
                    status: 'active',
                    tenant: {
                        ownerId: refereeId,
                    },
                },
            }),
        ]);

        if (ownedTenants !== 1 || ownedInstances !== 1) {
            return;
        }

        const existing = await db.referralRewardEvent.findUnique({
            where: {
                refereeId_milestone: {
                    refereeId,
                    milestone: 'free_activation',
                },
            },
        });

        if (existing) {
            return;
        }

        const basePoints = await this.getRuleBasePoints('free_activation');
        const multiplier = await this.getHighestPlanMultiplier(claim.referrerId);
        const awardedPoints = Math.round(basePoints * multiplier);

        await db.$transaction(async (tx) => {
            const event = await tx.referralRewardEvent.create({
                data: {
                    claimId: claim.id,
                    referrerId: claim.referrerId,
                    refereeId,
                    milestone: 'free_activation',
                    basePoints,
                    multiplier,
                    awardedPoints,
                    status: 'granted',
                    grantedAt: new Date(),
                },
            });

            await this.creditPointsFromEvent(tx, {
                accountId: claim.referrerId,
                rewardEventId: event.id,
                points: awardedPoints,
                note: 'Referral activation reward',
            });

            await tx.referralClaim.update({
                where: { id: claim.id },
                data: {
                    status: 'rewarded',
                    rewardedAt: new Date(),
                },
            });
        });
    }

    static async processPaidRewardForCharge(chargeId: string): Promise<void> {
        const charge = await db.billingCharge.findUnique({
            where: { id: chargeId },
            include: {
                tenant: {
                    select: {
                        ownerId: true,
                    },
                },
            },
        });

        if (!charge || charge.status !== 'confirmed' || charge.chargeType !== 'plan_change') {
            return;
        }

        const refereeId = charge.tenant.ownerId;
        const claim = await db.referralClaim.findUnique({ where: { refereeId } });
        if (!claim) {
            return;
        }

        if (claim.status === 'blocked' || claim.status === 'verify' || claim.status === 'review') {
            return;
        }

        const targetPlan = charge.requestedPlan;
        const targetInterval = charge.requestedInterval;

        if (!targetPlan || !targetInterval) {
            return;
        }

        if (targetPlan === 'enterprise') {
            const existingEnterpriseReward = await db.referralRewardEvent.findFirst({
                where: {
                    refereeId,
                    milestone: {
                        in: ['enterprise_small', 'enterprise_medium', 'enterprise_large'],
                    },
                },
            });

            if (existingEnterpriseReward) {
                return;
            }

            const basePoints = await this.getRuleBasePoints('enterprise_small');
            const multiplier = await this.getHighestPlanMultiplier(claim.referrerId);

            await db.referralRewardEvent.create({
                data: {
                    claimId: claim.id,
                    chargeId,
                    referrerId: claim.referrerId,
                    refereeId,
                    milestone: 'enterprise_small',
                    basePoints,
                    multiplier,
                    awardedPoints: 0,
                    status: 'pending',
                },
            });

            return;
        }

        const milestone: RewardMilestone | null = targetPlan === 'starter'
            ? (targetInterval === 'annual' ? 'starter_annual' : 'starter_monthly')
            : targetPlan === 'freelance'
                ? (targetInterval === 'annual' ? 'freelance_annual' : 'freelance_monthly')
                : null;

        if (!milestone) {
            return;
        }

        const existing = await db.referralRewardEvent.findUnique({
            where: {
                refereeId_milestone: {
                    refereeId,
                    milestone,
                },
            },
        });
        if (existing) {
            return;
        }

        const basePoints = await this.getRuleBasePoints(milestone);
        const multiplier = await this.getHighestPlanMultiplier(claim.referrerId);
        const awardedPoints = Math.round(basePoints * multiplier);

        await db.$transaction(async (tx) => {
            const event = await tx.referralRewardEvent.create({
                data: {
                    claimId: claim.id,
                    chargeId,
                    referrerId: claim.referrerId,
                    refereeId,
                    milestone,
                    basePoints,
                    multiplier,
                    awardedPoints,
                    status: 'granted',
                    grantedAt: new Date(),
                },
            });

            await this.creditPointsFromEvent(tx, {
                accountId: claim.referrerId,
                rewardEventId: event.id,
                points: awardedPoints,
                note: `Referral paid milestone reward (${milestone})`,
            });

            await tx.referralClaim.update({
                where: { id: claim.id },
                data: {
                    status: 'rewarded',
                    rewardedAt: new Date(),
                },
            });
        });
    }

    static async approveEnterpriseReward(input: {
        claimId: string;
        tier: EnterpriseTier;
        reviewerUserId: string;
    }) {
        const pendingEvent = await db.referralRewardEvent.findFirst({
            where: {
                claimId: input.claimId,
                status: 'pending',
                milestone: {
                    in: ['enterprise_small', 'enterprise_medium', 'enterprise_large'],
                },
            },
        });

        if (!pendingEvent) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Pending enterprise reward event not found', 404);
        }

        const milestone = toTierMilestone(input.tier);

        const claim = await db.referralClaim.findUnique({ where: { id: input.claimId } });
        if (!claim) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Referral claim not found', 404);
        }

        const basePoints = await this.getRuleBasePoints(milestone);
        const multiplier = await this.getHighestPlanMultiplier(claim.referrerId);
        const awardedPoints = Math.round(basePoints * multiplier);

        await db.$transaction(async (tx) => {
            const event = await tx.referralRewardEvent.update({
                where: { id: pendingEvent.id },
                data: {
                    milestone,
                    basePoints,
                    multiplier,
                    awardedPoints,
                    status: 'granted',
                    approvedByUserId: input.reviewerUserId,
                    approvedAt: new Date(),
                    grantedAt: new Date(),
                    rejectionReason: null,
                },
            });

            await tx.enterpriseRewardApproval.create({
                data: {
                    rewardEventId: event.id,
                    claimId: claim.id,
                    reviewerUserId: input.reviewerUserId,
                    tier: input.tier,
                    approvedPoints: awardedPoints,
                    status: 'approved',
                },
            });

            await this.creditPointsFromEvent(tx, {
                accountId: claim.referrerId,
                rewardEventId: event.id,
                points: awardedPoints,
                note: `Enterprise referral reward approved (${input.tier})`,
            });

            await tx.referralClaim.update({
                where: { id: claim.id },
                data: {
                    status: 'rewarded',
                    rewardedAt: new Date(),
                },
            });
        });
    }

    static async rejectEnterpriseReward(input: {
        claimId: string;
        reviewerUserId: string;
        reason?: string;
    }) {
        const pendingEvent = await db.referralRewardEvent.findFirst({
            where: {
                claimId: input.claimId,
                status: 'pending',
                milestone: {
                    in: ['enterprise_small', 'enterprise_medium', 'enterprise_large'],
                },
            },
        });

        if (!pendingEvent) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Pending enterprise reward event not found', 404);
        }

        const tier: EnterpriseTier = pendingEvent.milestone === 'enterprise_large'
            ? 'large'
            : pendingEvent.milestone === 'enterprise_medium'
                ? 'medium'
                : 'small';

        await db.$transaction(async (tx) => {
            await tx.referralRewardEvent.update({
                where: { id: pendingEvent.id },
                data: {
                    status: 'rejected',
                    approvedByUserId: input.reviewerUserId,
                    approvedAt: new Date(),
                    rejectionReason: input.reason || 'Rejected during enterprise reward review',
                },
            });

            await tx.enterpriseRewardApproval.create({
                data: {
                    rewardEventId: pendingEvent.id,
                    claimId: input.claimId,
                    reviewerUserId: input.reviewerUserId,
                    tier,
                    approvedPoints: 0,
                    status: 'rejected',
                    reason: input.reason || null,
                },
            });
        });
    }

    static async redeemPoints(input: {
        accountId: string;
        tenantId: string;
        points: number;
    }) {
        if (!Number.isInteger(input.points) || input.points < 600) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Minimum redemption is 600 points', 400, 'points');
        }

        const wallet = await this.ensurePointsWallet(input.accountId);
        await this.expirePointsForAccount(input.accountId);

        const refreshedWallet = await db.referralPointsWallet.findUnique({ where: { id: wallet.id } });
        if (!refreshedWallet || refreshedWallet.availablePoints < input.points) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Insufficient referral points balance', 400, 'points');
        }

        const credits = await db.referralPointsLedger.findMany({
            where: {
                walletId: wallet.id,
                entryType: 'credit',
                remainingPoints: { gt: 0 },
            },
            orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
        });

        let remaining = input.points;
        const allocations: Array<{ entryId: string; points: number }> = [];

        for (const credit of credits) {
            if (remaining <= 0) break;
            const available = credit.remainingPoints || 0;
            if (available <= 0) continue;
            const consume = Math.min(available, remaining);
            allocations.push({ entryId: credit.id, points: consume });
            remaining -= consume;
        }

        if (remaining > 0) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Insufficient redeemable points balance', 400, 'points');
        }

        const creditedCents = input.points;

        await db.$transaction(async (tx) => {
            const redemption = await tx.referralRedemption.create({
                data: {
                    accountId: input.accountId,
                    tenantId: input.tenantId,
                    walletId: wallet.id,
                    requestedPoints: input.points,
                    creditedCents,
                    status: 'completed',
                    completedAt: new Date(),
                },
            });

            for (const allocation of allocations) {
                await tx.referralPointsLedger.create({
                    data: {
                        walletId: wallet.id,
                        accountId: input.accountId,
                        redemptionId: redemption.id,
                        sourceEntryId: allocation.entryId,
                        entryType: 'debit',
                        points: -allocation.points,
                        note: `Redeemed ${allocation.points} points`,
                    },
                });

                await tx.referralPointsLedger.update({
                    where: { id: allocation.entryId },
                    data: {
                        remainingPoints: {
                            decrement: allocation.points,
                        },
                    },
                });
            }

            await tx.referralPointsWallet.update({
                where: { id: wallet.id },
                data: {
                    availablePoints: {
                        decrement: input.points,
                    },
                },
            });

            const tenantWallet = await tx.tenantCreditWallet.upsert({
                where: { tenantId: input.tenantId },
                create: {
                    tenantId: input.tenantId,
                    balanceCents: 0,
                },
                update: {},
            });

            await tx.tenantCreditWallet.update({
                where: { id: tenantWallet.id },
                data: {
                    balanceCents: {
                        increment: creditedCents,
                    },
                },
            });

            await tx.tenantCreditLedger.create({
                data: {
                    walletId: tenantWallet.id,
                    tenantId: input.tenantId,
                    redemptionId: redemption.id,
                    entryType: 'credit',
                    amountCents: creditedCents,
                    note: `Referral points redemption (${input.points} points)`,
                },
            });
        });

        const [updatedWallet, tenantWallet] = await Promise.all([
            db.referralPointsWallet.findUnique({ where: { id: wallet.id } }),
            db.tenantCreditWallet.findUnique({ where: { tenantId: input.tenantId } }),
        ]);

        return {
            creditedCents,
            remainingPoints: updatedWallet?.availablePoints || 0,
            tenantWalletBalanceCents: tenantWallet?.balanceCents || 0,
        };
    }

    static async getReferrerSummary(accountId: string): Promise<{
        availablePoints: number;
        rewards: any[];
        redemptions: any[];
    }> {
        await this.ensurePointsWallet(accountId);
        await this.expirePointsForAccount(accountId);

        const [wallet, rewards, redemptions] = await Promise.all([
            db.referralPointsWallet.findUnique({ where: { accountId } }),
            db.referralRewardEvent.findMany({
                where: { referrerId: accountId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            db.referralRedemption.findMany({
                where: { accountId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);

        return {
            availablePoints: wallet?.availablePoints || 0,
            rewards,
            redemptions,
        };
    }
}
