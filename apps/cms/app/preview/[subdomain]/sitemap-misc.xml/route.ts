import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalHost, resolvePublishedManifest, resolveRoutedRequestHost } from '../../../../lib/published-site';
import {
    buildDailySeoCacheControl,
    fetchPublishedBlogs,
    hasBlogDetailTemplatePage,
    hasSelectedBlogTemplatePage,
    resolveLatestIsoTimestamp,
    resolveUtcDayStartIso,
    xmlEscape,
} from '../seo-artifacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildOriginFromHost(host: string): string {
    if (!host) {
        return '';
    }
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    return `${isLocal ? 'http' : 'https'}://${host}`;
}

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

    const canonicalHost = resolveCanonicalHost(manifest, host || '');
    const origin = buildOriginFromHost(canonicalHost || host);
    if (!origin) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    const posts = await fetchPublishedBlogs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const hasBlogSurface = hasSelectedBlogTemplatePage(manifest) || hasBlogDetailTemplatePage(manifest);
    if (!hasBlogSurface && posts.length === 0) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    const fallbackLastModIso = resolveUtcDayStartIso();
    const lastModIso = resolveLatestIsoTimestamp(
        posts.map((post) => post.updatedAt || post.publishedAt),
        fallbackLastModIso,
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
        + `<url>`
        + `<loc>${xmlEscape(`${origin}/blog-locations.kml`)}</loc>`
        + `<lastmod>${lastModIso}</lastmod>`
        + `<changefreq>monthly</changefreq>`
        + `<priority>0.3</priority>`
        + `</url>`
        + `</urlset>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': buildDailySeoCacheControl(),
            'x-seo-refresh-window': '00:00-utc',
        },
    });
}
