import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'crypto';
import { collectFingerprint, getOrCreateDeviceToken } from '../fingerprintService';

function installLocalStorageMock() {
    const store = new Map<string, string>();
    const localStorageMock = {
        getItem: vi.fn((key: string) => store.get(key) || null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
    };

    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: localStorageMock,
    });

    return localStorageMock;
}

function installNavigatorAndScreenMock() {
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
            userAgent: 'test-browser',
            language: 'en-US',
            languages: ['en-US', 'en'],
            platform: 'MacIntel',
            hardwareConcurrency: 8,
            deviceMemory: 8,
            maxTouchPoints: 0,
            cookieEnabled: true,
            doNotTrack: '1',
            plugins: { length: 3 },
            webdriver: false,
        },
    });

    Object.defineProperty(globalThis, 'screen', {
        configurable: true,
        value: {
            width: 1920,
            height: 1080,
            availWidth: 1900,
            availHeight: 1040,
            colorDepth: 24,
            pixelDepth: 24,
            orientation: {
                type: 'landscape-primary',
            },
        },
    });

    Object.defineProperty(globalThis, 'devicePixelRatio', {
        configurable: true,
        value: 2,
    });
}

function installAudioContextMock() {
    class MockAudioContext {
        public state: AudioContextState = 'running';
        private processor: {
            onaudioprocess: ((event: { inputBuffer: { getChannelData: (_index: number) => Float32Array } }) => void) | null;
            connect: () => void;
            disconnect: () => void;
        } | null = null;

        destination = {} as AudioDestinationNode;

        async resume() {
            this.state = 'running';
        }

        createOscillator() {
            return {
                type: 'triangle',
                frequency: { value: 0 },
                connect: () => undefined,
                disconnect: () => undefined,
                start: () => {
                    setTimeout(() => {
                        this.processor?.onaudioprocess?.({
                            inputBuffer: {
                                getChannelData: () => new Float32Array(Array.from({ length: 64 }, (_v, i) => i / 100)),
                            },
                        });
                    }, 0);
                },
                stop: () => undefined,
            };
        }

        createAnalyser() {
            return {
                fftSize: 0,
                connect: () => undefined,
                disconnect: () => undefined,
            };
        }

        createGain() {
            return {
                gain: { value: 1 },
                connect: () => undefined,
                disconnect: () => undefined,
            };
        }

        createScriptProcessor() {
            this.processor = {
                onaudioprocess: null,
                connect: () => undefined,
                disconnect: () => undefined,
            };
            return this.processor;
        }

        async close() {
            return undefined;
        }
    }

    Object.defineProperty(globalThis, 'AudioContext', {
        configurable: true,
        value: MockAudioContext,
    });
}

function installDocumentMock() {
    const context2d = {
        textBaseline: '',
        font: '',
        fillStyle: '',
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(function measureText(this: { font: string }) {
            if (this.font.includes('monospace') && !this.font.includes(',')) {
                return { width: 100 };
            }
            return { width: this.font.includes('Arial') ? 110 : 112 };
        }),
    };

    const webglContext = {
        VERSION: 7938,
        SHADING_LANGUAGE_VERSION: 35724,
        getExtension: vi.fn(() => ({
            UNMASKED_VENDOR_WEBGL: 37445,
            UNMASKED_RENDERER_WEBGL: 37446,
        })),
        getParameter: vi.fn((key: number) => {
            if (key === 37445) return 'MockVendor';
            if (key === 37446) return 'MockRenderer';
            if (key === 7938) return 'WebGL 1.0';
            if (key === 35724) return 'GLSL 1.0';
            return 'unknown';
        }),
        getSupportedExtensions: vi.fn(() => ['EXT_texture_filter_anisotropic']),
    };

    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            createElement: vi.fn((tag: string) => {
                if (tag !== 'canvas') {
                    return {};
                }

                return {
                    width: 0,
                    height: 0,
                    getContext: (type: string) => {
                        if (type === '2d') {
                            return context2d;
                        }
                        return webglContext;
                    },
                    toDataURL: () => 'data:image/png;base64,mock',
                };
            }),
        },
    });
}

describe('fingerprintService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: webcrypto,
        });
        installLocalStorageMock();
        installNavigatorAndScreenMock();
        installAudioContextMock();
        installDocumentMock();
    });

    it('collects fingerprint data with graceful hashing', async () => {
        const firstToken = getOrCreateDeviceToken();
        const secondToken = getOrCreateDeviceToken();

        const result = await collectFingerprint();

        expect(firstToken).toBe(secondToken);
        expect(result.persistentToken).toBe(firstToken);
        expect(result.fingerprintHash).toHaveLength(64);
        expect(result.components.canvas).toContain('data:image');
        expect(result.components.webgl.vendor).toBe('MockVendor');
        expect(result.components.audioHash).toHaveLength(64);
        expect(result.components.fonts.length).toBeGreaterThan(0);
    });

    it('never throws and falls back when browser APIs fail', async () => {
        Object.defineProperty(globalThis, 'document', {
            configurable: true,
            value: {
                createElement: () => {
                    throw new Error('Canvas blocked');
                },
            },
        });

        const result = await collectFingerprint();

        expect(result.fingerprintHash).toHaveLength(64);
        expect(result.components.canvas).toBe('canvas_error');
        expect(result.components.webgl.vendor).toBe('error');
    });
});
