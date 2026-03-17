import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    deviceFingerprintFindMany: vi.fn(),
    deviceFingerprintCreate: vi.fn(),
    accountDeviceFindFirst: vi.fn(),
    accountDeviceCount: vi.fn(),
    accountDeviceUpsert: vi.fn(),
    referralProfileFindUnique: vi.fn(),
    referralFraudLogCreate: vi.fn(),
    issueProof: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        deviceFingerprint: {
            findMany: mocks.deviceFingerprintFindMany,
            create: mocks.deviceFingerprintCreate,
        },
        accountDevice: {
            findFirst: mocks.accountDeviceFindFirst,
            count: mocks.accountDeviceCount,
            upsert: mocks.accountDeviceUpsert,
        },
        referralProfile: {
            findUnique: mocks.referralProfileFindUnique,
        },
        referralFraudLog: {
            create: mocks.referralFraudLogCreate,
        },
    },
}));

vi.mock('../../services/ip-reputation.service', () => ({
    IPReputationService: {
        check: vi.fn(async () => ({
            isProxyLike: false,
            provider: 'none',
            confidence: 'low',
        })),
    },
}));

vi.mock('../../services/referral-fraud-proof.service', () => ({
    ReferralFraudProofService: {
        issueProof: mocks.issueProof,
    },
}));

import {
    DeviceRiskService,
    REFERRAL_HARD_BLOCK_SHARED_REFERRER_FINGERPRINT,
    REFERRAL_HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN,
} from '../../services/device-risk.service';
import { IPReputationService } from '../../services/ip-reputation.service';

const baseInput = {
    fingerprintHash: 'hash-1',
    persistentToken: 'token-1',
    components: {
        canvas: 'canvas-a',
        webgl: {
            vendor: 'NVIDIA',
            renderer: 'RTX',
            version: '1.0',
            shadingLanguageVersion: '1.0',
            extensions: '',
        },
        audioHash: 'audio-a',
        fonts: ['Arial', 'Verdana'],
        screen: '{"width":1920,"height":1080}',
        hardware: '{"platform":"MacIntel"}',
        timezone: '{"timeZone":"Asia/Colombo"}',
    },
    evasionFlags: {
        webdriver: false,
        noPlugins: false,
        defaultResolution: false,
        phantomjs: false,
    },
};

