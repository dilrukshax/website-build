import type { PublishedManifest, PublishedManifestPage } from '../../../lib/published-site';

const BLOG_PAGE_SLUG_ALIASES = new Set(['/blog', 'blog']);
const BLOG_LAYOUT_PAGE_SLUG_ALIASES = new Set(['/blog-layout', 'blog-layout']);

interface BlogCardPayload {
    id?: string | null;
    slug?: string | null;
    title?: string | null;
    excerpt?: string | null;
    featuredImageUrl?: string | null;
    contentHtml?: string | null;
    seoJsonb?: Record<string, unknown> | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
}

interface BlogListResponse {
    success?: boolean;
    data?: BlogCardPayload[] | null;
}

interface BlogLookupResponse {
    success?: boolean;
    data?: BlogCardPayload | null;
}

export interface PublishedBlogSitemapItem {
    id: string | null;
    slug: string;
    title: string | null;
    excerpt: string | null;
    featuredImageUrl: string | null;
    contentHtml: string | null;
    seoJsonb: Record<string, unknown> | null;
    publishedAt: string | null;
    updatedAt: string | null;
}

function normalizeBaseUrl(input: string | undefined): string {
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
    return normalizeBaseUrl(
        process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_URL ||
            process.env.WEBSITE_BUILDER_API_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.API_BASE_URL ||
            ''
    );
}

function normalizePageSlug(slug: string): string {
    const trimmed = slug.trim();
    if (!trimmed || trimmed === '/') {
        return '/';
    }

    return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function normalizeComponentKey(componentKey: string): string {
    return componentKey.trim().toLowerCase().replace(/\s*\/\s*/g, '/');
}

function isBlogSectionComponentKey(componentKey: string): boolean {
    return /^blog\/v\d+$/.test(normalizeComponentKey(componentKey));
}

function isBlogPostDetailComponentKey(componentKey: string): boolean {
    return /^blog-post-detail\/v\d+$/.test(normalizeComponentKey(componentKey));
}

export function isSelectedBlogTemplatePage(pageEntry: PublishedManifestPage | null | undefined): boolean {
    if (!pageEntry?.page?.slug) {
        return false;
    }

    const normalizedSlug = normalizePageSlug(pageEntry.page.slug);
    if (!BLOG_PAGE_SLUG_ALIASES.has(normalizedSlug) && !BLOG_PAGE_SLUG_ALIASES.has(normalizedSlug.slice(1))) {
        return false;
    }

    const sections = Array.isArray(pageEntry.sections) ? pageEntry.sections : [];
    return sections.some((section) => isBlogSectionComponentKey(section.type || ''));
}

export function hasSelectedBlogTemplatePage(manifest: PublishedManifest | null | undefined): boolean {
    const pages = Array.isArray(manifest?.pages) ? manifest.pages : [];
    return pages.some((pageEntry) => isSelectedBlogTemplatePage(pageEntry));
}

export function hasBlogDetailTemplatePage(manifest: PublishedManifest | null | undefined): boolean {
    const pages = Array.isArray(manifest?.pages) ? manifest.pages : [];
    return pages.some((pageEntry) => {
        const sections = Array.isArray(pageEntry.sections) ? pageEntry.sections : [];
        return sections.some((section) => isBlogPostDetailComponentKey(section.type || ''));
    });
}

export function isSeoExcludedManifestPage(pageEntry: PublishedManifestPage | null | undefined): boolean {
    if (!pageEntry?.page?.slug) {
        return false;
    }

    const normalizedSlug = normalizePageSlug(pageEntry.page.slug);
    return BLOG_LAYOUT_PAGE_SLUG_ALIASES.has(normalizedSlug)
        || BLOG_LAYOUT_PAGE_SLUG_ALIASES.has(normalizedSlug.slice(1));
}

export function xmlEscape(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function resolveUtcDayStartIso(now: Date = new Date()): string {
    const midnightUtc = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
    ));

    return midnightUtc.toISOString();
}

export function secondsUntilNextUtcMidnight(now: Date = new Date()): number {
    const nextMidnightUtc = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
    ));

    const deltaMs = nextMidnightUtc.getTime() - now.getTime();
    return Math.max(1, Math.ceil(deltaMs / 1000));
}

