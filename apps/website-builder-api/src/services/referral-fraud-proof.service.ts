import crypto from 'crypto';
import { db } from '@project-aurora/database';
import { AppError } from '../middleware/error';

type ReferralAction = 'allow' | 'verify' | 'review' | 'block';

const PROOF_TTL_MINUTES = Number(process.env.REFERRAL_PROOF_TTL_MINUTES || 15);

function normalizeReferralCode(referralCode?: string | null): string | null {
    const normalized = referralCode?.trim().toUpperCase() || '';
    return normalized || null;
}

function hashProofToken(proofToken: string): string {
    return crypto.createHash('sha256').update(proofToken).digest('hex');
}

export class ReferralFraudProofService {
    static async issueProof(input: {
        accountId: string;
        referralCode?: string | null;
        deviceId: string;
        riskScore: number;
        actionTaken: ReferralAction;
        flags: string[];
    }): Promise<{ proofToken: string; proofExpiresAt: string }> {
        const proofToken = crypto.randomBytes(24).toString('base64url');
        const proofTokenHash = hashProofToken(proofToken);
        const expiresAt = new Date(Date.now() + (Math.max(1, PROOF_TTL_MINUTES) * 60 * 1000));

        await db.referralFraudProof.create({
            data: {
                accountId: input.accountId,
                referralCode: normalizeReferralCode(input.referralCode),
                deviceId: input.deviceId,
                riskScore: input.riskScore,
                actionTaken: input.actionTaken,
                flags: input.flags,
                proofTokenHash,
                expiresAt,
            },
        });

        return {
            proofToken,
            proofExpiresAt: expiresAt.toISOString(),
        };
    }

    static async consumeProof(input: {
        accountId: string;
        referralCode: string;
        proofToken: string;
    }): Promise<any> {
        const proofTokenHash = hashProofToken(input.proofToken);
        const normalizedCode = normalizeReferralCode(input.referralCode);

        const proof = await db.referralFraudProof.findUnique({ where: { proofTokenHash } });
        if (!proof) {
            throw new AppError('REFERRAL_PROOF_REQUIRED', 'Referral proof is missing or invalid', 400, 'proofToken');
        }

        if (proof.accountId !== input.accountId) {
            throw new AppError('REFERRAL_PROOF_REQUIRED', 'Referral proof does not belong to this account', 400, 'proofToken');
        }

        if (proof.referralCode && proof.referralCode !== normalizedCode) {
            throw new AppError('REFERRAL_PROOF_REQUIRED', 'Referral proof does not match this referral code', 400, 'proofToken');
        }

        if (proof.consumedAt) {
            throw new AppError('REFERRAL_PROOF_REQUIRED', 'Referral proof has already been used', 400, 'proofToken');
        }

        if (proof.expiresAt.getTime() < Date.now()) {
            throw new AppError('REFERRAL_PROOF_REQUIRED', 'Referral proof has expired', 400, 'proofToken');
        }

        const updatedProof = await db.referralFraudProof.update({
            where: { id: proof.id },
            data: {
                consumedAt: new Date(),
            },
        });

        return updatedProof;
    }
}
