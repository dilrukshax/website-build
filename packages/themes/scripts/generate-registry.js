const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const REGISTRY_FILE = path.join(__dirname, '../src/registry.ts');

const specialPacks = {
    'fusion-growth-v1': 13,
    'harmozi-vsl-v1': 14
};

function main() {
    const registryEntries = [];
    const maxVersions = {};

    const dirs = fs.readdirSync(COMPONENTS_DIR);
    for (const dir of dirs) {
        const dirPath = path.join(COMPONENTS_DIR, dir);
        if (!fs.statSync(dirPath).isDirectory() || dir === 'shared') {
            continue;
        }

        if (specialPacks[dir]) {
            const version = specialPacks[dir];
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                if (!file.endsWith('.tsx')) continue;
                const match = file.match(/^([a-z-]+)-v\d+\.tsx$/);
                if (match) {
                    const feature = match[1];
                    const key = `${feature}/v${version}`;
                    const importPath = `./components/${dir}/${file.replace('.tsx', '')}`;
                    registryEntries.push({ key, importPath });
                    maxVersions[feature] = Math.max(maxVersions[feature] || 0, version);
                }
            }
            continue;
        }

        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (!file.endsWith('.tsx')) continue;
            const match = file.match(/^v(\d+)\.tsx$/);
            if (match) {
                const version = parseInt(match[1], 10);
                const key = `${dir}/v${version}`;
                const importPath = `./components/${dir}/${file.replace('.tsx', '')}`;
                registryEntries.push({ key, importPath });
                maxVersions[dir] = Math.max(maxVersions[dir] || 0, version);
            }
        }
    }

    registryEntries.sort((a, b) => {
        const [featA, verA] = a.key.split('/v');
        const [featB, verB] = b.key.split('/v');
        if (featA !== featB) {
            return featA.localeCompare(featB);
        }
        return parseInt(verA, 10) - parseInt(verB, 10);
    });

    const registryLines = registryEntries.map(e => `    '${e.key}': React.lazy(() => import('${e.importPath}')),`).join('\n');

    const fileContent = `import React from 'react';
import type { ThemeComponentProps } from './types';

type ThemeComponent = React.ComponentType<ThemeComponentProps>;

const VERSIONED_KEY_PATTERN = /^([a-z-]+)\\/v(\\d+)$/;
const FEATURE_SLUG_ALIASES: Record<string, string> = {
    products: 'product',
    blogs: 'blog',
    service: 'services',
    testimonial: 'testimonials',
    logo: 'logos',
};

const MAX_REGISTERED_VERSION_BY_FEATURE: Record<string, number> = ${JSON.stringify(maxVersions, null, 4)};

const TARGET_THEME_VERSION = 14;

export const THEME_REGISTRY: Record<string, ThemeComponent> = {
${registryLines}
};

for (const [featureSlug, maxVersion] of Object.entries(MAX_REGISTERED_VERSION_BY_FEATURE)) {
    for (let version = maxVersion + 1; version <= TARGET_THEME_VERSION; version += 1) {
        const sourceVersion = ((version - 1) % maxVersion) + 1;
        const sourceKey = \`\${featureSlug}/v\${sourceVersion}\`;
        const targetKey = \`\${featureSlug}/v\${version}\`;
        const sourceComponent = THEME_REGISTRY[sourceKey];
        if (sourceComponent) {
            THEME_REGISTRY[targetKey] = sourceComponent;
        }
    }
}

const LATEST_REGISTERED_KEY_BY_FEATURE: Record<string, string> = Object.keys(THEME_REGISTRY).reduce(
    (acc, key) => {
        const match = key.match(VERSIONED_KEY_PATTERN);
        if (!match) {
            return acc;
        }

        const featureSlug = match[1];
        const versionToken = match[2];
        if (!featureSlug || !versionToken) {
            return acc;
        }

        const version = Number(versionToken);
        const currentKey = acc[featureSlug];

        if (!currentKey) {
            acc[featureSlug] = key;
            return acc;
        }

        const currentVersionMatch = currentKey.match(VERSIONED_KEY_PATTERN);
        const currentVersion = currentVersionMatch ? Number(currentVersionMatch[2]) : -1;
        if (version > currentVersion) {
            acc[featureSlug] = key;
        }

        return acc;
    },
    {} as Record<string, string>,
);

function normalizeFeatureSlug(raw: string): string {
    const normalized = raw.trim().toLowerCase().replace(/\\s+/g, '-');
    return FEATURE_SLUG_ALIASES[normalized] || normalized;
}

function normalizeComponentKey(raw: string): string {
    if (typeof raw !== 'string') {
        return '';
    }

    const normalized = raw
        .normalize('NFKC')
        .replace(/[\\u200B-\\u200D\\u2060\\uFEFF]/g, '')
        .replace(/[\\\\／⁄∕]/g, '/')
        .replace(/[\\x00-\\x1F\\x7F]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\\s*\\/\\s*/g, '/')
        .replace(/\\s+/g, '-');

    const match = normalized.match(VERSIONED_KEY_PATTERN);
    if (!match) {
        return normalized;
    }

    const featureSlugToken = match[1];
    const versionToken = match[2];
    if (!featureSlugToken || !versionToken) {
        return normalized;
    }

    const featureSlug = normalizeFeatureSlug(featureSlugToken);
    return \`\${featureSlug}/v\${versionToken}\`;
}

export function getThemeComponent(componentKey: string): ThemeComponent | null {
    const normalizedKey = normalizeComponentKey(componentKey);
    if (!normalizedKey) {
        return null;
    }

    const direct = THEME_REGISTRY[normalizedKey];
    if (direct) {
        return direct;
    }

    const match = normalizedKey.match(VERSIONED_KEY_PATTERN);
    if (!match) {
        return null;
    }

    const featureSlugToken = match[1];
    if (!featureSlugToken) {
        return null;
    }

    const featureSlug = normalizeFeatureSlug(featureSlugToken);
    const fallbackKey = LATEST_REGISTERED_KEY_BY_FEATURE[featureSlug];
    if (!fallbackKey) {
        return null;
    }

    return THEME_REGISTRY[fallbackKey] || null;
}

export function getRegisteredKeys(): string[] {
    return Object.keys(THEME_REGISTRY);
}
`;

    fs.writeFileSync(REGISTRY_FILE, fileContent, 'utf-8');
    console.log('Successfully generated registry.ts');
}

main();
