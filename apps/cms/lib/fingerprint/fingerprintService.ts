import { FingerprintEvasionFlags, FingerprintResult } from './types';

const DEVICE_TOKEN_KEY = '__did';
const FALLBACK_HASH_INPUT = 'fingerprint_fallback';

const FONT_TEST_LIST = [
    'Arial',
    'Courier New',
    'Georgia',
    'Times New Roman',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Helvetica',
    'Tahoma',
    'Trebuchet MS',
    'Palatino',
    'Garamond',
    'Bookman',
    'Avant Garde',
    'Futura',
] as const;

function jsonStringifySafe(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return '{}';
    }
}

async function sha256Hex(input: string): Promise<string> {
    try {
        const cryptoRef = globalThis.crypto;
        if (!cryptoRef?.subtle) {
            throw new Error('SubtleCrypto unavailable');
        }

        const buffer = await cryptoRef.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(input),
        );

        return Array.from(new Uint8Array(buffer))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    } catch {
        // Non-cryptographic deterministic fallback to avoid hard failures.
        let hash = 0;
        for (let i = 0; i < input.length; i += 1) {
            hash = ((hash << 5) - hash) + input.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
    }
}

function getNavigatorSnapshot() {
    const nav = globalThis.navigator;

    return {
        userAgent: nav?.userAgent || 'unknown',
        language: nav?.language || 'unknown',
        languages: Array.isArray(nav?.languages) ? nav.languages : [],
        platform: nav?.platform || 'unknown',
        hardwareConcurrency: nav?.hardwareConcurrency || 0,
        deviceMemory: typeof (nav as Navigator & { deviceMemory?: number })?.deviceMemory === 'number'
            ? (nav as Navigator & { deviceMemory?: number }).deviceMemory
            : 0,
        maxTouchPoints: nav?.maxTouchPoints || 0,
        cookieEnabled: Boolean(nav?.cookieEnabled),
        doNotTrack: nav?.doNotTrack || 'unknown',
    };
}

function getScreenSnapshot() {
    const screenRef = globalThis.screen;

    return {
        width: screenRef?.width || 0,
        height: screenRef?.height || 0,
        availWidth: screenRef?.availWidth || 0,
        availHeight: screenRef?.availHeight || 0,
        colorDepth: screenRef?.colorDepth || 0,
        pixelDepth: screenRef?.pixelDepth || 0,
        devicePixelRatio: globalThis.devicePixelRatio || 1,
        orientation: screenRef?.orientation?.type || 'unknown',
    };
}

function getEvasionFlags(screenSnapshot: ReturnType<typeof getScreenSnapshot>): FingerprintEvasionFlags {
    const nav = globalThis.navigator;

    const webdriver = Boolean((nav as Navigator & { webdriver?: boolean })?.webdriver);
    const phantomjs = typeof (globalThis as typeof window & { callPhantom?: unknown }).callPhantom !== 'undefined';

    const pluginLength = typeof nav?.plugins?.length === 'number' ? nav.plugins.length : 0;
    const noPlugins = pluginLength === 0;

    const defaultResolution =
        (screenSnapshot.width === 0 || screenSnapshot.height === 0) ||
        (screenSnapshot.width === 1024 && screenSnapshot.height === 768);

    return {
        webdriver,
        phantomjs,
        noPlugins,
        defaultResolution,
    };
}

function collectCanvasFingerprint(): string {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 150;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return 'canvas_unavailable';
        }

        ctx.textBaseline = 'top';
        ctx.font = '18px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(20, 20, 120, 30);
        ctx.fillStyle = '#069';
        ctx.fillRect(140, 30, 100, 40);

        ctx.fillStyle = '#111';
        ctx.fillText('buildmyonlineweb fingerprint 🧪🔐', 10, 70);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Unicode render test 😀', 12, 95);

        return canvas.toDataURL();
    } catch {
        return 'canvas_error';
    }
}

function collectWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');

        if (!gl) {
            return {
                vendor: 'unavailable',
                renderer: 'unavailable',
                version: 'unavailable',
                shadingLanguageVersion: 'unavailable',
                extensions: '',
            };
        }

        const glContext = gl as WebGLRenderingContext;
        const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');

        const vendor = debugInfo
            ? String(glContext.getParameter((debugInfo as unknown as { UNMASKED_VENDOR_WEBGL: number }).UNMASKED_VENDOR_WEBGL) || 'unknown')
            : 'unknown';

        const renderer = debugInfo
            ? String(glContext.getParameter((debugInfo as unknown as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL) || 'unknown')
            : 'unknown';

        const version = String(glContext.getParameter(glContext.VERSION) || 'unknown');
        const shadingLanguageVersion = String(glContext.getParameter(glContext.SHADING_LANGUAGE_VERSION) || 'unknown');
        const extensions = (glContext.getSupportedExtensions() || []).join(',');

        return {
            vendor,
            renderer,
            version,
            shadingLanguageVersion,
            extensions,
        };
    } catch {
        return {
            vendor: 'error',
            renderer: 'error',
            version: 'error',
            shadingLanguageVersion: 'error',
            extensions: '',
        };
    }
}