export function buildDailySeoCacheControl(now: Date = new Date()): string {
    return `public, max-age=${secondsUntilNextUtcMidnight(now)}, stale-while-revalidate=300`;
}

function normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalIsoDate(value: unknown): string | null {
    const candidate = normalizeOptionalText(value);
    if (!candidate) {
        return null;
    }

    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
}

export function resolveLatestIsoTimestamp(
    values: Array<string | null | undefined>,
    fallbackIso: string,
): string {
    const latest = values.reduce<number>((maxValue, raw) => {
        if (!raw) {
            return maxValue;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return maxValue;
        }

        return Math.max(maxValue, parsed.getTime());
    }, 0);

    return latest > 0 ? new Date(latest).toISOString() : fallbackIso;
}

export async function fetchPublishedBlogs(input: {
    tenantId: string;
    instanceId: string;
    baseUrl?: string;
}): Promise<PublishedBlogSitemapItem[]> {
    const apiBaseUrl = normalizeBaseUrl(input.baseUrl) || resolveApiBaseUrl();
    if (!apiBaseUrl) {
        return [];
    }

    try {
        const url = new URL('/web/blogs', `${apiBaseUrl}/`);
        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'X-Tenant-ID': input.tenantId,
                'X-Instance-ID': input.instanceId,
            },
        });
        if (!response.ok) {
            return [];
        }

        const payload = await response.json() as BlogListResponse;
        const items = Array.isArray(payload?.data) ? payload.data : [];
        return items
            .map((item) => ({
                id: normalizeOptionalText(item?.id),
                slug: normalizeOptionalText(item?.slug) || '',
                title: normalizeOptionalText(item?.title),
                excerpt: normalizeOptionalText(item?.excerpt),
                featuredImageUrl: normalizeOptionalText(item?.featuredImageUrl),
                contentHtml: normalizeOptionalText(item?.contentHtml),
                seoJsonb: item?.seoJsonb && typeof item.seoJsonb === 'object'
                    ? item.seoJsonb as Record<string, unknown>
                    : null,
                publishedAt: normalizeOptionalIsoDate(item?.publishedAt),
                updatedAt: normalizeOptionalIsoDate(item?.updatedAt),
            }))
            .filter((item) => item.slug.length > 0);
    } catch {
        return [];
    }
}

export async function fetchPublishedBlogSlugs(input: {
    tenantId: string;
    instanceId: string;
    baseUrl?: string;
}): Promise<string[]> {
    const posts = await fetchPublishedBlogs(input);
    return posts.map((post) => post.slug);
}

export async function fetchPublishedBlogPostBySlug(input: {
    tenantId: string;
    instanceId: string;
    slug: string;
    baseUrl?: string;
}): Promise<PublishedBlogSitemapItem | null> {
    const normalizedSlug = input.slug.trim();
    if (!normalizedSlug) {
        return null;
    }

    const apiBaseUrl = normalizeBaseUrl(input.baseUrl) || resolveApiBaseUrl();
    if (!apiBaseUrl) {
        return null;
    }

    try {
        const url = new URL(`/web/blogs/${encodeURIComponent(normalizedSlug)}`, `${apiBaseUrl}/`);
        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'X-Tenant-ID': input.tenantId,
                'X-Instance-ID': input.instanceId,
            },
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as BlogLookupResponse;
        const item = payload?.data;
        if (!item) {
            return null;
        }

        const slug = normalizeOptionalText(item.slug);
        if (!slug) {
            return null;
        }

        return {
            id: normalizeOptionalText(item.id),
            slug,
            title: normalizeOptionalText(item.title),
            excerpt: normalizeOptionalText(item.excerpt),
            featuredImageUrl: normalizeOptionalText(item.featuredImageUrl),
            contentHtml: normalizeOptionalText(item.contentHtml),
            seoJsonb: item.seoJsonb && typeof item.seoJsonb === 'object'
                ? item.seoJsonb as Record<string, unknown>
                : null,
            publishedAt: normalizeOptionalIsoDate(item.publishedAt),
            updatedAt: normalizeOptionalIsoDate(item.updatedAt),
        };
    } catch {
        return null;
    }
}
