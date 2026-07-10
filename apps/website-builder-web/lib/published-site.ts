import { fetchCurrentRoutingIndexPointer } from './routing-index';
import { env } from './env';

export const UNKNOWN_SUBDOMAIN = '__unknown__';
const ROOT_DOMAIN = normalizeHost(env.siteDomain() || 'buildmyonlineweb.site');
const CMS_PLATFORM_HOST = normalizeHost(env.cmsUrl());

const ROUTING_INDEX_CACHE_TTL_MS = env.routingIndexCacheTtlMs();
const MANIFEST_CACHE_TTL_MS = parsePositiveInteger(
    process.env.NEXT_PUBLIC_MANIFEST_CACHE_TTL_MS || process.env.MANIFEST_CACHE_TTL_MS,
    ROUTING_INDEX_CACHE_TTL_MS,
);
const SHOULD_CACHE = process.env.NODE_ENV !== 'test';

type CachedRoutingIndex = {
    expiresAt: number;
    index: RoutingIndexDocument;
};

type CachedManifest = {
    expiresAt: number;
    manifest: PublishedManifest;
};

let cachedRoutingIndex: CachedRoutingIndex | null = null;
const cachedManifests = new Map<string, CachedManifest>();

interface ResolveManifestCacheOptions {
    bypassCache?: boolean;
}

export type TwitterCardType = 'summary' | 'summary_large_image';

export interface SEOData {
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    canonicalPath?: string | null;
    robotsIndex?: boolean | null;
    robotsFollow?: boolean | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImageUrl?: string | null;
    ogImageAlt?: string | null;
    twitterCard?: TwitterCardType | null;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    twitterImageUrl?: string | null;
    twitterImageAlt?: string | null;
}

export interface WebsiteSEOBusiness {
    businessType?: string | null;
    name?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    telephone?: string | null;
    email?: string | null;
    priceRange?: string | null;
    streetAddress?: string | null;
    addressLocality?: string | null;
    addressRegion?: string | null;
    postalCode?: string | null;
    addressCountry?: string | null;
    sameAs?: string[] | null;
}

export interface PublishedManifestPage {
    page: {
        id: string;
        slug: string;
        title: string;
        seo?: SEOData | null;
    };
    sections: Array<{
        id: string;
        type: string;
        props: Record<string, unknown>;
        styles: Record<string, unknown>;
        conditions?: Array<{
            op: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'gt' | 'lt';
            path: string;
            value?: unknown;
        }>;
        position: number;
    }>;
}

export interface PublishedManifest {
    tenantId: string;
    instanceId: string;
    subdomain: string;
    fullDomain?: string | null;
    primaryDomain?: string | null;
    defaultPageSlug?: string | null;
    siteName?: string | null;
    seoDefaults?: SEOData | null;
    seoBusiness?: WebsiteSEOBusiness | null;
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    features: Record<string, boolean>;
    header: Record<string, unknown>;
    footer: Record<string, unknown>;
    customCode?: {
        head?: string | null;
        bodyTop?: string | null;
        bodyBottom?: string | null;
    } | null;
    pages: PublishedManifestPage[];
}

interface RoutingIndexEntry {
    instanceId: string;
    tenantId: string;
    subdomain: string;
    manifestUrl: string | null;
    active: boolean;
}

interface RoutingIndexDocument {
    version: string;
    generatedAt: string;
    hosts: Record<string, RoutingIndexEntry>;
}

interface ManifestPointer {
    manifestUrl?: string | null;
}

interface PublishedSiteLookupResponse {
    success?: boolean;
    data?: {
        manifest?: PublishedManifest | null;
    };
}

export interface ResolvedPublishedPageSeo {
    title: string;
    description: string | null;
    metaKeywords: string | null;
    canonicalPath: string;
    canonicalUrl: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
    ogTitle: string;
    ogDescription: string | null;
    ogImageUrl: string | null;
    ogImageAlt: string | null;
    twitterCard: TwitterCardType;
    twitterTitle: string;
    twitterDescription: string | null;
    twitterImageUrl: string | null;
    twitterImageAlt: string | null;
    siteName: string | null;
}

function parsePositiveInteger(input: string | undefined, fallback: number): number {
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0) {
        return fallback;
    }
    return Math.floor(value);
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

