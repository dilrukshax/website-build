import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache as reactCache } from 'react';
import { renderCustomBodyHtml } from '../../../../lib/custom-html';
import { applyCustomHeadMetadata } from '../../../../lib/custom-head-metadata';
import { resolvePublishedRouteRequest } from '../../../../lib/published-request';
import type { RouteSearchParams } from '../../../../lib/published-request';
import { SectionRenderer } from '../../../../components/builder/section-renderer';
import {
    buildStructuredDataForPublishedPage,
    findManifestPageByRequestedSlug,
    isCmsHost,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
    resolveRequestedSlug,
} from '../../../../lib/published-site';
import { resolveHostedFontRequest } from '../../../../lib/hosted-font-utils';

const DEFAULT_PUBLISHER_TAGLINE = 'Built Your Website with My Online Web';
const PUBLISHER_TAGLINE = (process.env.NEXT_PUBLIC_PUBLISHER_TAGLINE || DEFAULT_PUBLISHER_TAGLINE).trim();
const PUBLISHER_LINK = (process.env.NEXT_PUBLIC_PUBLISHER_URL || `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'buildmyonlineweb.site'}`).trim();

const DEFAULT_TOKENS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    background: '#ffffff',
    font: 'Inter',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PreviewPageParams {
    subdomain: string;
    slug?: string[];
}

interface PreviewPageProps {
    params: PreviewPageParams;
    searchParams?: RouteSearchParams;
}

const cacheIfAvailable: <T extends (...args: any[]) => any>(fn: T) => T = typeof reactCache === 'function'
    ? (reactCache as <T extends (...args: any[]) => any>(fn: T) => T)
    : ((fn) => fn);

const getPublishedPageData = cacheIfAvailable(async (subdomain: string, requestedSlug: string, host: string) => {
    const { manifest } = await resolvePublishedManifest({
        subdomain,
        hostname: host,
    });

    if (!manifest) {
        return { manifest: null, pageEntry: null };
    }

    const pageEntry = findManifestPageByRequestedSlug(manifest, requestedSlug);
    return {
        manifest,
        pageEntry,
    };
});

export async function generateMetadata({ params, searchParams }: PreviewPageProps): Promise<Metadata> {
    const requestHeaders = headers();
    const { routeHost } = resolvePublishedRouteRequest({ headers: requestHeaders, searchParams });
    const requestedSlug = resolveRequestedSlug(params.slug);
    const forceNoIndex = isCmsHost(routeHost);
    const { manifest, pageEntry } = await getPublishedPageData(params.subdomain, requestedSlug, routeHost);

    if (!manifest || !pageEntry) {
        return {
            title: 'Page Not Found',
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const seo = resolvePublishedPageSeo({
        manifest,
        pageEntry,
        fallbackHost: routeHost,
        forceNoIndex,
    });

    return applyCustomHeadMetadata({
        title: seo.title,
        description: seo.description || undefined,
        keywords: seo.metaKeywords ? seo.metaKeywords.split(',').map((entry) => entry.trim()).filter(Boolean) : undefined,
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
            siteName: seo.siteName || undefined,
            locale: 'en_US',
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

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
    const requestHeaders = headers();
    const { routeHost, shouldRenderPageBodySlots } = resolvePublishedRouteRequest({
        headers: requestHeaders,
        searchParams,
    });
    const requestedSlug = resolveRequestedSlug(params.slug);
    const forceNoIndex = isCmsHost(routeHost);
    const { manifest, pageEntry } = await getPublishedPageData(params.subdomain, requestedSlug, routeHost);

    if (!manifest || !pageEntry) {
        notFound();
    }

    const seo = resolvePublishedPageSeo({
        manifest,
        pageEntry,
        fallbackHost: routeHost,
        forceNoIndex,
    });
    const structuredDataEntries = buildStructuredDataForPublishedPage({
        manifest,
        pageEntry,
        seo,
    });
    const tokens = {
        ...DEFAULT_TOKENS,
        ...(manifest.tokens || {}),
    };
    const hostedFont = resolveHostedFontRequest(tokens.font);

    return (
        <div style={{ fontFamily: `${tokens.font}, sans-serif`, backgroundColor: tokens.background, minHeight: '100vh' }}>
            {hostedFont && (
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="stylesheet" href={hostedFont.href} />
                </>
            )}

            {shouldRenderPageBodySlots ? renderCustomBodyHtml(manifest.customCode?.bodyTop, 'body-top') : null}

            {structuredDataEntries.map((entry, index) => (
                <script
                    key={`structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
                />
            ))}

            {PUBLISHER_TAGLINE && PUBLISHER_LINK && (
                <a
                    href={PUBLISHER_LINK}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        right: 0,
                        zIndex: 120,
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        lineHeight: 1,
                        color: 'rgb(17, 24, 39)',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(15, 23, 42, 0.12)',
                        padding: '10px 15px',
                        borderTopLeftRadius: '20px',
                        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.12)',
                        backdropFilter: 'blur(6px)',
                    }}
                    title={PUBLISHER_TAGLINE}
                    aria-label={PUBLISHER_TAGLINE}
                >
                    {PUBLISHER_TAGLINE}
                </a>
            )}

            {pageEntry.sections
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
                            pageSlug: pageEntry.page.slug,
                            subdomain: params.subdomain,
                        }}
                    />
                ))}

            {shouldRenderPageBodySlots ? renderCustomBodyHtml(manifest.customCode?.bodyBottom, 'body-bottom') : null}
        </div>
    );
}