describe('DeviceRiskService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.deviceFingerprintFindMany.mockResolvedValue([]);
        mocks.deviceFingerprintCreate.mockResolvedValue({ id: 'device-1' });
        mocks.accountDeviceFindFirst.mockResolvedValue(null);
        mocks.accountDeviceCount.mockResolvedValue(0);
        mocks.accountDeviceUpsert.mockResolvedValue({ id: 'link-1' });
        mocks.referralProfileFindUnique.mockResolvedValue(null);
        mocks.referralFraudLogCreate.mockResolvedValue({ id: 'log-1' });
        mocks.issueProof.mockResolvedValue({
            proofToken: 'proof-token',
            proofExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        });

        vi.mocked(IPReputationService.check).mockResolvedValue({
            isProxyLike: false,
            provider: 'none',
            confidence: 'low',
        });
    });

    it('returns low risk for clean fingerprints', async () => {
        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            accountId: 'account-1',
        }, '1.1.1.1');

        expect(result.riskScore).toBe(0);
        expect(result.riskLevel).toBe('low');
        expect(result.computedAction).toBe('allow');
        expect(mocks.deviceFingerprintCreate).toHaveBeenCalledTimes(1);
        expect(mocks.accountDeviceUpsert).toHaveBeenCalledTimes(1);
    });

    it('applies webdriver penalty', async () => {
        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            evasionFlags: {
                ...baseInput.evasionFlags,
                webdriver: true,
            },
        }, '1.1.1.2');

        expect(result.riskScore).toBe(10);
        expect(result.flags).toContain('navigator.webdriver is enabled');
    });

    it('applies noPlugins + defaultResolution penalty', async () => {
        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            evasionFlags: {
                ...baseInput.evasionFlags,
                noPlugins: true,
                defaultResolution: true,
            },
        }, '1.1.1.3');

        expect(result.riskScore).toBe(10);
        expect(result.flags).toContain('No browser plugins and suspicious default resolution detected');
    });

    it('applies proxy reputation penalty', async () => {
        vi.mocked(IPReputationService.check).mockResolvedValue({
            isProxyLike: true,
            provider: 'ip-api',
            confidence: 'high',
        });

        const result = await DeviceRiskService.evaluateAndPersist(baseInput, '1.1.1.4');

        expect(result.riskScore).toBe(10);
        expect(result.flags).toContain('IP reputation indicates VPN/proxy/Tor/hosting usage');
    });

    it('accumulates risk score for matched hash, token and evasion flags', async () => {
        mocks.deviceFingerprintFindMany
            .mockResolvedValueOnce([
                {
                    id: 'device-existing',
                    componentsJsonb: null,
                    accountDevices: [{ accountId: 'other-account' }],
                },
            ])
            .mockResolvedValueOnce([
                {
                    id: 'device-token',
                    accountDevices: [{ accountId: 'other-account' }],
                },
            ])
            .mockResolvedValueOnce([
                { accountDevices: [{ accountId: 'a1' }] },
                { accountDevices: [{ accountId: 'a2' }] },
                { accountDevices: [{ accountId: 'a3' }] },
            ]);

        vi.mocked(IPReputationService.check).mockResolvedValue({
            isProxyLike: true,
            provider: 'ip-api',
            confidence: 'high',
        });

        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            accountId: 'account-9',
            evasionFlags: {
                webdriver: true,
                noPlugins: true,
                defaultResolution: true,
                phantomjs: true,
            },
        }, '2.2.2.2');

        expect(result.riskScore).toBe(115);
        expect(result.riskLevel).toBe('high');
        expect(result.computedAction).toBe('block');
        // Log mode keeps effective action allow.
        expect(result.action).toBe('allow');
    });

    it('adds shared referrer device score when referral code reuses fingerprint', async () => {
        mocks.referralProfileFindUnique.mockResolvedValue({
            accountId: 'referrer-1',
        });
        mocks.accountDeviceFindFirst
            .mockResolvedValueOnce({ deviceId: 'shared-device' })
            .mockResolvedValueOnce(null);

        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            accountId: 'referee-1',
            referralCode: 'SHARE123',
        }, '3.3.3.3');

        expect(result.riskScore).toBe(15);
        expect(result.flags).toContain(REFERRAL_HARD_BLOCK_SHARED_REFERRER_FINGERPRINT);
        expect(result.computedAction).toBe('block');
        expect(result.action).toBe('block');
        expect(mocks.referralFraudLogCreate).toHaveBeenCalledTimes(1);
    });

    it('hard-blocks referral proof when referrer shares persistent token', async () => {
        mocks.referralProfileFindUnique.mockResolvedValue({
            accountId: 'referrer-1',
        });
        mocks.accountDeviceFindFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ deviceId: 'shared-token-device' });

        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            accountId: 'referee-2',
            referralCode: 'SHARE123',
        }, '4.4.4.4');

        expect(result.flags).toContain(REFERRAL_HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN);
        expect(result.computedAction).toBe('block');
        expect(result.action).toBe('block');
        expect(mocks.issueProof).toHaveBeenCalledWith(expect.objectContaining({
            actionTaken: 'block',
        }));
    });

    it('issues allow proof in log mode for non-hard suspicious referrals', async () => {
        mocks.deviceFingerprintFindMany
            .mockResolvedValueOnce([
                {
                    id: 'device-existing',
                    componentsJsonb: null,
                    accountDevices: [{ accountId: 'other-account' }],
                },
            ])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const result = await DeviceRiskService.evaluateAndPersist({
            ...baseInput,
            accountId: 'referee-3',
            referralCode: 'SAFE1234',
        }, '5.5.5.5');

        expect(result.computedAction).toBe('verify');
        expect(result.action).toBe('allow');
        expect(mocks.issueProof).toHaveBeenCalledWith(expect.objectContaining({
            actionTaken: 'allow',
        }));
    });
});