function normalizeBaseUrl(input: string | null | undefined): string {
    const value = (input || '').trim();
    if (!value) {
        return '';
    }

    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
        const parsed = new URL(withProtocol);
        return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
    } catch {
        return '';
    }
}

function resolveApiBaseUrl(): string {
    return normalizeBaseUrl(env.apiBaseUrl());
}

export function normalizeHost(host: string | null | undefined): string {
    if (!host) {
        return '';
    }

    const trimmed = host.split(',')[0]?.trim().toLowerCase() || '';
    if (!trimmed) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        return new URL(candidate).hostname.toLowerCase();
    } catch {
        return '';
    }
}

export function resolveRoutedRequestHost(headersLike: { get(name: string): string | null }): string {
    return normalizeHost(
        headersLike.get('x-routed-host')
        || headersLike.get('x-forwarded-host')
        || headersLike.get('host'),
    );
}

function isLocalDevelopmentHost(host: string): boolean {
    return host === 'localhost'
        || host === '127.0.0.1'
        || host === '[::1]'
        || host.endsWith('.localhost');
}

function getOriginForHost(host: string): string {
    const normalized = normalizeHost(host);
    if (!normalized) {
        return '';
    }
    return `${isLocalDevelopmentHost(normalized) ? 'http' : 'https'}://${normalized}`;
}

function toAbsoluteUrl(urlValue: string | null | undefined, origin: string): string | null {
    if (!urlValue || typeof urlValue !== 'string') {
        return null;
    }

    const trimmed = urlValue.trim();
    if (!trimmed) {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith('/') && origin) {
        return `${origin}${trimmed}`;
    }

    return null;
}

function normalizePageSlug(slug: string | null | undefined): string {
    if (!slug || slug === '/') {
        return '/';
    }
    return slug.replace(/^\/+/, '').replace(/\/+$/, '');
}

function pageSlugToPath(slug: string | null | undefined): string {
    const normalized = normalizePageSlug(slug);
    return normalized === '/' ? '/' : `/${normalized}`;
}

function resolveCanonicalPath(value: string | null | undefined, fallbackPath: string): string {
    const trimmed = value?.trim() || '';
    if (!trimmed || !trimmed.startsWith('/')) {
        return fallbackPath;
    }
    return trimmed;
}

function buildHostCandidates(hostname: string): string[] {
    const normalized = normalizeHost(hostname);
    if (!normalized) {
        return [];
    }

    if (normalized.startsWith('www.')) {
        const apex = normalized.slice(4);
        return apex ? [normalized, apex] : [normalized];
    }

    return [normalized, `www.${normalized}`];
}

function findRoutingIndexEntry(index: RoutingIndexDocument, options: {
    hostname: string;
    subdomain: string | null;
}): RoutingIndexEntry | null {
    const hostCandidates = buildHostCandidates(options.hostname);
    for (const host of hostCandidates) {
        const entry = index.hosts[host];
        if (entry?.active) {
            return entry;
        }
    }

    if (options.subdomain) {
        for (const entry of Object.values(index.hosts)) {
            if (entry.active && entry.subdomain === options.subdomain) {
                return entry;
            }
        }
    }

    return null;
}

