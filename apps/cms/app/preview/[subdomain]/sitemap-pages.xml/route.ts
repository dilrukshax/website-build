import { NextRequest, NextResponse } from 'next/server';
import {
    findManifestPageByRequestedSlug,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
    resolveRequestedSlug,
    resolveRoutedRequestHost,
} from '../../../../lib/published-site';
import { isSeoExcludedManifestPage, resolveUtcDayStartIso, xmlEscape } from '../seo-artifacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: { subdomain: string } },
): Promise<NextResponse> {
    const host = resolveRoutedRequestHost(request.headers);
    const { manifest } = await resolvePublishedManifest({
        subdomain: context.params.subdomain,
        hostname: host,
        bypassCache: true,
    });

    if (!manifest) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    const lastModIso = resolveUtcDayStartIso();
    const urls: string[] = [];
    const seenCanonicalUrls = new Set<string>();

    for (const pageEntry of manifest.pages) {
        if (isSeoExcludedManifestPage(pageEntry)) {
            continue;
        }

        const requestedSlug = resolveRequestedSlug(
            pageEntry.page.slug === '/' ? [] : pageEntry.page.slug.split('/'),
        );
        const resolvedPage = findManifestPageByRequestedSlug(manifest, requestedSlug);
        if (!resolvedPage) {
            continue;
        }

        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: resolvedPage,
            fallbackHost: host,
        });

        if (!seo.robotsIndex || !seo.canonicalUrl || seenCanonicalUrls.has(seo.canonicalUrl)) {
            continue;
        }

        seenCanonicalUrls.add(seo.canonicalUrl);
        urls.push(
            `<url>`
                + `<loc>${xmlEscape(seo.canonicalUrl)}</loc>`
                + `<lastmod>${lastModIso}</lastmod>`
                + `<changefreq>daily</changefreq>`
                + `<priority>1.0</priority>`
                + `</url>`
        );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `
        + `xmlns:image="http://www.google.com/schemas/sitemap-image/0.9">${urls.join('')}</urlset>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
