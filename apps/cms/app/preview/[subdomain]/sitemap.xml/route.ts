import { NextRequest, NextResponse } from 'next/server';
import {
    resolveCanonicalHost,
    resolvePublishedManifest,
    resolveRoutedRequestHost,
} from '../../../../lib/published-site';
import {
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

    const baseLastModIso = resolveUtcDayStartIso();
    const posts = await fetchPublishedBlogs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const hasBlogSurface = hasSelectedBlogTemplatePage(manifest) || hasBlogDetailTemplatePage(manifest);
    const hasBlogPosts = posts.length > 0;
    const blogLastModIso = resolveLatestIsoTimestamp(
        posts.map((post) => post.updatedAt || post.publishedAt),
        baseLastModIso,
    );
    const items: Array<{ loc: string; lastmod: string }> = [
        { loc: `${origin}/sitemap-pages.xml`, lastmod: baseLastModIso },
    ];

    if (hasBlogSurface || hasBlogPosts) {
        items.push({ loc: `${origin}/sitemap-blog.xml`, lastmod: blogLastModIso });
        items.push({ loc: `${origin}/sitemap-misc.xml`, lastmod: blogLastModIso });
    }

    if (hasBlogPosts) {
        items.push({ loc: `${origin}/sitemap-posts.xml`, lastmod: blogLastModIso });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
        + items
            .map((item) => `<sitemap><loc>${xmlEscape(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></sitemap>`)
            .join('')
        + `</sitemapindex>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
