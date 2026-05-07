'use client';

import React, { Suspense } from 'react';
import { getRegisteredKeys, getThemeComponent } from '@booking-engine/themes';

interface SDUICondition {
    op: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'gt' | 'lt';
    path: string;
    value?: unknown;
}

const VERSIONED_KEY_PATTERN = /^([a-z-]+)\/v(\d+)$/;
const FEATURE_SLUG_ALIASES: Record<string, string> = {
    products: 'product',
    service: 'services',
    testimonial: 'testimonials',
    logo: 'logos',
};

const HEX_SHORT_COLOR_REGEX = /^#([0-9a-f]{3})$/i;
const HEX_LONG_COLOR_REGEX = /^#([0-9a-f]{6})$/i;
const RGB_COLOR_REGEX = /^rgba?\(([^)]+)\)$/i;

interface RGBColor {
    r: number;
    g: number;
    b: number;
}

interface ThemeTokens {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    font: string;
}

const LATEST_REGISTERED_KEY_BY_FEATURE: Record<string, string> = getRegisteredKeys().reduce((acc, key) => {
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
    const current = acc[featureSlug];
    if (!current) {
        acc[featureSlug] = key;
        return acc;
    }

    const currentMatch = current.match(VERSIONED_KEY_PATTERN);
    const currentVersion = currentMatch ? Number(currentMatch[2]) : -1;
    if (version > currentVersion) {
        acc[featureSlug] = key;
    }

    return acc;
}, {} as Record<string, string>);

function normalizeFeatureSlug(raw: string): string {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    return FEATURE_SLUG_ALIASES[normalized] || normalized;
}

function normalizeThemeComponentKey(raw: string): string {
    if (typeof raw !== 'string') {
        return '';
    }

    const normalized = raw
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/[\\／⁄∕]/g, '/')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s+/g, '-');

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
    return `${featureSlug}/v${versionToken}`;
}

function resolveThemeComponent(componentKey: string): { component: NonNullable<ReturnType<typeof getThemeComponent>>; resolvedKey: string } | null {
    const normalizedKey = normalizeThemeComponentKey(componentKey);
    if (!normalizedKey) {
        return null;
    }

    const direct = getThemeComponent(normalizedKey);
    if (direct) {
        return {
            component: direct,
            resolvedKey: normalizedKey,
        };
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

    const fallback = getThemeComponent(fallbackKey);
    if (!fallback) {
        return null;
    }

    return {
        component: fallback,
        resolvedKey: fallbackKey,
    };
}

function normalizeAnchorId(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_ ]/g, '')
        .replace(/\s+/g, '-');
}

function clampChannel(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(255, value));
}

function parseHexColor(color: string): RGBColor | null {
    const shortMatch = color.match(HEX_SHORT_COLOR_REGEX);
    if (shortMatch?.[1]) {
        const expanded = shortMatch[1]
            .split('')
            .map((char) => `${char}${char}`)
            .join('');
        const numeric = Number.parseInt(expanded, 16);
        return {
            r: (numeric >> 16) & 0xff,
            g: (numeric >> 8) & 0xff,
            b: numeric & 0xff,
        };
    }

    const longMatch = color.match(HEX_LONG_COLOR_REGEX);
    if (longMatch?.[1]) {
        const numeric = Number.parseInt(longMatch[1], 16);
        return {
            r: (numeric >> 16) & 0xff,
            g: (numeric >> 8) & 0xff,
            b: numeric & 0xff,
        };
    }

    return null;
}

function parseRgbColor(color: string): RGBColor | null {
    const rgbMatch = color.match(RGB_COLOR_REGEX);
    if (!rgbMatch?.[1]) return null;

    const channels = rgbMatch[1]
        .split(',')
        .slice(0, 3)
        .map((token) => clampChannel(Number.parseFloat(token.trim())));

    if (channels.length < 3) return null;

    return {
        r: channels[0] || 0,
        g: channels[1] || 0,
        b: channels[2] || 0,
    };
}

function parseColor(color: string): RGBColor | null {
    const normalized = color.trim();
    if (!normalized) return null;
    return parseHexColor(normalized) || parseRgbColor(normalized);
}