async function fetchRoutingIndexDocument(options: ResolveManifestCacheOptions = {}): Promise<RoutingIndexDocument | null> {
    const bypassCache = options.bypassCache === true;
    const now = Date.now();
    if (!bypassCache && SHOULD_CACHE && cachedRoutingIndex && cachedRoutingIndex.expiresAt > now) {
        return cachedRoutingIndex.index;
    }

    const pointer = await fetchCurrentRoutingIndexPointer();
    if (!pointer?.indexUrl) {
        return null;
    }

    try {
        const response = await fetch(pointer.indexUrl, { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        const index = await response.json() as RoutingIndexDocument;
        if (!index || typeof index !== 'object' || !index.hosts || typeof index.hosts !== 'object') {
            return null;
        }

        if (!bypassCache && SHOULD_CACHE) {
            cachedRoutingIndex = {
                expiresAt: now + ROUTING_INDEX_CACHE_TTL_MS,
                index,
            };
        }
        return index;
    } catch {
        return null;
    }
}

function buildManifestCacheKey(entry: RoutingIndexEntry): string {
    return `${entry.instanceId}:${entry.manifestUrl || ''}`;
}

async function fetchManifestFromRoutingEntry(
    entry: RoutingIndexEntry,
    options: ResolveManifestCacheOptions = {},
): Promise<PublishedManifest | null> {
    const bypassCache = options.bypassCache === true;
    if (!entry.manifestUrl) {
        return null;
    }

    const now = Date.now();
    const cacheKey = buildManifestCacheKey(entry);
    const cached = cachedManifests.get(cacheKey);
    if (!bypassCache && SHOULD_CACHE && cached && cached.expiresAt > now) {
        return cached.manifest;
    }

    try {
        const pointerResponse = await fetch(entry.manifestUrl, { method: 'GET', cache: 'no-store' });
        if (!pointerResponse.ok) {
            return null;
        }

        const pointer = await pointerResponse.json() as ManifestPointer;
        if (!pointer?.manifestUrl) {
            return null;
        }

        const manifestResponse = await fetch(pointer.manifestUrl, { method: 'GET', cache: 'no-store' });
        if (!manifestResponse.ok) {
            return null;
        }

        const manifest = await manifestResponse.json() as PublishedManifest;
        if (!manifest || !Array.isArray(manifest.pages)) {
            return null;
        }

        if (!bypassCache && SHOULD_CACHE) {
            cachedManifests.set(cacheKey, {
                expiresAt: now + MANIFEST_CACHE_TTL_MS,
                manifest,
            });
        }

        return manifest;
    } catch {
        if (cached) {
            return cached.manifest;
        }
        return null;
    }
}

async function fetchManifestBySubdomainFallback(subdomain: string): Promise<PublishedManifest | null> {
    const normalizedSubdomain = subdomain.trim().toLowerCase();
    if (!normalizedSubdomain || normalizedSubdomain === UNKNOWN_SUBDOMAIN) {
        return null;
    }

    const apiBaseUrl = resolveApiBaseUrl();
    if (!apiBaseUrl) {
        return null;
    }

    try {
        const url = new URL(`/web/sites/${encodeURIComponent(normalizedSubdomain)}`, `${apiBaseUrl}/`);
        const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as PublishedSiteLookupResponse;
        const manifest = payload?.data?.manifest;
        if (!manifest || !Array.isArray(manifest.pages)) {
            return null;
        }
        return manifest;
    } catch {
        return null;
    }
}

export async function resolvePublishedManifest(input: {
    subdomain: string;
    hostname: string;
    bypassCache?: boolean;
}): Promise<{ manifest: PublishedManifest | null; entry: RoutingIndexEntry | null }> {
    const normalizedSubdomain = input.subdomain.trim().toLowerCase();
    const normalizedHost = normalizeHost(input.hostname);
    const index = await fetchRoutingIndexDocument({ bypassCache: input.bypassCache });

    if (index) {
        const entry = findRoutingIndexEntry(index, {
            hostname: normalizedHost,
            subdomain: normalizedSubdomain !== UNKNOWN_SUBDOMAIN ? normalizedSubdomain : null,
        });

        if (entry) {
            const manifest = await fetchManifestFromRoutingEntry(entry, { bypassCache: input.bypassCache });
            if (manifest) {
                return { manifest, entry };
            }

            const fallbackSubdomain = normalizedSubdomain !== UNKNOWN_SUBDOMAIN ? normalizedSubdomain : entry.subdomain;
            if (fallbackSubdomain) {
                const fallbackManifest = await fetchManifestBySubdomainFallback(fallbackSubdomain);
                if (fallbackManifest) {
                    return { manifest: fallbackManifest, entry };
                }
            }

            return { manifest: null, entry };
        }
    }

    if (normalizedSubdomain && normalizedSubdomain !== UNKNOWN_SUBDOMAIN) {
        const fallbackManifest = await fetchManifestBySubdomainFallback(normalizedSubdomain);
        if (fallbackManifest) {
            return { manifest: fallbackManifest, entry: null };
        }
    }

    return { manifest: null, entry: null };
}

export function resolveRequestedSlug(pathSegments: string[] | undefined): string {
    if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
        return '/';
    }

    const cleaned = pathSegments
        .map((segment) => segment.trim())
        .filter(Boolean);
    if (cleaned.length === 0) {
        return '/';
    }

    return cleaned.join('/');
}

export function findManifestPageByRequestedSlug(manifest: PublishedManifest, requestedSlug: string): PublishedManifestPage | null {
    const normalizedRequestedSlug = normalizePageSlug(requestedSlug);
    const exactMatch = manifest.pages.find((entry) => normalizePageSlug(entry.page.slug) === normalizedRequestedSlug) || null;
    if (exactMatch) {
        return exactMatch;
    }

    if (normalizedRequestedSlug !== '/') {
        return null;
    }

    const preferredRootSlug = normalizePageSlug(manifest.defaultPageSlug || null);
    if (preferredRootSlug && preferredRootSlug !== '/') {
        const preferredMatch = manifest.pages.find((entry) => normalizePageSlug(entry.page.slug) === preferredRootSlug) || null;
        if (preferredMatch) {
            return preferredMatch;
        }
    }

    return manifest.pages[0] || null;
}

export function resolveCanonicalHost(manifest: PublishedManifest, fallbackHost: string): string {
    return normalizeHost(manifest.primaryDomain || manifest.fullDomain || fallbackHost);
}

export function isCmsHost(host: string): boolean {
    const normalizedHost = normalizeHost(host);
    if (!normalizedHost) {
        return false;
    }

    return normalizedHost === ROOT_DOMAIN
        || normalizedHost === `www.${ROOT_DOMAIN}`
        || normalizedHost === CMS_PLATFORM_HOST;
}

export function resolvePublishedPageSeo(input: {
    manifest: PublishedManifest;
    pageEntry: PublishedManifestPage;
    fallbackHost: string;
    forceNoIndex?: boolean;
}): ResolvedPublishedPageSeo {
    const { manifest, pageEntry, fallbackHost, forceNoIndex } = input;
    const pageSeo = pageEntry.page.seo || {};
    const defaults = manifest.seoDefaults || {};
    const siteName = firstNonEmpty(manifest.siteName, defaults.metaTitle);

    const fallbackPath = pageSlugToPath(pageEntry.page.slug);
    const canonicalPath = resolveCanonicalPath(
        firstNonEmpty(pageSeo.canonicalPath, defaults.canonicalPath),
        fallbackPath,
    );

    const canonicalHost = resolveCanonicalHost(manifest, fallbackHost);
    const canonicalOrigin = getOriginForHost(canonicalHost);
    const canonicalUrl = canonicalOrigin ? `${canonicalOrigin}${canonicalPath}` : canonicalPath;

    const fallbackTitle = pageEntry.page.slug === '/'
        ? (siteName || pageEntry.page.title)
        : siteName
            ? `${pageEntry.page.title} | ${siteName}`
            : pageEntry.page.title;

    const title = firstNonEmpty(pageSeo.metaTitle, defaults.metaTitle, fallbackTitle) || pageEntry.page.title;
    const description = firstNonEmpty(pageSeo.metaDescription, defaults.metaDescription);
    const metaKeywords = firstNonEmpty(pageSeo.metaKeywords, defaults.metaKeywords);
    const ogTitle = firstNonEmpty(pageSeo.ogTitle, defaults.ogTitle, title) || title;
    const ogDescription = firstNonEmpty(pageSeo.ogDescription, defaults.ogDescription, description);
    const ogImageUrl = toAbsoluteUrl(firstNonEmpty(pageSeo.ogImageUrl, defaults.ogImageUrl), canonicalOrigin);
    const ogImageAlt = firstNonEmpty(pageSeo.ogImageAlt, defaults.ogImageAlt);
    const twitterCard = (pageSeo.twitterCard || defaults.twitterCard || 'summary_large_image') as TwitterCardType;
    const twitterTitle = firstNonEmpty(pageSeo.twitterTitle, defaults.twitterTitle, ogTitle) || ogTitle;
    const twitterDescription = firstNonEmpty(pageSeo.twitterDescription, defaults.twitterDescription, ogDescription);
    const twitterImageUrl = toAbsoluteUrl(firstNonEmpty(pageSeo.twitterImageUrl, defaults.twitterImageUrl), canonicalOrigin)
        || ogImageUrl;
    const twitterImageAlt = firstNonEmpty(pageSeo.twitterImageAlt, defaults.twitterImageAlt, ogImageAlt);

    const defaultIndex = defaults.robotsIndex !== false;
    const defaultFollow = defaults.robotsFollow !== false;
    const robotsIndex = forceNoIndex ? false : (pageSeo.robotsIndex !== null && pageSeo.robotsIndex !== undefined ? Boolean(pageSeo.robotsIndex) : defaultIndex);
    const robotsFollow = forceNoIndex ? false : (pageSeo.robotsFollow !== null && pageSeo.robotsFollow !== undefined ? Boolean(pageSeo.robotsFollow) : defaultFollow);

    return {
        title,
        description,
        metaKeywords,
        canonicalPath,
        canonicalUrl,
        robotsIndex,
        robotsFollow,
        ogTitle,
        ogDescription,
        ogImageUrl,
        ogImageAlt,
        twitterCard,
        twitterTitle,
        twitterDescription,
        twitterImageUrl,
        twitterImageAlt,
        siteName,
    };
}

function pickBusinessName(manifest: PublishedManifest): string | null {
    return firstNonEmpty(manifest.seoBusiness?.name, manifest.siteName);
}

function buildLocalBusinessStructuredData(manifest: PublishedManifest, origin: string): Record<string, unknown> | null {
    const business = manifest.seoBusiness || {};
    const businessName = pickBusinessName(manifest);
    if (!businessName) {
        return null;
    }

    const streetAddress = firstNonEmpty(business.streetAddress);
    const locality = firstNonEmpty(business.addressLocality);
    const country = firstNonEmpty(business.addressCountry);
    if (!streetAddress || !locality || !country) {
        return null;
    }

    const businessType = firstNonEmpty(business.businessType, 'LocalBusiness') || 'LocalBusiness';
    return {
        '@context': 'https://schema.org',
        '@type': businessType,
        name: businessName,
        url: origin || undefined,
        description: firstNonEmpty(business.description) || undefined,
        image: toAbsoluteUrl(firstNonEmpty(business.imageUrl), origin) || undefined,
        telephone: firstNonEmpty(business.telephone) || undefined,
        email: firstNonEmpty(business.email) || undefined,
        priceRange: firstNonEmpty(business.priceRange) || undefined,
        sameAs: Array.isArray(business.sameAs) && business.sameAs.length > 0 ? business.sameAs : undefined,
        address: {
            '@type': 'PostalAddress',
            streetAddress,
            addressLocality: locality,
            addressRegion: firstNonEmpty(business.addressRegion) || undefined,
            postalCode: firstNonEmpty(business.postalCode) || undefined,
            addressCountry: country,
        },
    };
}

function buildOrganizationStructuredData(manifest: PublishedManifest, origin: string): Record<string, unknown> | null {
    const business = manifest.seoBusiness || {};
    const businessName = pickBusinessName(manifest);
    if (!businessName) {
        return null;
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: businessName,
        url: origin || undefined,
        logo: toAbsoluteUrl(firstNonEmpty(business.imageUrl), origin) || undefined,
        sameAs: Array.isArray(business.sameAs) && business.sameAs.length > 0 ? business.sameAs : undefined,
        description: firstNonEmpty(business.description) || undefined,
    };
}

function buildBreadcrumbStructuredData(input: {
    seo: ResolvedPublishedPageSeo;
    pageEntry: PublishedManifestPage;
}): Record<string, unknown> | null {
    if (normalizePageSlug(input.pageEntry.page.slug) === '/') {
        return null;
    }

    const canonicalOrigin = (() => {
        try {
            return new URL(input.seo.canonicalUrl).origin;
        } catch {
            return '';
        }
    })();
    if (!canonicalOrigin) {
        return null;
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: input.seo.siteName || 'Home',
                item: `${canonicalOrigin}/`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: input.pageEntry.page.title,
                item: input.seo.canonicalUrl,
            },
        ],
    };
}

export function buildStructuredDataForPublishedPage(input: {
    manifest: PublishedManifest;
    pageEntry: PublishedManifestPage;
    seo: ResolvedPublishedPageSeo;
}): Array<Record<string, unknown>> {
    const origin = (() => {
        try {
            return new URL(input.seo.canonicalUrl).origin;
        } catch {
            return '';
        }
    })();

    const localBusiness = buildLocalBusinessStructuredData(input.manifest, origin);
    const organization = buildOrganizationStructuredData(input.manifest, origin);
    const breadcrumb = buildBreadcrumbStructuredData({
        seo: input.seo,
        pageEntry: input.pageEntry,
    });

    const records: Array<Record<string, unknown>> = [];
    if (localBusiness) {
        records.push(localBusiness);
    } else if (organization) {
        records.push(organization);
    }
    if (breadcrumb) {
        records.push(breadcrumb);
    }
    return records;
}
