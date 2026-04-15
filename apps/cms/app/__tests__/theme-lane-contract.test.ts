import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type VersionRule = {
    family: string;
    versions: number[];
};

const TARGET_RULES: VersionRule[] = [
    { family: 'about', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'booking-widget', versions: [5, 6, 7, 8, 9, 10, 11, 12] },
    { family: 'contact', versions: [5, 6, 7, 8, 9, 10, 11, 12] },
    { family: 'faq', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'footer', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'gallery', versions: [5, 6, 7, 8, 9, 10, 11, 12] },
    { family: 'header', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'hero', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'logos', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'pricing', versions: [5, 6, 7, 8, 9, 10, 11, 12] },
    { family: 'product', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'services', versions: [6, 7, 8, 9, 10, 11, 12] },
    { family: 'testimonials', versions: [6, 7, 8, 9, 10, 11, 12] },
];

const THEMES_COMPONENTS_ROOT = path.resolve(process.cwd(), '../../packages/themes/src/components');

function sourceFor(family: string, version: number): string {
    const filePath = path.join(THEMES_COMPONENTS_ROOT, family, `v${version}.tsx`);
    return fs.readFileSync(filePath, 'utf8');
}

function normalizeSource(source: string): string {
    return source
        .replace(/\r\n/g, '\n')
        .replace(/Signal Horizon v\d+/g, '<LANE_LABEL>')
        .replace(/Acquisition Shop v\d+/g, '<LANE_LABEL>')
        .replace(/Prism Grid v\d+/g, '<LANE_LABEL>')
        .replace(/Salesforce Pipeline v\d+/g, '<LANE_LABEL>')
        .replace(/Velocity VSL v\d+/g, '<LANE_LABEL>')
        .replace(/Aurora Atelier v\d+/g, '<LANE_LABEL>')
        .replace(/Fusion Growth v\d+/g, '<LANE_LABEL>')
        .replace(/Spectrum Prime v\d+/g, '<LANE_LABEL>')
        .replace(/v\d+/g, 'vN')
        .replace(/#(?:[0-9a-fA-F]{3}){1,2}/g, '#HEX')
        .replace(/\s+/g, ' ')
        .trim();
}

describe('Theme lane contract', () => {
    it('targeted lane files do not use wrapper-style pack patterns', () => {
        const bannedTokens = [
            'pack-shared',
            '__PACK_RENDER__',
            'PACK_CONFIG',
            'LANE_CONTENT_DEFAULTS',
        ];

        for (const rule of TARGET_RULES) {
            for (const version of rule.versions) {
                const source = sourceFor(rule.family, version);
                for (const token of bannedTokens) {
                    expect(source).not.toContain(token);
                }
            }
        }
    });

    it('targeted lane files remain code-distinct within each family', () => {
        for (const rule of TARGET_RULES) {
            const normalizedSources = rule.versions.map((version) => normalizeSource(sourceFor(rule.family, version)));
            const unique = new Set(normalizedSources);
            expect(unique.size).toBe(rule.versions.length);
        }
    });

    it('v5 is not a duplicate of v4 for upgraded families', () => {
        const upgradedFamilies = ['booking-widget', 'contact', 'gallery', 'pricing'];

        for (const family of upgradedFamilies) {
            const v4 = normalizeSource(sourceFor(family, 4));
            const v5 = normalizeSource(sourceFor(family, 5));
            expect(v5).not.toBe(v4);
        }
    });
});
