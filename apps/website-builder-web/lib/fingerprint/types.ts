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

export interface FingerprintResult {
    fingerprintHash: string;
    persistentToken: string;
    components: FingerprintComponents;
    evasionFlags: FingerprintEvasionFlags;
    collectedAt: string;
}
