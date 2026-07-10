import crypto from 'crypto';
import { db } from '@project-aurora/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@project-aurora/core';
import { ReferralFraudProofService } from './referral-fraud-proof.service';
import { ReferralRewardsService } from './referral-rewards.service';
import { env } from '../lib/env';

const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const database = db as unknown as {
    referralProfile: {
        findUnique: (args: unknown) => Promise<{ accountId: string; referralCode: string } | null>;
        create: (args: unknown) => Promise<{ accountId: string; referralCode: string }>;
        update: (args: unknown) => Promise<unknown>;
    };
    referralClaim: {
        count: (args: unknown) => Promise<number>;
        findUnique: (args: unknown) => Promise<{ id: string } | null>;
        create: (args: unknown) => Promise<{ id: string; status: string }>;
    };
    referralFraudLog: {
        create: (args: unknown) => Promise<unknown>;
    };
};

function generateReferralCode(): string {
    const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
    let code = '';

    for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
        const index = bytes[i]! % REFERRAL_CODE_ALPHABET.length;
        code += REFERRAL_CODE_ALPHABET[index];
    }

    return code;
}

function normalizeCode(raw: string): string {
    return raw.trim().toUpperCase();
}

function mapActionToStatus(action: 'allow' | 'verify' | 'review' | 'block'): 'pending' | 'verify' | 'review' | 'blocked' {
    if (action === 'verify') {
        return 'verify';
    }

    if (action === 'review') {
        return 'review';
    }

    if (action === 'block') {
        return 'blocked';
    }

    return 'pending';
}

function getCmsBaseUrl(): string {
    const fromEnv = env.cmsUrl();
    if (fromEnv && fromEnv.trim()) {
        return fromEnv.replace(/\/+$/, '');
    }

    return 'http://localhost:3001';
}

export class ReferralsService {
    static async ensureReferralProfile(accountId: string) {
        const existing = await database.referralProfile.findUnique({ where: { accountId } });
        if (existing) {
            return existing;
        }

        for (let attempt = 0; attempt < 8; attempt += 1) {
            const candidateCode = generateReferralCode();
            const existingCode = await database.referralProfile.findUnique({ where: { referralCode: candidateCode } });
            if (existingCode) {
                continue;
            }

            return database.referralProfile.create({
                data: {
                    accountId,
                    referralCode: candidateCode,
                },
            });
        }

        throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Unable to generate a unique referral code', 500);
    }

    static async getMyReferral(accountId: string): Promise<any> {
        const profile = await this.ensureReferralProfile(accountId);

        const [totalClaims, pendingClaims, blockedClaims, rewardedClaims, points] = await Promise.all([
            database.referralClaim.count({ where: { referrerId: accountId } }),
            database.referralClaim.count({
                where: {
                    referrerId: accountId,
                    status: {
                        in: ['pending', 'verify', 'review'],
                    },
                },
            }),
            database.referralClaim.count({
                where: {
                    referrerId: accountId,
                    status: 'blocked',
                },
            }),
            database.referralClaim.count({
                where: {
                    referrerId: accountId,
                    status: 'rewarded',
                },
            }),
            ReferralRewardsService.getReferrerSummary(accountId),
        ]);

        return {
            referralCode: profile.referralCode,
            referralLink: `${getCmsBaseUrl()}/register?ref=${encodeURIComponent(profile.referralCode)}`,
            stats: {
                totalReferrals: totalClaims,
                pendingReferrals: pendingClaims,
                blockedReferrals: blockedClaims,
                rewardedReferrals: rewardedClaims,
            },
            points: {
                availablePoints: points.availablePoints,
                minimumRedemptionPoints: 600,
                pointToCreditRatio: '1 point = $0.01 credit',
            },
            rewards: points.rewards,
            redemptions: points.redemptions,
        };
    }

