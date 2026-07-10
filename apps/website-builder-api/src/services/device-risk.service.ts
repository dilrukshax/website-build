import crypto from 'crypto';
import { db } from '@project-aurora/database';
import { logger } from '@project-aurora/core';
import {
    DeviceCheckRequestInput,
    DeviceCheckResult,
    DeviceFingerprintRecord,
    DeviceRiskAction,
    DeviceRiskLevel,
    FingerprintComponents,
} from '../lib/fingerprint/types';
import { classifySimilarity, computeSimilarity } from '../lib/fingerprint/deviceSimilarityService';
import { IPReputationService } from './ip-reputation.service';
import { ReferralFraudProofService } from './referral-fraud-proof.service';

const FINGERPRINT_ENABLED = process.env.FINGERPRINT_ENABLED !== 'false';
const FINGERPRINT_MODE = process.env.FINGERPRINT_MODE === 'enforce' ? 'enforce' : 'log';
export const REFERRAL_HARD_BLOCK_SHARED_REFERRER_FINGERPRINT = 'HARD_BLOCK_SHARED_REFERRER_FINGERPRINT';
export const REFERRAL_HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN = 'HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN';
const database = db as unknown as {
    deviceFingerprint: {
        findMany: (args: unknown) => Promise<Array<{
            id: string;
            componentsJsonb?: unknown;
            accountDevices: Array<{ accountId: string }>;
        }>>;
        create: (args: unknown) => Promise<{ id: string }>;
    };
    accountDevice: {
        findFirst: (args: unknown) => Promise<{ deviceId: string } | null>;
        count: (args: unknown) => Promise<number>;
        upsert: (args: unknown) => Promise<unknown>;
    };
    referralProfile: {
        findUnique: (args: unknown) => Promise<{ accountId: string } | null>;
    };
    referralFraudLog: {
        create: (args: unknown) => Promise<unknown>;
    };
};

function scoreToAction(score: number): DeviceRiskAction {
    if (score <= 25) {
        return 'allow';
    }
    if (score <= 50) {
        return 'verify';
    }
    if (score <= 75) {
        return 'review';
    }
    return 'block';
}

function scoreToLevel(score: number): DeviceRiskLevel {
    if (score <= 25) {
        return 'low';
    }
    if (score <= 50) {
        return 'medium';
    }
    return 'high';
}

function parseJsonSafe(raw: string): unknown {
    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch {
        return { raw };
    }
}

function getDistinctAccounts(records: Array<{ accountDevices: Array<{ accountId: string }> }>, currentAccountId?: string | null): Set<string> {
    const accountIds = new Set<string>();

    for (const record of records) {
        for (const link of record.accountDevices) {
            if (currentAccountId && link.accountId === currentAccountId) {
                continue;
            }
            accountIds.add(link.accountId);
        }
    }

    return accountIds;
}

function isFingerprintComponents(value: unknown): value is FingerprintComponents {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<FingerprintComponents>;
    return Boolean(
        typeof candidate.canvas === 'string' &&
        typeof candidate.audioHash === 'string' &&
        Array.isArray(candidate.fonts) &&
        candidate.webgl &&
        typeof candidate.webgl.vendor === 'string' &&
        typeof candidate.webgl.renderer === 'string' &&
        typeof candidate.screen === 'string' &&
        typeof candidate.hardware === 'string' &&
        typeof candidate.timezone === 'string',
    );
}

function normalizePersistentToken(token?: string | null): string | null {
    const trimmed = token?.trim();
    return trimmed ? trimmed : null;
}

function normalizeAccountId(accountId?: string | null): string | null {
    const trimmed = accountId?.trim();
    return trimmed ? trimmed : null;
}

function normalizeReferralCode(referralCode?: string | null): string | null {
    const trimmed = referralCode?.trim().toUpperCase();
    return trimmed ? trimmed : null;
}

export class DeviceRiskService {
    static async evaluateAndPersist(input: DeviceCheckRequestInput, ipAddress: string): Promise<DeviceCheckResult> {
        const accountId = normalizeAccountId(input.accountId);
        const persistentToken = normalizePersistentToken(input.persistentToken);
        const referralCode = normalizeReferralCode(input.referralCode);

        if (!FINGERPRINT_ENABLED) {
            const deviceId = crypto.randomUUID();
            let proofToken: string | undefined;
            let proofExpiresAt: string | undefined;

            if (accountId && referralCode) {
                const proof = await ReferralFraudProofService.issueProof({
                    accountId,
                    referralCode,
                    deviceId,
                    riskScore: 0,
                    actionTaken: 'allow',
                    flags: ['Fingerprinting disabled; proof issued with low-risk fallback'],
                });
                proofToken = proof.proofToken;
                proofExpiresAt = proof.proofExpiresAt;
            }

            return {
                deviceId,
                riskLevel: 'low',
                riskScore: 0,
                action: 'allow',
                computedAction: 'allow',
                flags: ['Fingerprinting is disabled by feature flag'],
                proofToken,
                proofExpiresAt,
            };
        }

        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - (24 * 60 * 60 * 1000));

