import type { Metadata } from 'next';
import { cache as reactCache } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { renderCustomBodyHtml } from '../../../../lib/custom-html';
import { applyCustomHeadMetadata } from '../../../../lib/custom-head-metadata';
import { resolvePublishedRouteRequest } from '../../../../lib/published-request';
import type { RouteSearchParams } from '../../../../lib/published-request';
import { SectionRenderer } from '../../../../components/builder/section-renderer';
import {
    findManifestPageByRequestedSlug,
    isCmsHost,
    resolveCanonicalHost,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
} from '../../../../lib/published-site';
import { resolveHostedFontRequest } from '../../../../lib/hosted-font-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TOKENS = {
    primary: '#ef4444',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    background: '#ffffff',
    font: 'Inter',
} as const;

interface BlogPreviewParams {
    subdomain: string;
}

interface BlogPreviewProps {
    params: BlogPreviewParams;
    searchParams?: RouteSearchParams;
}

interface BlogCardData {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: string | null;
}

interface BlogListResponse {
    success?: boolean;
    data?: Array<{
        id?: unknown;
        title?: unknown;
        slug?: unknown;
        excerpt?: unknown;
        publishedAt?: unknown;
    }> | null;
}

function isLocalDevelopmentHost(host: string): boolean {
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
}

function buildOriginFromHost(host: string): string {
    if (!host) {
        return '';
    }

    return `${isLocalDevelopmentHost(host) ? 'http' : 'https'}://${host}`;
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

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

async function fetchPublishedBlogs(input: {
    tenantId: string;
    instanceId: string;
    baseUrl?: string;
}): Promise<BlogCardData[]> {
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
        const records = Array.isArray(payload?.data) ? payload.data : [];
        return records
            .map((record) => ({
                id: typeof record.id === 'string' ? record.id : '',
                title: typeof record.title === 'string' ? record.title.trim() : '',
                slug: typeof record.slug === 'string' ? record.slug.trim() : '',
                excerpt: typeof record.excerpt === 'string' && record.excerpt.trim().length > 0 ? record.excerpt.trim() : null,
                publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : null,
            }))
            .filter((record) => record.id && record.title && record.slug);
    } catch {
        return [];
    }
}

const cacheIfAvailable: <T extends (...args: any[]) => any>(fn: T) => T = typeof reactCache === 'function'
    ? (reactCache as <T extends (...args: any[]) => any>(fn: T) => T)
    : ((fn) => fn);

const getPublishedBlogIndexData = cacheIfAvailable(async (subdomain: string, host: string) => {
    const { manifest } = await resolvePublishedManifest({
        subdomain,
        hostname: host,
        bypassCache: true,
    });

    if (!manifest) {
        return {
            manifest: null,
            blogPageEntry: null,
            posts: [],
            canonicalHost: '',
            origin: '',
        };
    }

    const blogPageEntry = findManifestPageByRequestedSlug(manifest, 'blog');
    const canonicalHost = resolveCanonicalHost(manifest, host);
    const origin = buildOriginFromHost(canonicalHost || host);
    const posts = await fetchPublishedBlogs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });

    return {
        manifest,
        blogPageEntry,
        posts,
        canonicalHost,
        origin,
    };
});