    static async claimReferral(input: {
        refereeId: string;
        referralCode: string;
        proofToken: string;
    }): Promise<any> {
        const normalizedCode = normalizeCode(input.referralCode);

        const [referrerProfile, existingClaim] = await Promise.all([
            database.referralProfile.findUnique({ where: { referralCode: normalizedCode } }),
            database.referralClaim.findUnique({ where: { refereeId: input.refereeId } }),
        ]);

        if (!referrerProfile) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Referral code not found', 404, 'referralCode');
        }

        if (referrerProfile.accountId === input.refereeId) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Self-referrals are not allowed', 400, 'referralCode');
        }

        if (existingClaim) {
            throw new AppError(ERROR_CODES.CONFLICT, 'This account already has a referral claim', 409);
        }

        await this.ensureReferralProfile(input.refereeId);

        const proof = await ReferralFraudProofService.consumeProof({
            accountId: input.refereeId,
            referralCode: normalizedCode,
            proofToken: input.proofToken,
        });

        const actionTaken = proof.actionTaken;
        const riskScore = Math.max(0, Math.min(100, proof.riskScore ?? 0));
        const flags = proof.flags || [];
        const status = mapActionToStatus(actionTaken);

        const claim = await database.referralClaim.create({
            data: {
                referrerId: referrerProfile.accountId,
                refereeId: input.refereeId,
                referralCode: normalizedCode,
                riskScore,
                actionTaken,
                status,
                flags,
                deviceId: proof.deviceId || null,
                fraudProofId: proof.id,
            },
        });

        if (status !== 'blocked') {
            await database.referralProfile.update({
                where: { accountId: referrerProfile.accountId },
                data: {
                    totalReferrals: {
                        increment: 1,
                    },
                },
            });
        }

        if (riskScore > 25 || actionTaken !== 'allow' || flags.length > 0) {
            await database.referralFraudLog.create({
                data: {
                    referrerId: referrerProfile.accountId,
                    refereeId: input.refereeId,
                    referralCode: normalizedCode,
                    riskScore,
                    actionTaken,
                    flags,
                    sharedDeviceId: proof.deviceId || null,
                },
            });
        }

        return {
            claimId: claim.id,
            status: claim.status,
            action: actionTaken,
            riskScore,
            flags,
        };
    }

    static async listClaimsForSuperAdmin(status?: 'pending' | 'verify' | 'review' | 'blocked' | 'rewarded'): Promise<any[]> {
        const claims = await db.referralClaim.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 500,
            include: {
                referrerProfile: {
                    select: {
                        accountId: true,
                        referralCode: true,
                    },
                },
                rewardEvents: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        return claims.map((claim) => ({
            ...claim,
            hasPendingEnterpriseReward: claim.rewardEvents.some(
                (event) =>
                    event.status === 'pending' &&
                    (event.milestone === 'enterprise_small' ||
                        event.milestone === 'enterprise_medium' ||
                        event.milestone === 'enterprise_large'),
            ),
        }));
    }

    static async reviewClaim(input: {
        claimId: string;
        reviewerUserId: string;
        action: 'approve' | 'block';
        notes?: string;
    }): Promise<any> {
        const claim = await db.referralClaim.findUnique({
            where: { id: input.claimId },
        });

        if (!claim) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Referral claim not found', 404);
        }

        const nextStatus = input.action === 'block' ? 'blocked' : 'pending';
        const updated = await db.referralClaim.update({
            where: { id: input.claimId },
            data: {
                status: nextStatus,
                reviewedAt: new Date(),
            },
        });

        if (input.action === 'approve') {
            await ReferralRewardsService.grantActivationRewardIfEligible(updated.refereeId);
        }

        if (input.action === 'block' || input.notes) {
            await db.referralFraudLog.create({
                data: {
                    referrerId: updated.referrerId,
                    refereeId: updated.refereeId,
                    referralCode: updated.referralCode,
                    riskScore: updated.riskScore,
                    actionTaken: input.action === 'block' ? 'block' : 'review',
                    flags: input.notes ? [input.notes] : [],
                    sharedDeviceId: updated.deviceId,
                },
            });
        }

        return updated;
    }
}