async function collectAudioFingerprint(): Promise<string> {
    let audioContext: AudioContext | null = null;

    try {
        const AudioContextConstructor =
            globalThis.AudioContext ||
            (globalThis as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextConstructor) {
            return 'audio_context_unavailable';
        }

        audioContext = new AudioContextConstructor();

        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
            } catch {
                // Continue best effort.
            }
        }

        const oscillator = audioContext.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;

        const createScriptProcessor = audioContext.createScriptProcessor?.bind(audioContext);
        if (!createScriptProcessor) {
            return 'script_processor_unavailable';
        }

        const processor = createScriptProcessor(4096, 1, 1);
        const samples: number[] = [];

        const audioHash = await new Promise<string>((resolve) => {
            let finished = false;

            const finish = async (value: string) => {
                if (finished) {
                    return;
                }
                finished = true;

                try {
                    processor.disconnect();
                    analyser.disconnect();
                    gainNode.disconnect();
                    oscillator.disconnect();
                } catch {
                    // Ignore disconnect errors.
                }

                try {
                    oscillator.stop(0);
                } catch {
                    // Ignore stop errors.
                }

                try {
                    await audioContext?.close();
                } catch {
                    // Ignore close errors.
                }

                resolve(value);
            };

            const timeout = setTimeout(() => {
                void finish('audio_timeout');
            }, 1200);

            processor.onaudioprocess = async (event) => {
                const input = event.inputBuffer.getChannelData(0);
                for (let i = 0; i < input.length && samples.length < 50; i += 1) {
                    samples.push(Number(input[i]!.toFixed(7)));
                }

                if (samples.length >= 50) {
                    clearTimeout(timeout);
                    const value = await sha256Hex(samples.join(','));
                    void finish(value);
                }
            };

            oscillator.connect(analyser);
            analyser.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioContext!.destination);

            try {
                oscillator.start(0);
            } catch {
                clearTimeout(timeout);
                void finish('audio_start_failed');
            }
        });

        return audioHash;
    } catch {
        if (audioContext) {
            try {
                await audioContext.close();
            } catch {
                // Ignore close errors.
            }
        }

        return 'audio_error';
    }
}

function detectFonts(): string[] {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return [];
        }

        const sampleText = 'mmmmmmmmmmlli';
        ctx.font = '72px monospace';
        const baselineWidth = ctx.measureText(sampleText).width;

        return FONT_TEST_LIST.filter((fontName) => {
            ctx.font = `72px '${fontName}', monospace`;
            const width = ctx.measureText(sampleText).width;
            return width !== baselineWidth;
        });
    } catch {
        return [];
    }
}

function getTimezoneSnapshot() {
    try {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return {
            timeZone: options.timeZone || 'unknown',
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: options.locale || 'unknown',
        };
    } catch {
        return {
            timeZone: 'unknown',
            timezoneOffset: 0,
            locale: 'unknown',
        };
    }
}

export function getOrCreateDeviceToken(): string {
    try {
        const existing = globalThis.localStorage?.getItem(DEVICE_TOKEN_KEY);
        if (existing) {
            return existing;
        }

        const generated = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
        globalThis.localStorage?.setItem(DEVICE_TOKEN_KEY, generated);
        return generated;
    } catch {
        return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    }
}

function getFallbackResult(persistentToken: string, collectedAt: string): Promise<FingerprintResult> {
    return sha256Hex(`${FALLBACK_HASH_INPUT}:${persistentToken}:${collectedAt}`).then((fingerprintHash) => ({
        fingerprintHash,
        persistentToken,
        components: {
            canvas: 'fallback',
            webgl: {
                vendor: 'fallback',
                renderer: 'fallback',
                version: 'fallback',
                shadingLanguageVersion: 'fallback',
                extensions: '',
            },
            audioHash: 'fallback',
            fonts: [],
            screen: '{}',
            hardware: '{}',
            timezone: '{}',
        },
        evasionFlags: {
            webdriver: false,
            noPlugins: false,
            defaultResolution: false,
            phantomjs: false,
        },
        collectedAt,
    }));
}

export async function collectFingerprint(): Promise<FingerprintResult> {
    const persistentToken = getOrCreateDeviceToken();
    const collectedAt = new Date().toISOString();

    try {
        const [canvas, webgl, audioHash] = await Promise.all([
            Promise.resolve(collectCanvasFingerprint()),
            Promise.resolve(collectWebGLFingerprint()),
            collectAudioFingerprint(),
        ]);

        const fonts = detectFonts();
        const navigatorSnapshot = getNavigatorSnapshot();
        const screenSnapshot = getScreenSnapshot();
        const timezoneSnapshot = getTimezoneSnapshot();
        const evasionFlags = getEvasionFlags(screenSnapshot);

        const components = {
            canvas,
            webgl,
            audioHash,
            fonts,
            screen: jsonStringifySafe(screenSnapshot),
            hardware: jsonStringifySafe(navigatorSnapshot),
            timezone: jsonStringifySafe(timezoneSnapshot),
        };

        const signals = {
            navigator: navigatorSnapshot,
            screen: screenSnapshot,
            canvas,
            webgl,
            audioHash,
            fonts,
            timezone: timezoneSnapshot,
            evasionFlags,
        };

        const raw = JSON.stringify(signals, Object.keys(signals).sort());
        const fingerprintHash = await sha256Hex(raw);

        return {
            fingerprintHash,
            persistentToken,
            components,
            evasionFlags,
            collectedAt,
        };
    } catch {
        return getFallbackResult(persistentToken, collectedAt);
    }
}
