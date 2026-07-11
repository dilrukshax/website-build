export interface FingerprintComponents {
    canvas: string;
    webgl: {
        vendor: string;
        renderer: string;
        version?: string;
        shadingLanguageVersion?: string;
        extensions?: string;
    };
    audioHash: string;
    fonts: string[];
    screen: string;
    hardware: string;
    timezone: string;
}

export interface FingerprintEvasionFlags {
    webdriver: boolean;
    noPlugins: boolean;
    defaultResolution: boolean;
    phantomjs: boolean;
}

export interface DeviceCheckRequestInput {
    fingerprintHash: string;
    persistentToken?: string | null;
    components: FingerprintComponents;
    evasionFlags: FingerprintEvasionFlags;
    referralCode?: string | null;
    accountId?: string | null;
}

export type DeviceRiskAction = 'allow' | 'verify' | 'review' | 'block';
export type DeviceRiskLevel = 'low' | 'medium' | 'high';

export interface DeviceCheckResult {
    deviceId: string;
    riskLevel: DeviceRiskLevel;
    riskScore: number;
    action: DeviceRiskAction;
    flags: string[];
    computedAction: DeviceRiskAction;
    proofToken?: string;
    proofExpiresAt?: string;
}

export interface DeviceFingerprintRecord {
    id: string;
    fingerprintHash: string;
    persistentToken: string | null;
    componentsJsonb: FingerprintComponents | null;
    accountIds: string[];
}

export interface IPReputationResult {
    isProxyLike: boolean;
    provider: 'ip-api' | 'ipinfo' | 'none';
    confidence: 'low' | 'high';
    reason?: string;
}
