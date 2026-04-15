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
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    conditions?: SDUICondition[] | null;
    features?: Record<string, boolean>;
    isEditor?: boolean;
    context?: { tenantId: string; instanceId: string; pageSlug?: string };
}

export function SectionRenderer({ componentKey, content, styles, tokens, conditions, features, isEditor, context: rContext }: SectionRendererProps) {
    // In editor mode, always render (show everything). In preview/public, evaluate conditions.
    if (!isEditor && conditions && conditions.length > 0) {
        const context: Record<string, unknown> = {
            tokens,
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
    const contentNode = <Component content={content} styles={styles} tokens={tokens} isEditor={isEditor} context={rContext} />;
    const anchorId = resolveSectionAnchorId(resolvedKey, content);

    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>}>
            <div
                id={anchorId}
                data-section-anchor={anchorId}
                style={isEditor ? { display: 'contents' } : { scrollMarginTop: '108px' }}
                onClick={(e) => {
                    if (isEditor && (e.target as HTMLElement).closest('a')) {
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
