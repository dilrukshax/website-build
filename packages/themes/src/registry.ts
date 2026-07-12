import React from 'react';
import type { ThemeComponentProps } from './types';

type ThemeComponent = React.ComponentType<ThemeComponentProps>;

const VERSIONED_KEY_PATTERN = /^([a-z-]+)\/v(\d+)$/;
const FEATURE_SLUG_ALIASES: Record<string, string> = {
    products: 'product',
    blogs: 'blog',
    service: 'services',
    testimonial: 'testimonials',
    logo: 'logos',
};

const MAX_REGISTERED_VERSION_BY_FEATURE: Record<string, number> = {
    "about": 15,
    "blog": 15,
    "blog-post-detail": 2,
    "booking-widget": 12,
    "contact": 15,
    "faq": 13,
    "footer": 15,
    "header": 15,
    "hero": 15,
    "logos": 13,
    "product": 14,
    "services": 14,
    "team": 14,
    "testimonials": 14,
    "gallery": 12,
    "pricing": 12
};

const TARGET_THEME_VERSION = 14;

export const THEME_REGISTRY: Record<string, ThemeComponent> = {
    'about/v1': React.lazy(() => import('./components/about/v1')),
    'about/v2': React.lazy(() => import('./components/about/v2')),
    'about/v3': React.lazy(() => import('./components/about/v3')),
    'about/v4': React.lazy(() => import('./components/about/v4')),
    'about/v5': React.lazy(() => import('./components/about/v5')),
    'about/v6': React.lazy(() => import('./components/about/v6')),
    'about/v7': React.lazy(() => import('./components/about/v7')),
    'about/v8': React.lazy(() => import('./components/about/v8')),
    'about/v9': React.lazy(() => import('./components/about/v9')),
    'about/v10': React.lazy(() => import('./components/about/v10')),
    'about/v11': React.lazy(() => import('./components/about/v11')),
    'about/v12': React.lazy(() => import('./components/about/v12')),
    'about/v13': React.lazy(() => import('./components/fusion-growth-v1/about-v1')),
    'about/v14': React.lazy(() => import('./components/harmozi-vsl-v1/about-v1')),
    'about/v15': React.lazy(() => import('./components/about/v15')),
    'blog/v1': React.lazy(() => import('./components/blog/v1')),
    'blog/v2': React.lazy(() => import('./components/blog/v2')),
    'blog/v3': React.lazy(() => import('./components/blog/v3')),
    'blog/v15': React.lazy(() => import('./components/blog/v15')),
    'blog-post-detail/v1': React.lazy(() => import('./components/blog-post-detail/v1')),
    'blog-post-detail/v2': React.lazy(() => import('./components/blog-post-detail/v2')),
    'booking-widget/v1': React.lazy(() => import('./components/booking-widget/v1')),
    'booking-widget/v2': React.lazy(() => import('./components/booking-widget/v2')),
    'booking-widget/v3': React.lazy(() => import('./components/booking-widget/v3')),
    'booking-widget/v4': React.lazy(() => import('./components/booking-widget/v4')),
    'booking-widget/v5': React.lazy(() => import('./components/booking-widget/v5')),
    'booking-widget/v6': React.lazy(() => import('./components/booking-widget/v6')),
    'booking-widget/v7': React.lazy(() => import('./components/booking-widget/v7')),
    'booking-widget/v8': React.lazy(() => import('./components/booking-widget/v8')),
    'booking-widget/v9': React.lazy(() => import('./components/booking-widget/v9')),
    'booking-widget/v10': React.lazy(() => import('./components/booking-widget/v10')),
    'booking-widget/v11': React.lazy(() => import('./components/booking-widget/v11')),
    'booking-widget/v12': React.lazy(() => import('./components/booking-widget/v12')),
    'contact/v1': React.lazy(() => import('./components/contact/v1')),
    'contact/v2': React.lazy(() => import('./components/contact/v2')),
    'contact/v3': React.lazy(() => import('./components/contact/v3')),
    'contact/v4': React.lazy(() => import('./components/contact/v4')),
    'contact/v5': React.lazy(() => import('./components/contact/v5')),
    'contact/v6': React.lazy(() => import('./components/contact/v6')),
    'contact/v7': React.lazy(() => import('./components/contact/v7')),
    'contact/v8': React.lazy(() => import('./components/contact/v8')),
    'contact/v9': React.lazy(() => import('./components/contact/v9')),
    'contact/v10': React.lazy(() => import('./components/contact/v10')),
    'contact/v11': React.lazy(() => import('./components/contact/v11')),
    'contact/v12': React.lazy(() => import('./components/contact/v12')),
    'contact/v14': React.lazy(() => import('./components/harmozi-vsl-v1/contact-v1')),
    'contact/v15': React.lazy(() => import('./components/contact/v15')),
    'faq/v1': React.lazy(() => import('./components/faq/v1')),
    'faq/v2': React.lazy(() => import('./components/faq/v2')),
    'faq/v3': React.lazy(() => import('./components/faq/v3')),
    'faq/v4': React.lazy(() => import('./components/faq/v4')),
    'faq/v5': React.lazy(() => import('./components/faq/v5')),
    'faq/v6': React.lazy(() => import('./components/faq/v6')),
    'faq/v7': React.lazy(() => import('./components/faq/v7')),
    'faq/v8': React.lazy(() => import('./components/faq/v8')),
    'faq/v9': React.lazy(() => import('./components/faq/v9')),
    'faq/v10': React.lazy(() => import('./components/faq/v10')),
    'faq/v11': React.lazy(() => import('./components/faq/v11')),
    'faq/v12': React.lazy(() => import('./components/faq/v12')),
    'faq/v13': React.lazy(() => import('./components/faq/v13')),
    'footer/v1': React.lazy(() => import('./components/footer/v1')),
    'footer/v2': React.lazy(() => import('./components/footer/v2')),
    'footer/v3': React.lazy(() => import('./components/footer/v3')),
    'footer/v4': React.lazy(() => import('./components/footer/v4')),
    'footer/v5': React.lazy(() => import('./components/footer/v5')),
    'footer/v6': React.lazy(() => import('./components/footer/v6')),
    'footer/v7': React.lazy(() => import('./components/footer/v7')),
    'footer/v8': React.lazy(() => import('./components/footer/v8')),
    'footer/v9': React.lazy(() => import('./components/footer/v9')),
    'footer/v10': React.lazy(() => import('./components/footer/v10')),
    'footer/v11': React.lazy(() => import('./components/footer/v11')),
    'footer/v12': React.lazy(() => import('./components/footer/v12')),
    'footer/v13': React.lazy(() => import('./components/fusion-growth-v1/footer-v1')),
    'footer/v14': React.lazy(() => import('./components/harmozi-vsl-v1/footer-v1')),
    'footer/v15': React.lazy(() => import('./components/footer/v15')),
    'gallery/v1': React.lazy(() => import('./components/gallery/v1')),
    'gallery/v2': React.lazy(() => import('./components/gallery/v2')),
    'gallery/v3': React.lazy(() => import('./components/gallery/v3')),
    'gallery/v4': React.lazy(() => import('./components/gallery/v4')),
    'gallery/v5': React.lazy(() => import('./components/gallery/v5')),
    'gallery/v6': React.lazy(() => import('./components/gallery/v6')),
    'gallery/v7': React.lazy(() => import('./components/gallery/v7')),
    'gallery/v8': React.lazy(() => import('./components/gallery/v8')),
    'gallery/v9': React.lazy(() => import('./components/gallery/v9')),
    'gallery/v10': React.lazy(() => import('./components/gallery/v10')),
    'gallery/v11': React.lazy(() => import('./components/gallery/v11')),
    'gallery/v12': React.lazy(() => import('./components/gallery/v12')),
    'header/v1': React.lazy(() => import('./components/header/v1')),
    'header/v2': React.lazy(() => import('./components/header/v2')),
    'header/v3': React.lazy(() => import('./components/header/v3')),
    'header/v4': React.lazy(() => import('./components/header/v4')),
    'header/v5': React.lazy(() => import('./components/header/v5')),
    'header/v6': React.lazy(() => import('./components/header/v6')),
    'header/v7': React.lazy(() => import('./components/header/v7')),
    'header/v8': React.lazy(() => import('./components/header/v8')),
    'header/v9': React.lazy(() => import('./components/header/v9')),
    'header/v10': React.lazy(() => import('./components/header/v10')),
    'header/v11': React.lazy(() => import('./components/header/v11')),
    'header/v12': React.lazy(() => import('./components/header/v12')),
    'header/v13': React.lazy(() => import('./components/fusion-growth-v1/header-v1')),
    'header/v14': React.lazy(() => import('./components/harmozi-vsl-v1/header-v1')),
    'header/v15': React.lazy(() => import('./components/header/v15')),
    'hero/v1': React.lazy(() => import('./components/hero/v1')),
    'hero/v2': React.lazy(() => import('./components/hero/v2')),
    'hero/v3': React.lazy(() => import('./components/hero/v3')),
    'hero/v4': React.lazy(() => import('./components/hero/v4')),
    'hero/v5': React.lazy(() => import('./components/hero/v5')),
    'hero/v6': React.lazy(() => import('./components/hero/v6')),
    'hero/v7': React.lazy(() => import('./components/hero/v7')),
    'hero/v8': React.lazy(() => import('./components/hero/v8')),
    'hero/v9': React.lazy(() => import('./components/hero/v9')),
    'hero/v10': React.lazy(() => import('./components/hero/v10')),
    'hero/v11': React.lazy(() => import('./components/hero/v11')),
    'hero/v12': React.lazy(() => import('./components/hero/v12')),
    'hero/v13': React.lazy(() => import('./components/fusion-growth-v1/hero-v1')),
    'hero/v14': React.lazy(() => import('./components/harmozi-vsl-v1/hero-v1')),
    'hero/v15': React.lazy(() => import('./components/hero/v15')),
    'logos/v5': React.lazy(() => import('./components/logos/v5')),
    'logos/v6': React.lazy(() => import('./components/logos/v6')),
    'logos/v7': React.lazy(() => import('./components/logos/v7')),
    'logos/v8': React.lazy(() => import('./components/logos/v8')),
    'logos/v9': React.lazy(() => import('./components/logos/v9')),
    'logos/v10': React.lazy(() => import('./components/logos/v10')),
    'logos/v11': React.lazy(() => import('./components/logos/v11')),
    'logos/v12': React.lazy(() => import('./components/logos/v12')),
    'logos/v13': React.lazy(() => import('./components/fusion-growth-v1/logos-v1')),
    'pricing/v1': React.lazy(() => import('./components/pricing/v1')),
    'pricing/v2': React.lazy(() => import('./components/pricing/v2')),
    'pricing/v3': React.lazy(() => import('./components/pricing/v3')),
    'pricing/v4': React.lazy(() => import('./components/pricing/v4')),
    'pricing/v5': React.lazy(() => import('./components/pricing/v5')),
    'pricing/v6': React.lazy(() => import('./components/pricing/v6')),
    'pricing/v7': React.lazy(() => import('./components/pricing/v7')),
    'pricing/v8': React.lazy(() => import('./components/pricing/v8')),
    'pricing/v9': React.lazy(() => import('./components/pricing/v9')),
    'pricing/v10': React.lazy(() => import('./components/pricing/v10')),
    'pricing/v11': React.lazy(() => import('./components/pricing/v11')),
    'pricing/v12': React.lazy(() => import('./components/pricing/v12')),
    'product/v1': React.lazy(() => import('./components/product/v1')),
    'product/v2': React.lazy(() => import('./components/product/v2')),
    'product/v3': React.lazy(() => import('./components/product/v3')),
    'product/v4': React.lazy(() => import('./components/product/v4')),
    'product/v5': React.lazy(() => import('./components/product/v5')),
    'product/v6': React.lazy(() => import('./components/product/v6')),
    'product/v7': React.lazy(() => import('./components/product/v7')),
    'product/v8': React.lazy(() => import('./components/product/v8')),
    'product/v9': React.lazy(() => import('./components/product/v9')),
    'product/v10': React.lazy(() => import('./components/product/v10')),
    'product/v11': React.lazy(() => import('./components/product/v11')),
    'product/v12': React.lazy(() => import('./components/product/v12')),
    'product/v13': React.lazy(() => import('./components/fusion-growth-v1/product-v1')),
    'product/v14': React.lazy(() => import('./components/harmozi-vsl-v1/product-v1')),
    'services/v1': React.lazy(() => import('./components/services/v1')),
    'services/v2': React.lazy(() => import('./components/services/v2')),
    'services/v3': React.lazy(() => import('./components/services/v3')),
    'services/v4': React.lazy(() => import('./components/services/v4')),
    'services/v5': React.lazy(() => import('./components/services/v5')),
    'services/v6': React.lazy(() => import('./components/services/v6')),
    'services/v7': React.lazy(() => import('./components/services/v7')),
    'services/v8': React.lazy(() => import('./components/services/v8')),
    'services/v9': React.lazy(() => import('./components/services/v9')),
    'services/v10': React.lazy(() => import('./components/services/v10')),
    'services/v11': React.lazy(() => import('./components/services/v11')),
    'services/v12': React.lazy(() => import('./components/services/v12')),
    'services/v13': React.lazy(() => import('./components/fusion-growth-v1/services-v1')),
    'services/v14': React.lazy(() => import('./components/harmozi-vsl-v1/services-v1')),
    'team/v1': React.lazy(() => import('./components/team/v1')),
    'team/v2': React.lazy(() => import('./components/team/v2')),
    'team/v3': React.lazy(() => import('./components/team/v3')),
    'team/v4': React.lazy(() => import('./components/team/v4')),
    'team/v5': React.lazy(() => import('./components/team/v5')),
    'team/v6': React.lazy(() => import('./components/team/v6')),
    'team/v7': React.lazy(() => import('./components/team/v7')),
    'team/v8': React.lazy(() => import('./components/team/v8')),
    'team/v9': React.lazy(() => import('./components/team/v9')),
    'team/v10': React.lazy(() => import('./components/team/v10')),
    'team/v11': React.lazy(() => import('./components/team/v11')),
    'team/v12': React.lazy(() => import('./components/team/v12')),
    'team/v13': React.lazy(() => import('./components/fusion-growth-v1/team-v1')),
    'team/v14': React.lazy(() => import('./components/harmozi-vsl-v1/team-v1')),
    'testimonials/v1': React.lazy(() => import('./components/testimonials/v1')),
    'testimonials/v2': React.lazy(() => import('./components/testimonials/v2')),
    'testimonials/v3': React.lazy(() => import('./components/testimonials/v3')),
    'testimonials/v4': React.lazy(() => import('./components/testimonials/v4')),
    'testimonials/v5': React.lazy(() => import('./components/testimonials/v5')),
    'testimonials/v6': React.lazy(() => import('./components/testimonials/v6')),
    'testimonials/v7': React.lazy(() => import('./components/testimonials/v7')),
    'testimonials/v8': React.lazy(() => import('./components/testimonials/v8')),
    'testimonials/v9': React.lazy(() => import('./components/testimonials/v9')),
    'testimonials/v10': React.lazy(() => import('./components/testimonials/v10')),
    'testimonials/v11': React.lazy(() => import('./components/testimonials/v11')),
    'testimonials/v12': React.lazy(() => import('./components/testimonials/v12')),
    'testimonials/v13': React.lazy(() => import('./components/fusion-growth-v1/testimonials-v1')),
    'testimonials/v14': React.lazy(() => import('./components/harmozi-vsl-v1/testimonials-v1')),
};

for (const [featureSlug, maxVersion] of Object.entries(MAX_REGISTERED_VERSION_BY_FEATURE)) {
    for (let version = maxVersion + 1; version <= TARGET_THEME_VERSION; version += 1) {
        const sourceVersion = ((version - 1) % maxVersion) + 1;
        const sourceKey = `${featureSlug}/v${sourceVersion}`;
        const targetKey = `${featureSlug}/v${version}`;
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
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    return FEATURE_SLUG_ALIASES[normalized] || normalized;
}

function normalizeComponentKey(raw: string): string {
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