export async function generateMetadata({ params, searchParams }: BlogPreviewProps): Promise<Metadata> {
    const requestHeaders = headers();
    const { routeHost } = resolvePublishedRouteRequest({ headers: requestHeaders, searchParams });
    const forceNoIndex = isCmsHost(routeHost);
    const { manifest, blogPageEntry, origin } = await getPublishedBlogIndexData(params.subdomain, routeHost);

    if (!manifest) {
        return {
            title: 'Blog Not Found',
            robots: { index: false, follow: false },
        };
    }

    if (blogPageEntry) {
        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: blogPageEntry,
            fallbackHost: routeHost,
            forceNoIndex,
        });

        return applyCustomHeadMetadata({
            title: seo.title,
            description: seo.description || undefined,
            alternates: {
                canonical: seo.canonicalUrl,
            },
            robots: {
                index: seo.robotsIndex,
                follow: seo.robotsFollow,
                googleBot: {
                    index: seo.robotsIndex,
                    follow: seo.robotsFollow,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
            openGraph: {
                title: seo.ogTitle,
                description: seo.ogDescription || undefined,
                url: seo.canonicalUrl,
                type: 'website',
                images: seo.ogImageUrl
                    ? [{ url: seo.ogImageUrl, alt: seo.ogImageAlt || undefined }]
                    : undefined,
            },
            twitter: {
                card: seo.twitterCard,
                title: seo.twitterTitle,
                description: seo.twitterDescription || undefined,
                images: seo.twitterImageUrl
                    ? [{ url: seo.twitterImageUrl, alt: seo.twitterImageAlt || undefined }]
                    : undefined,
            },
        }, manifest.customCode?.head);
    }

    const siteName = firstNonEmpty(manifest.siteName, manifest.subdomain);
    const canonicalUrl = origin ? `${origin}/blog` : '/blog';
    const title = siteName ? `Blog | ${siteName}` : 'Blog';
    const description = firstNonEmpty(
        manifest.seoDefaults?.metaDescription || null,
        siteName ? `Latest articles from ${siteName}.` : 'Latest published articles.',
    ) || undefined;
    const robotsIndex = forceNoIndex ? false : manifest.seoDefaults?.robotsIndex !== false;
    const robotsFollow = forceNoIndex ? false : manifest.seoDefaults?.robotsFollow !== false;

    return applyCustomHeadMetadata({
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: robotsIndex,
            follow: robotsFollow,
            googleBot: {
                index: robotsIndex,
                follow: robotsFollow,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    }, manifest.customCode?.head);
}

export default async function PreviewBlogIndexPage({ params, searchParams }: BlogPreviewProps) {
    const requestHeaders = headers();
    const { routeHost, shouldRenderPageBodySlots } = resolvePublishedRouteRequest({
        headers: requestHeaders,
        searchParams,
    });
    const { manifest, blogPageEntry, posts } = await getPublishedBlogIndexData(params.subdomain, routeHost);

    if (!manifest) {
        notFound();
    }

    const tokens = {
        ...DEFAULT_TOKENS,
        ...((manifest.tokens || {}) as Partial<typeof DEFAULT_TOKENS>),
    };
    const hostedFont = resolveHostedFontRequest(tokens.font);
    const siteName = firstNonEmpty(manifest.siteName, manifest.subdomain, 'Blog');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: tokens.background, color: tokens.text, fontFamily: `${tokens.font}, sans-serif` }}>
            {hostedFont && (
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="stylesheet" href={hostedFont.href} />
                </>
            )}

            {shouldRenderPageBodySlots ? renderCustomBodyHtml(manifest.customCode?.bodyTop, 'body-top') : null}

            {blogPageEntry ? (
                blogPageEntry.sections
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((section) => (
                        <SectionRenderer
                            key={section.id}
                            componentKey={section.type}
                            content={section.props}
                            styles={section.styles}
                            tokens={tokens}
                            conditions={section.conditions}
                            features={manifest.features}
                            context={{
                                tenantId: manifest.tenantId,
                                instanceId: manifest.instanceId,
                                pageSlug: blogPageEntry.page.slug,
                                subdomain: params.subdomain,
                            }}
                        />
                    ))
            ) : (
                <main style={{ maxWidth: '920px', margin: '0 auto', padding: '48px 20px 72px' }}>
                    <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.12 }}>
                        {siteName} Blog
                    </h1>
                    <p style={{ margin: '0 0 34px', color: '#64748b', fontSize: '16px' }}>
                        Latest published stories and updates.
                    </p>

                    {posts.length === 0 ? (
                        <div
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '22px',
                                background: '#ffffff',
                                color: '#475569',
                            }}
                        >
                            No published blog posts yet.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {posts.map((post) => (
                                <article
                                    key={post.id}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '14px',
                                        padding: '20px',
                                        background: '#ffffff',
                                    }}
                                >
                                    <h2 style={{ margin: '0 0 8px', fontSize: '24px', lineHeight: 1.25 }}>
                                        <Link href={`/blog/${post.slug}`} style={{ color: tokens.text, textDecoration: 'none' }}>
                                            {post.title}
                                        </Link>
                                    </h2>
                                    {post.publishedAt ? (
                                        <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '13px' }}>
                                            {new Date(post.publishedAt).toLocaleDateString()}
                                        </p>
                                    ) : null}
                                    {post.excerpt ? (
                                        <p style={{ margin: 0, color: '#475569', lineHeight: 1.65 }}>
                                            {post.excerpt}
                                        </p>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </main>
            )}

            {shouldRenderPageBodySlots ? renderCustomBodyHtml(manifest.customCode?.bodyBottom, 'body-bottom') : null}
        </div>
    );
}