function toLinear(channel: number): number {
    const normalized = channel / 255;
    return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number | null {
    const parsed = parseColor(color);
    if (!parsed) return null;

    const r = toLinear(parsed.r);
    const g = toLinear(parsed.g);
    const b = toLinear(parsed.b);
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function getContrastRatio(foreground: string, background: string): number {
    const foregroundLum = luminance(foreground);
    const backgroundLum = luminance(background);

    if (foregroundLum === null || backgroundLum === null) {
        return 1;
    }

    const lighter = Math.max(foregroundLum, backgroundLum);
    const darker = Math.min(foregroundLum, backgroundLum);
    return (lighter + 0.05) / (darker + 0.05);
}

function getReadableTextColor(background: string, preferred: string, minContrast = 4.5): string {
    const candidates = [
        preferred,
        '#0f172a',
        '#111827',
        '#000000',
        '#f8fafc',
        '#ffffff',
    ];

    let best = candidates[0] || '#0f172a';
    let bestRatio = 0;

    for (const candidate of candidates) {
        const ratio = getContrastRatio(candidate, background);
        if (ratio >= minContrast) {
            return candidate;
        }

        if (ratio > bestRatio) {
            best = candidate;
            bestRatio = ratio;
        }
    }

    return best;
}

function readStyleColorValue(values: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const candidate = values[key];
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }
    return null;
}

function resolveSectionTokens(tokens: ThemeTokens, styles: Record<string, unknown>): ThemeTokens {
    const backgroundColor = readStyleColorValue(styles, ['sectionBackgroundColor', 'backgroundColor', 'bgColor']);
    const explicitTextColor = readStyleColorValue(styles, ['sectionTextColor', 'textColor', 'foregroundColor', 'color']);
    const autoTextContrast = styles.autoTextContrast !== false;

    if (!backgroundColor && !explicitTextColor) {
        return tokens;
    }

    const resolved: ThemeTokens = {
        ...tokens,
    };

    if (backgroundColor) {
        resolved.background = backgroundColor;
    }

    if (explicitTextColor) {
        resolved.text = explicitTextColor;
    } else if (backgroundColor && autoTextContrast) {
        resolved.text = getReadableTextColor(backgroundColor, tokens.text, 4.5);
    }

    return resolved;
}

function resolveSectionAnchorId(componentKey: string, content: Record<string, unknown>): string {
    const explicit = typeof content.sectionId === 'string' ? content.sectionId.trim() : '';
    if (explicit) {
        return normalizeAnchorId(explicit);
    }

    const featureKey = componentKey.split('/')[0] || 'section';
    return normalizeAnchorId(featureKey);
}

/**
 * Resolve a dot-path like "features.booking" against a context object.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;
    for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[seg];
    }
    return current;
}

/**
 * Evaluate SDUI conditions (AND logic). True if all pass or array is empty/null.
 */
function evaluateConditions(conditions: SDUICondition[] | null | undefined, context: Record<string, unknown>): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => {
        const resolved = resolvePath(context, c.path);
        switch (c.op) {
            case 'exists': return resolved !== undefined && resolved !== null;
            case 'notExists': return resolved === undefined || resolved === null;
            case 'equals': return resolved === c.value;
            case 'notEquals': return resolved !== c.value;
            case 'gt': return typeof resolved === 'number' && typeof c.value === 'number' && resolved > c.value;
            case 'lt': return typeof resolved === 'number' && typeof c.value === 'number' && resolved < c.value;
            default: return true;
        }
    });
}

interface SectionRendererProps {
    componentKey: string;
    content: Record<string, unknown>;
    styles: Record<string, unknown>;
    tokens: ThemeTokens;
    conditions?: SDUICondition[] | null;
    features?: Record<string, boolean>;
    isEditor?: boolean;
    context?: { tenantId: string; instanceId: string; pageSlug?: string; subdomain?: string; blogPost?: any };
}

export function SectionRenderer({ componentKey, content, styles, tokens, conditions, features, isEditor, context: rContext }: SectionRendererProps) {
    const resolvedTokens = resolveSectionTokens(tokens, styles || {});

    // In editor mode, always render (show everything). In preview/public, evaluate conditions.
    if (!isEditor && conditions && conditions.length > 0) {
        const context: Record<string, unknown> = {
            tokens: resolvedTokens,
            features: features || {},
            props: content,
        };
        if (!evaluateConditions(conditions, context)) {
            return null;
        }
    }

    const resolvedTheme = resolveThemeComponent(componentKey);

    if (!resolvedTheme?.component) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px' }}>
                Unknown component: {componentKey}
            </div>
        );
    }

    const { component: Component, resolvedKey } = resolvedTheme;
    const contentNode = <Component content={content} styles={styles} tokens={resolvedTokens} isEditor={isEditor} context={rContext} />;
    const anchorId = resolveSectionAnchorId(resolvedKey, content);

    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>}>
            <div
                id={anchorId}
                data-section-anchor={anchorId}
                style={isEditor ? { display: 'contents' } : { scrollMarginTop: '108px' }}
                onClick={(e) => {
                    if (!isEditor) {
                        return;
                    }

                    const anchor = (e.target as HTMLElement).closest('a');
                    if (!anchor) {
                        return;
                    }

                    // Keep default editor safety unless a link opts in for navigation.
                    if (anchor.getAttribute('data-editor-nav') !== 'allow') {
                        e.preventDefault();
                    }
                }}
            >
                <div className="be-theme-mobile-safe" style={isEditor ? { display: 'contents' } : undefined}>
                    {contentNode}
                </div>
            </div>
        </Suspense>
    );
}
