import { FingerprintComponents } from './types';

export const COMPONENT_WEIGHTS = {
    canvas: 0.30,
    webgl: 0.25,
    audioHash: 0.20,
    fonts: 0.10,
    screen: 0.07,
    hardware: 0.05,
    timezone: 0.03,
} as const;

export function computeSimilarity(fp1: FingerprintComponents, fp2: FingerprintComponents): number {
    let score = 0;

    if (fp1.canvas === fp2.canvas) {
        score += COMPONENT_WEIGHTS.canvas;
    }

    if (fp1.webgl.vendor === fp2.webgl.vendor && fp1.webgl.renderer === fp2.webgl.renderer) {
        score += COMPONENT_WEIGHTS.webgl;
    }

    if (fp1.audioHash === fp2.audioHash) {
        score += COMPONENT_WEIGHTS.audioHash;
    }

    const fontSet2 = new Set(fp2.fonts);
    const intersection = fp1.fonts.filter((font) => fontSet2.has(font)).length;
    const union = new Set([...fp1.fonts, ...fp2.fonts]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    score += jaccard * COMPONENT_WEIGHTS.fonts;

    if (fp1.screen === fp2.screen) {
        score += COMPONENT_WEIGHTS.screen;
    }

    if (fp1.hardware === fp2.hardware) {
        score += COMPONENT_WEIGHTS.hardware;
    }

    if (fp1.timezone === fp2.timezone) {
        score += COMPONENT_WEIGHTS.timezone;
    }

    return Number(score.toFixed(4));
}

export function classifySimilarity(score: number): 'likely_same' | 'possible_same' | 'different' {
    if (score >= 0.85) {
        return 'likely_same';
    }

    if (score >= 0.60) {
        return 'possible_same';
    }

    return 'different';
}
