import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    HARD_BLOCK_SHARED_REFERRER_FINGERPRINT,
    clearOnboardingReferralOutcome,
    consumeOnboardingReferralOutcome,
    getOnboardingReferralNotice,
    runPostRegistrationReferralFlow,
    saveOnboardingReferralOutcome,
    type ReferralApiClient,
    type ReferralPostRegistrationOutcome,
} from '../referralPostRegistration';

function installSessionStorageMock() {
    const storage = new Map<string, string>();
    const sessionStorageMock = {
        getItem: vi.fn((key: string) => storage.get(key) || null),
        setItem: vi.fn((key: string, value: string) => {
            storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            storage.delete(key);
        }),
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            sessionStorage: sessionStorageMock,
        },
    });

    return sessionStorageMock;
}

const fingerprintData = {
    fingerprintHash: 'hash-1',
    persistentToken: 'token-1',
    components: {
        canvas: 'canvas',
        webgl: {
            vendor: 'NVIDIA',
            renderer: 'RTX',
            version: '1.0',
            shadingLanguageVersion: '1.0',
            extensions: '',
        },
        audioHash: 'audio-hash',
        fonts: ['Arial'],
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
    collectedAt: '2026-03-12T00:00:00.000Z',
};

describe('referral post-registration flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        installSessionStorageMock();
    });

    afterEach(() => {
        clearOnboardingReferralOutcome();
    });

    it('returns blocked outcome when claim is blocked', async () => {
        const apiClient: ReferralApiClient = {
            get: vi.fn(async () => ({ success: true })),
            post: vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    data: { proofToken: 'proof-1' },
                })
                .mockResolvedValueOnce({
                    success: true,
                    data: {
                        status: 'blocked',
                        flags: [HARD_BLOCK_SHARED_REFERRER_FINGERPRINT],
                    },
                }),
        };

        const outcome = await runPostRegistrationReferralFlow(apiClient, {
            userId: 'user-1',
            referralCode: 'ref12345',
            fingerprintData,
            fingerprintEnabled: true,
        });

        expect(outcome.status).toBe('blocked');
        expect(outcome.flags).toContain(HARD_BLOCK_SHARED_REFERRER_FINGERPRINT);
    });

    it('returns failed outcome when claim request fails', async () => {
        const apiClient: ReferralApiClient = {
            get: vi.fn(async () => ({ success: true })),
            post: vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    data: { proofToken: 'proof-1' },
                })
                .mockResolvedValueOnce({
                    success: false,
                    error: { message: 'Referral proof has expired' },
                }),
        };

        const outcome = await runPostRegistrationReferralFlow(apiClient, {
            userId: 'user-1',
            referralCode: 'ref12345',
            fingerprintData,
            fingerprintEnabled: true,
        });

        expect(outcome.status).toBe('failed');
        expect(outcome.message).toContain('Referral proof has expired');
    });

    it('returns claimed outcome for successful non-blocked claim', async () => {
        const apiClient: ReferralApiClient = {
            get: vi.fn(async () => ({ success: true })),
            post: vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    data: { proofToken: 'proof-1' },
                })
                .mockResolvedValueOnce({
                    success: true,
                    data: {
                        status: 'pending',
                        flags: [],
                    },
                }),
        };

        const outcome = await runPostRegistrationReferralFlow(apiClient, {
            userId: 'user-1',
            referralCode: 'ref12345',
            fingerprintData,
            fingerprintEnabled: true,
        });

        expect(outcome.status).toBe('claimed');
        expect(getOnboardingReferralNotice(outcome)).toBeNull();
    });
});

describe('referral onboarding outcome notice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        installSessionStorageMock();
    });

    it('shows warning notice for hard-blocked referral', () => {
        const notice = getOnboardingReferralNotice({
            status: 'blocked',
            message: 'Blocked',
            flags: [HARD_BLOCK_SHARED_REFERRER_FINGERPRINT],
        });

        expect(notice).toEqual({
            tone: 'warning',
            message: 'Account created successfully, but referral was blocked because this device is already linked to the referrer.',
        });
    });

    it('persists and consumes referral outcome once', () => {
        const outcome: ReferralPostRegistrationOutcome = {
            status: 'failed',
            message: 'Account created successfully, but referral claim could not be completed.',
            flags: [],
        };

        saveOnboardingReferralOutcome(outcome);

        expect(consumeOnboardingReferralOutcome()).toEqual(outcome);
        expect(consumeOnboardingReferralOutcome()).toBeNull();
    });
});
