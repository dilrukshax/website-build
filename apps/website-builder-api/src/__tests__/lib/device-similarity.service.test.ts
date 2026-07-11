import { describe, expect, it } from 'vitest';
import {
    classifySimilarity,
    computeSimilarity,
} from '../../lib/fingerprint/deviceSimilarityService';

const baseComponents = {
    canvas: 'canvas-a',
    webgl: {
        vendor: 'NVIDIA',
        renderer: 'RTX',
    },
    audioHash: 'audio-a',
    fonts: ['Arial', 'Verdana', 'Tahoma'],
    screen: '{"width":1920,"height":1080}',
    hardware: '{"platform":"MacIntel","cores":8}',
    timezone: '{"timeZone":"Asia/Colombo"}',
};

describe('deviceSimilarityService', () => {
    it('returns 1.0 for identical fingerprints', () => {
        const score = computeSimilarity(baseComponents, baseComponents);

        expect(score).toBe(1);
        expect(classifySimilarity(score)).toBe('likely_same');
    });

    it('returns medium similarity for partial matches', () => {
        const partial = {
            ...baseComponents,
            audioHash: 'audio-b',
            fonts: ['Arial', 'Tahoma', 'Garamond'],
            screen: '{"width":1366,"height":768}',
        };

        const score = computeSimilarity(baseComponents, partial);

        expect(score).toBeGreaterThanOrEqual(0.60);
        expect(score).toBeLessThan(0.85);
        expect(classifySimilarity(score)).toBe('possible_same');
    });

    it('returns low similarity for different devices', () => {
        const different = {
            canvas: 'canvas-z',
            webgl: {
                vendor: 'Intel',
                renderer: 'HD Graphics',
            },
            audioHash: 'audio-z',
            fonts: ['Comic Sans MS'],
            screen: '{"width":1024,"height":768}',
            hardware: '{"platform":"Linux x86_64","cores":2}',
            timezone: '{"timeZone":"UTC"}',
        };

        const score = computeSimilarity(baseComponents, different);

        expect(score).toBeLessThan(0.60);
        expect(classifySimilarity(score)).toBe('different');
    });
});
