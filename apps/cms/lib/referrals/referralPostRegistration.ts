import type { FingerprintResult } from '../fingerprint/types';

export const HARD_BLOCK_SHARED_REFERRER_FINGERPRINT = 'HARD_BLOCK_SHARED_REFERRER_FINGERPRINT';
export const HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN = 'HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN';
export const ONBOARDING_REFERRAL_OUTCOME_KEY = 'onboardingReferralOutcome';

export type ReferralPostRegistrationStatus =
    | 'claimed'
    | 'blocked'
    | 'skipped_no_code'
    | 'skipped_no_fingerprint'
    | 'failed';

export interface ReferralPostRegistrationOutcome {
    status: ReferralPostRegistrationStatus;
    message: string;
    flags: string[];
}

export interface ReferralOutcomeNotice {
    tone: 'warning' | 'info';
    message: string;
}

interface DeviceCheckResponse {
    proofToken?: string;
}

interface ClaimReferralResponse {
    status?: string;
    flags?: string[];
}

interface ApiErrorPayload {
    message?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiErrorPayload;
}

export interface ReferralApiClient {
    get<T>(path: string, options?: { skipAuth?: boolean }): Promise<ApiResponse<T>>;
    post<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<ApiResponse<T>>;
}

export interface PostRegistrationReferralInput {
    userId?: string;
    referralCode: string | null;
    fingerprintData: FingerprintResult | null;
    fingerprintEnabled: boolean;
}

function createOutcome(
    status: ReferralPostRegistrationStatus,
    message: string,
    flags: string[] = [],
): ReferralPostRegistrationOutcome {
    return {
        status,
        message,
        flags,
    };
}

function normalizeReferralCode(referralCode: string | null): string | null {
    const normalized = referralCode?.trim().toUpperCase() || '';
    return normalized || null;
}

function isOutcomeStatus(value: unknown): value is ReferralPostRegistrationStatus {
    return value === 'claimed'
        || value === 'blocked'
        || value === 'skipped_no_code'
        || value === 'skipped_no_fingerprint'
        || value === 'failed';
}

function parseStoredOutcome(raw: string): ReferralPostRegistrationOutcome | null {
    try {
        const parsed = JSON.parse(raw) as {
            status?: unknown;
            message?: unknown;
            flags?: unknown;
        };

        if (!isOutcomeStatus(parsed.status)) {
            return null;
        }

        return {
            status: parsed.status,
            message: typeof parsed.message === 'string' ? parsed.message : '',
            flags: Array.isArray(parsed.flags) ? parsed.flags.filter((flag): flag is string => typeof flag === 'string') : [],
        };
    } catch {
        return null;
    }
}

export async function runPostRegistrationReferralFlow(
    apiClient: ReferralApiClient,
    input: PostRegistrationReferralInput,
): Promise<ReferralPostRegistrationOutcome> {
    const referralCode = normalizeReferralCode(input.referralCode);

    try {
        await apiClient.get('/cms/referrals/me');
    } catch {
        // Always continue; referral setup should never block account onboarding.
    }

    if (!referralCode) {
        return createOutcome('skipped_no_code', 'No referral code was provided.');
    }

    if (!input.fingerprintEnabled || !input.fingerprintData) {
        return createOutcome(
            'skipped_no_fingerprint',
            'Account created successfully, but referral verification was skipped because device verification was unavailable.',
        );
    }

    try {
        const checkResponse = await apiClient.post<DeviceCheckResponse>('/api/device-check', {
            fingerprintHash: input.fingerprintData.fingerprintHash,
            persistentToken: input.fingerprintData.persistentToken,
            components: input.fingerprintData.components,
            evasionFlags: input.fingerprintData.evasionFlags,
            referralCode,
            accountId: input.userId || undefined,
        }, { skipAuth: true });

        const proofToken = checkResponse.success ? checkResponse.data?.proofToken : undefined;
        if (!proofToken) {
            return createOutcome(
                'failed',
                checkResponse.error?.message || 'Account created successfully, but referral proof could not be generated.',
            );
        }

        const claimResponse = await apiClient.post<ClaimReferralResponse>('/cms/referrals/claim', {
            referralCode,
            proofToken,
        });

        if (!claimResponse.success || !claimResponse.data) {
            return createOutcome(
                'failed',
                claimResponse.error?.message || 'Account created successfully, but referral claim could not be completed.',
            );
        }

        const claimFlags = Array.isArray(claimResponse.data.flags)
            ? claimResponse.data.flags.filter((flag): flag is string => typeof flag === 'string')
            : [];

        if (claimResponse.data.status === 'blocked') {
            return createOutcome(
                'blocked',
                'Account created successfully, but this referral was blocked by anti-abuse checks.',
                claimFlags,
            );
        }

        return createOutcome('claimed', 'Referral claimed successfully.', claimFlags);
    } catch {
        return createOutcome(
            'failed',
            'Account created successfully, but referral claim could not be completed.',
        );
    }
}

export function saveOnboardingReferralOutcome(outcome: ReferralPostRegistrationOutcome): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(ONBOARDING_REFERRAL_OUTCOME_KEY, JSON.stringify(outcome));
    } catch {
        // Ignore storage write failures.
    }
}

export function loadOnboardingReferralOutcome(): ReferralPostRegistrationOutcome | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(ONBOARDING_REFERRAL_OUTCOME_KEY);
        if (!raw) {
            return null;
        }

        return parseStoredOutcome(raw);
    } catch {
        return null;
    }
}

export function clearOnboardingReferralOutcome(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(ONBOARDING_REFERRAL_OUTCOME_KEY);
    } catch {
        // Ignore storage delete failures.
    }
}

export function consumeOnboardingReferralOutcome(): ReferralPostRegistrationOutcome | null {
    const outcome = loadOnboardingReferralOutcome();
    clearOnboardingReferralOutcome();
    return outcome;
}

export function getOnboardingReferralNotice(outcome: ReferralPostRegistrationOutcome): ReferralOutcomeNotice | null {
    if (outcome.status === 'blocked') {
        const blockedBySharedDevice = outcome.flags.includes(HARD_BLOCK_SHARED_REFERRER_FINGERPRINT)
            || outcome.flags.includes(HARD_BLOCK_SHARED_REFERRER_PERSISTENT_TOKEN);

        return {
            tone: 'warning',
            message: blockedBySharedDevice
                ? 'Account created successfully, but referral was blocked because this device is already linked to the referrer.'
                : outcome.message,
        };
    }

    if (outcome.status === 'failed') {
        return {
            tone: 'warning',
            message: outcome.message,
        };
    }

    if (outcome.status === 'skipped_no_fingerprint') {
        return {
            tone: 'info',
            message: outcome.message,
        };
    }

    return null;
}