        const [hashMatches, tokenMatches, recentIpRecords, ipReputation, referrerProfile, fuzzyMatches] = await Promise.all([
            database.deviceFingerprint.findMany({
                where: { fingerprintHash: input.fingerprintHash },
                select: {
                    id: true,
                    componentsJsonb: true,
                    accountDevices: {
                        select: {
                            accountId: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            persistentToken
                ? database.deviceFingerprint.findMany({
                    where: { persistentToken },
                    select: {
                        id: true,
                        accountDevices: {
                            select: {
                                accountId: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                })
                : Promise.resolve([]),
            ipAddress
                ? database.deviceFingerprint.findMany({
                    where: {
                        ipAddress,
                        createdAt: {
                            gte: twentyFourHoursAgo,
                        },
                    },
                    select: {
                        accountDevices: {
                            select: {
                                accountId: true,
                            },
                        },
                    },
                    take: 500,
                })
                : Promise.resolve([]),
            IPReputationService.check(ipAddress),
            referralCode
                ? database.referralProfile.findUnique({ where: { referralCode } })
                : Promise.resolve(null),
            database.deviceFingerprint.findMany({
                where: {
                    NOT: {
                        fingerprintHash: input.fingerprintHash,
                    },
                    webglVendor: input.components.webgl.vendor,
                    webglRenderer: input.components.webgl.renderer,
                },
                select: {
                    id: true,
                    componentsJsonb: true,
                    accountDevices: {
                        select: {
                            accountId: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
        ]);

        let riskScore = 0;
        const flags: string[] = [];

        const hashMatchedAccounts = getDistinctAccounts(hashMatches, accountId);
        if (hashMatchedAccounts.size > 0) {
            riskScore += 40;
            flags.push('Fingerprint hash matches an existing account device');
        }

        const tokenMatchedAccounts = getDistinctAccounts(tokenMatches, accountId);
        if (tokenMatchedAccounts.size > 0) {
            riskScore += 20;
            flags.push('Persistent token matches an existing account device');
        }

        const ipAccounts = getDistinctAccounts(recentIpRecords, accountId);
        if (ipAccounts.size >= 3) {
            riskScore += 20;
            flags.push('IP address created 3 or more accounts in the last 24 hours');
        }

        let sharedDeviceId: string | null = null;
        const hardBlockFlags: string[] = [];
        if (referrerProfile?.accountId && referrerProfile.accountId !== accountId) {
            const [sharedReferrerFingerprintDevice, sharedReferrerTokenDevice] = await Promise.all([
                database.accountDevice.findFirst({
                    where: {
                        accountId: referrerProfile.accountId,
                        device: {
                            fingerprintHash: input.fingerprintHash,
                        },
                    },
                    select: {
                        deviceId: true,
                    },
                }),
                persistentToken
                    ? database.accountDevice.findFirst({
                        where: {
                            accountId: referrerProfile.accountId,
                            device: {
                                persistentToken,
                            },
                        },
                        select: {
                            deviceId: true,
                        },
                    })
                    : Promise.resolve(null),
            ]);

            if (sharedReferrerFingerprintDevice?.deviceId) {
                riskScore += 15;
                sharedDeviceId = sharedReferrerFingerprintDevice.deviceId;
                flags.push('Referrer and referee share the same device fingerprint');
                flags.push(REFERRAL_HARD_BLOCK_SHARED_REFERRER_FINGERPRINT);
                hardBlockFlags.push(REFERRAL_HARD_BLOCK_SHARED_REFERRER_FINGERPRINT);
            }

            if (sharedReferrerTokenDevice?.deviceId) {
                riskScore += 15;
                if (!sharedDeviceId) {
                    sharedDeviceId = sharedReferrerTokenDevice.deviceId;
                }
                flags.push('Referrer and referee share the same persistent device token');
                flags.push(REFERRAL_HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN);
                hardBlockFlags.push(REFERRAL_HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN);
            }
        }

        if (input.evasionFlags.webdriver) {
            riskScore += 10;
            flags.push('navigator.webdriver is enabled');
        }

        if (input.evasionFlags.noPlugins && input.evasionFlags.defaultResolution) {
            riskScore += 10;
            flags.push('No browser plugins and suspicious default resolution detected');
        }

        if (input.evasionFlags.phantomjs) {
            riskScore += 5;
            flags.push('PhantomJS-like automation signal detected');
        }

        if (ipReputation.isProxyLike) {
            riskScore += 10;
            flags.push('IP reputation indicates VPN/proxy/Tor/hosting usage');
        }

        const fuzzyCandidates = (fuzzyMatches as Array<{
            id: string;
            componentsJsonb?: unknown;
            accountDevices: Array<{ accountId: string }>;
        }>)
            .filter((match: { componentsJsonb?: unknown }) => isFingerprintComponents(match.componentsJsonb))
            .map((match: {
                id: string;
                componentsJsonb?: unknown;
                accountDevices: Array<{ accountId: string }>;
            }) => ({
                id: match.id,
                accountIds: match.accountDevices.map((link: { accountId: string }) => link.accountId),
                components: match.componentsJsonb as FingerprintComponents,
            })) as Array<{ id: string; accountIds: string[]; components: FingerprintComponents }>;

        if (fuzzyCandidates.length > 0) {
            const bestMatch = fuzzyCandidates.reduce<{ score: number; id: string; accountIds: string[] } | null>(
                (currentBest, candidate) => {
                    const score = computeSimilarity(input.components, candidate.components);
                    if (!currentBest || score > currentBest.score) {
                        return {
                            score,
                            id: candidate.id,
                            accountIds: candidate.accountIds,
                        };
                    }
                    return currentBest;
                },
                null,
            );

            if (bestMatch) {
                const similarityClass = classifySimilarity(bestMatch.score);
                const hasForeignAccount = bestMatch.accountIds.some((id) => id !== accountId);
                if (hasForeignAccount && similarityClass === 'likely_same') {
                    flags.push(`High device similarity detected (${bestMatch.score.toFixed(2)})`);
                    if (!sharedDeviceId) {
                        sharedDeviceId = bestMatch.id;
                    }
                } else if (hasForeignAccount && similarityClass === 'possible_same') {
                    flags.push(`Possible device similarity detected (${bestMatch.score.toFixed(2)})`);
                }
            }
        }

        const isHardBlockedByReferrerDevice = hardBlockFlags.length > 0;
        const computedAction: DeviceRiskAction = isHardBlockedByReferrerDevice ? 'block' : scoreToAction(riskScore);
        let action: DeviceRiskAction = computedAction;

        if (!isHardBlockedByReferrerDevice && FINGERPRINT_MODE === 'log' && computedAction !== 'allow') {
            action = 'allow';
            flags.push(`Log mode override applied (computed action: ${computedAction})`);
        }

        const deviceRecord = await database.deviceFingerprint.create({
            data: {
                fingerprintHash: input.fingerprintHash,
                persistentToken,
                ipAddress: ipAddress || null,
                webglVendor: input.components.webgl.vendor,
                webglRenderer: input.components.webgl.renderer,
                screenSignals: parseJsonSafe(input.components.screen),
                hardwareSignals: parseJsonSafe(input.components.hardware),
                evasionFlags: input.evasionFlags,
                componentsJsonb: input.components,
                riskScore,
            },
        });

        if (accountId) {
            const existingDeviceCount = await database.accountDevice.count({
                where: {
                    accountId,
                },
            });

            await database.accountDevice.upsert({
                where: {
                    accountId_deviceId: {
                        accountId,
                        deviceId: deviceRecord.id,
                    },
                },
                create: {
                    accountId,
                    deviceId: deviceRecord.id,
                    isPrimary: existingDeviceCount === 0,
                },
                update: {},
            });
        }

        if (referralCode && (computedAction !== 'allow' || flags.length > 0)) {
            await database.referralFraudLog.create({
                data: {
                    referrerId: referrerProfile?.accountId || null,
                    refereeId: accountId,
                    referralCode,
                    riskScore,
                    actionTaken: computedAction,
                    flags,
                    sharedDeviceId: sharedDeviceId || deviceRecord.id,
                },
            });
        }

        logger.info('Device check evaluated', {
            accountId,
            deviceId: deviceRecord.id,
            riskScore,
            riskLevel: scoreToLevel(riskScore),
            computedAction,
            action,
            flagCount: flags.length,
            ipReputationProvider: ipReputation.provider,
        });

        let proofToken: string | undefined;
        let proofExpiresAt: string | undefined;
        if (accountId && referralCode) {
            const proof = await ReferralFraudProofService.issueProof({
                accountId,
                referralCode,
                deviceId: deviceRecord.id,
                riskScore,
                actionTaken: action,
                flags,
            });

            proofToken = proof.proofToken;
            proofExpiresAt = proof.proofExpiresAt;
        }

        return {
            deviceId: deviceRecord.id,
            riskLevel: scoreToLevel(riskScore),
            riskScore,
            action,
            computedAction,
            flags,
            proofToken,
            proofExpiresAt,
        };
    }

    static toFingerprintRecord(input: {
        id: string;
        fingerprintHash: string;
        persistentToken: string | null;
        componentsJsonb: unknown;
        accountDevices: Array<{ accountId: string }>;
    }): DeviceFingerprintRecord {
        return {
            id: input.id,
            fingerprintHash: input.fingerprintHash,
            persistentToken: input.persistentToken,
            componentsJsonb: isFingerprintComponents(input.componentsJsonb)
                ? input.componentsJsonb
                : null,
            accountIds: input.accountDevices.map((item) => item.accountId),
        };
    }
}
