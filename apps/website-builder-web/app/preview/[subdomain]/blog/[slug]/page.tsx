import type { Metadata } from 'next';
import { cache as reactCache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderCustomBodyHtml } from '../../../../../lib/custom-html';
import { applyCustomHeadMetadata } from '../../../../../lib/custom-head-metadata';
import { resolvePublishedRouteRequest } from '../../../../../lib/published-request';
import type { RouteSearchParams } from '../../../../../lib/published-request';
import { SectionRenderer } from '../../../../../components/builder/section-renderer';
import {
    findManifestPageByRequestedSlug,
    isCmsHost,
    resolveCanonicalHost,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
} from '../../../../../lib/published-site';
import { resolveHostedFontRequest } from '../../../../../lib/hosted-font-utils';

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
    slug: string;
}

interface BlogPreviewProps {
    params: BlogPreviewParams;
    searchParams?: RouteSearchParams;
}

interface BlogPostResponseData {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    contentHtml: string;
    featuredImageUrl: string | null;
    seoJsonb?: Record<string, unknown> | null;
    publishedAt: string | null;
}

interface BlogLookupResponse {
    success?: boolean;
    data?: BlogPostResponseData | null;
}

function normalizePageSlug(slug: string | null | undefined): string {
    const value = (slug || '').trim();
    if (!value || value === '/') {
        return '/';
    }

    return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function normalizeComponentKey(componentKey: string): string {
    return componentKey.trim().toLowerCase().replace(/\s*\/\s*/g, '/');
}

function isBlogPostDetailComponentKey(componentKey: string): boolean {
    return /^blog-post-detail\/v\d+$/.test(normalizeComponentKey(componentKey));
}

function resolveBlogDetailLayoutPageEntry(manifest: NonNullable<Awaited<ReturnType<typeof resolvePublishedManifest>>['manifest']>) {
    const detailLayoutPages = manifest.pages.filter((pageEntry) => {
        const sections = Array.isArray(pageEntry.sections) ? pageEntry.sections : [];
        return sections.some((section) => isBlogPostDetailComponentKey(section.type || ''));
    });

    if (detailLayoutPages.length === 0) {
        return null;
    }

    const blogSlugLayout = detailLayoutPages.find((pageEntry) => normalizePageSlug(pageEntry.page.slug) === '/blog');
    if (blogSlugLayout) {
        return blogSlugLayout;
    }

    const nonLegacyLayout = detailLayoutPages.find((pageEntry) => normalizePageSlug(pageEntry.page.slug) !== '/blog-layout');
    return nonLegacyLayout || detailLayoutPages[0] || null;
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

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

function readSeoField(seo: Record<string, unknown> | null | undefined, key: string): string | null {
    if (!seo) {
        return null;
    }

    const value = seo[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readSeoBoolean(seo: Record<string, unknown> | null | undefined, key: string): boolean | null {
    if (!seo) {
        return null;
    }

    const value = seo[key];
    return typeof value === 'boolean' ? value : null;
}

function resolveCanonicalPath(rawPath: string | null, fallbackSlug: string): string {
    if (rawPath && rawPath.startsWith('/')) {
        return rawPath;
    }
    return `/blog/${fallbackSlug}`;
}

function toAbsoluteUrl(value: string | null, origin: string): string | null {
    if (!value) {
        return null;
    }

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    if (value.startsWith('/') && origin) {
        return `${origin}${value}`;
    }

    return null;
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

async function fetchPublishedBlogPost(input: {
    slug: string;
    tenantId: string;
    instanceId: string;
}): Promise<BlogPostResponseData | null> {
    const apiBaseUrl = resolveApiBaseUrl();
    if (!apiBaseUrl) {
        return null;
    }

    try {
        const url = new URL(`/web/blogs/${encodeURIComponent(input.slug)}`, `${apiBaseUrl}/`);
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
        if (!payload?.success || !payload.data) {
            return null;
        }

        return payload.data;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params, searchParams }: BlogPreviewProps): Promise<Metadata> {
    const requestHeaders = headers();
    const { routeHost } = resolvePublishedRouteRequest({ headers: requestHeaders, searchParams });
    const forceNoIndex = isCmsHost(routeHost);
    const { manifest } = await resolvePublishedManifest({
        subdomain: params.subdomain,
        hostname: routeHost,
        bypassCache: true,
    });

    if (!manifest) {
        return {
            title: 'Blog Not Found',
            robots: { index: false, follow: false },
        };
    }

    const post = await fetchPublishedBlogPost({
        slug: params.slug,
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
    });
    if (!post) {
        return {
            title: 'Blog Not Found',
            robots: { index: false, follow: false },
        };
    }

    const defaultPageEntry = findManifestPageByRequestedSlug(manifest, '/') || manifest.pages[0] || null;
    const defaultSeo = defaultPageEntry
        ? resolvePublishedPageSeo({
            manifest,
            pageEntry: defaultPageEntry,
            fallbackHost: routeHost,
            forceNoIndex,
        })
        : null;

    const postSeo = (post.seoJsonb && typeof post.seoJsonb === 'object')
        ? post.seoJsonb as Record<string, unknown>
        : null;

    const canonicalHost = resolveCanonicalHost(manifest, routeHost);
    const canonicalOrigin = canonicalHost ? `${routeHost === 'localhost' ? 'http' : 'https'}://${canonicalHost}` : '';
    const canonicalPath = resolveCanonicalPath(readSeoField(postSeo, 'canonicalPath'), post.slug);
    const canonicalUrl = canonicalOrigin ? `${canonicalOrigin}${canonicalPath}` : canonicalPath;

    const title = firstNonEmpty(
        readSeoField(postSeo, 'metaTitle'),
        readSeoField(postSeo, 'ogTitle'),
        post.title,
    ) || post.title;

    const description = firstNonEmpty(
        readSeoField(postSeo, 'metaDescription'),
        readSeoField(postSeo, 'ogDescription'),
        post.excerpt,
        defaultSeo?.description,
    );

    const robotsIndex = forceNoIndex
        ? false
        : (readSeoBoolean(postSeo, 'robotsIndex') ?? defaultSeo?.robotsIndex ?? true);
    const robotsFollow = forceNoIndex
        ? false
        : (readSeoBoolean(postSeo, 'robotsFollow') ?? defaultSeo?.robotsFollow ?? true);

    const ogTitle = firstNonEmpty(readSeoField(postSeo, 'ogTitle'), title) || title;
    const ogDescription = firstNonEmpty(readSeoField(postSeo, 'ogDescription'), description);
    const ogImageUrl = toAbsoluteUrl(
        firstNonEmpty(readSeoField(postSeo, 'ogImageUrl'), post.featuredImageUrl),
        canonicalOrigin,
    );
    const ogImageAlt = firstNonEmpty(readSeoField(postSeo, 'ogImageAlt'), post.title);

    const twitterTitle = firstNonEmpty(readSeoField(postSeo, 'twitterTitle'), ogTitle) || ogTitle;
    const twitterDescription = firstNonEmpty(readSeoField(postSeo, 'twitterDescription'), ogDescription);
    const twitterImageUrl = toAbsoluteUrl(
        firstNonEmpty(readSeoField(postSeo, 'twitterImageUrl'), ogImageUrl),
        canonicalOrigin,
    );
    const twitterImageAlt = firstNonEmpty(readSeoField(postSeo, 'twitterImageAlt'), ogImageAlt);
    const twitterCard = firstNonEmpty(readSeoField(postSeo, 'twitterCard'), defaultSeo?.twitterCard, 'summary_large_image') || 'summary_large_image';

    return applyCustomHeadMetadata({
        title,
        description: description || undefined,
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
            title: ogTitle,
            description: ogDescription || undefined,
            url: canonicalUrl,
            type: 'article',
            images: ogImageUrl
                ? [{ url: ogImageUrl, alt: ogImageAlt || undefined }]
                : undefined,
        },
        twitter: {
            card: twitterCard as 'summary' | 'summary_large_image',
            title: twitterTitle,
            description: twitterDescription || undefined,
            images: twitterImageUrl
                ? [{ url: twitterImageUrl, alt: twitterImageAlt || undefined }]
                : undefined,
        },
    }, manifest.customCode?.head);
}

export default async function PreviewBlogDetailPage({ params, searchParams }: BlogPreviewProps) {
    const requestHeaders = headers();
    const { routeHost, shouldRenderPageBodySlots } = resolvePublishedRouteRequest({
        headers: requestHeaders,
        searchParams,
    });
    const { manifest } = await resolvePublishedManifest({
        subdomain: params.subdomain,
        hostname: routeHost,
        bypassCache: true,
    });

    if (!manifest) {
        notFound();
    }

    const post = await fetchPublishedBlogPost({
        slug: params.slug,
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
    });

    if (!post) {
        notFound();
    }

    const tokens = {
        ...DEFAULT_TOKENS,
        ...((manifest.tokens || {}) as Partial<typeof DEFAULT_TOKENS>),
    };
    const hostedFont = resolveHostedFontRequest(tokens.font);

    const layoutPageEntry = resolveBlogDetailLayoutPageEntry(manifest);

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

            {layoutPageEntry ? (
                layoutPageEntry.sections
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
                                pageSlug: layoutPageEntry.page.slug,
                                subdomain: params.subdomain,
                                blogPost: post,
                            }}
                        />
                    ))
            ) : (
                <>
                    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 20px 72px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                        </p>
                        <h1 style={{ margin: '8px 0 18px', fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.12 }}>
                            {post.title}
                        </h1>
                        {post.excerpt && (
                            <p style={{ margin: '0 0 28px', color: '#475569', fontSize: '18px', lineHeight: 1.6 }}>
                                {post.excerpt}
                            </p>
                        )}
                        <article
                            className="blog-content"
                            style={{ fontSize: '17px', lineHeight: 1.8, color: tokens.text }}
                            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                        />
                    </main>

                    <style>{`
                .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
                    line-height: 1.25;
                    margin: 1.8em 0 0.55em;
                    color: ${tokens.text};
                }
                .blog-content p {
                    margin: 0 0 1em;
                }
                .blog-content ul, .blog-content ol {
                    margin: 0 0 1em;
                    padding-left: 1.4em;
                }
                .blog-content blockquote {
                    margin: 1.2em 0;
                    padding: 0.2em 0 0.2em 1em;
                    border-left: 4px solid ${tokens.primary};
                    color: #475569;
                }

                .blog-content mark {
                    border-radius: 0.22rem;
                    padding: 0.03em 0.12em;
                }

                .blog-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 12px;
                    margin: 1.3em 0;
                    border: 1px solid #d1d5db;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.14);
                }

                .blog-content img[data-size='content'] {
                    width: min(72%, 680px);
                }

                .blog-content img[data-size='wide'] {
                    width: min(92%, 980px);
                }

                .blog-content img[data-size='full'] {
                    width: 100%;
                }

                .blog-content img[data-layout='left'] {
                    margin-left: 0;
                    margin-right: auto;
                }

                .blog-content img[data-layout='center'] {
                    margin-left: auto;
                    margin-right: auto;
                }

                .blog-content img[data-layout='right'] {
                    margin-left: auto;
                    margin-right: 0;
                }

                .blog-content a {
                    color: ${tokens.primary};
                    text-decoration: underline;
                }

                @media (max-width: 768px) {
                    .blog-content img[data-size='content'],
                    .blog-content img[data-size='wide'],
                    .blog-content img[data-size='full'] {
                        width: 100%;
                    }
                }
            `}</style>
                </>
            )}

            {shouldRenderPageBodySlots ? renderCustomBodyHtml(manifest.customCode?.bodyBottom, 'body-bottom') : null}
        </div>
    );
}
