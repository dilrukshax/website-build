import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalHost, resolvePublishedManifest, resolveRoutedRequestHost } from '../../../../lib/published-site';
import {
    buildDailySeoCacheControl,
    fetchPublishedBlogs,
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

function resolveAbsoluteUrl(urlValue: string | null, origin: string): string | null {
    if (!urlValue) {
        return null;
    }

    const trimmed = urlValue.trim();
    if (!trimmed) {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith('/')) {
        return `${origin}${trimmed}`;
    }

    return null;
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

    const fallbackLastModIso = resolveUtcDayStartIso();
    const posts = await fetchPublishedBlogs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const uniquePosts = Array.from(new Map(
        posts.map((post) => [post.slug, post] as const),
    ).values());

    if (uniquePosts.length === 0) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    const urls = uniquePosts.map((post) => {
        const postUrl = `${origin}/blog/${post.slug}`;
        const lastModIso = post.updatedAt || post.publishedAt || fallbackLastModIso;
        const imageUrl = resolveAbsoluteUrl(post.featuredImageUrl, origin);
        const imageTitle = post.title || post.slug;
        const imageCaption = post.excerpt || post.title || post.slug;

        const imageXml = imageUrl
            ? `<image:image>`
                + `<image:loc>${xmlEscape(imageUrl)}</image:loc>`
                + `<image:title>${xmlEscape(imageTitle)}</image:title>`
                + `<image:caption>${xmlEscape(imageCaption)}</image:caption>`
                + `</image:image>`
            : '';

        return `<url>`
            + `<loc>${xmlEscape(postUrl)}</loc>`
            + `<lastmod>${lastModIso}</lastmod>`
            + `<changefreq>weekly</changefreq>`
            + `<priority>0.8</priority>`
            + imageXml
            + `</url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `
        + `xmlns:image="http://www.google.com/schemas/sitemap-image/0.9">`
        + urls.join('')
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
