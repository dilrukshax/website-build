import { NextRequest, NextResponse } from 'next/server';
import {
    findManifestPageByRequestedSlug,
    normalizeHost,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
    resolveRequestedSlug,
} from '../../../../lib/published-site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function xmlEscape(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET(
    request: NextRequest,
    context: { params: { subdomain: string } },
): Promise<NextResponse> {
    const host = normalizeHost(request.headers.get('host'));
    const { manifest } = await resolvePublishedManifest({
        subdomain: context.params.subdomain,
        hostname: host,
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

    const nowIso = new Date().toISOString();
    const urls: string[] = [];
    for (const pageEntry of manifest.pages) {
        const requestedSlug = resolveRequestedSlug(
            pageEntry.page.slug === '/' ? [] : pageEntry.page.slug.split('/'),
        );
        const resolvedPage = findManifestPageByRequestedSlug(manifest, requestedSlug);
        if (!resolvedPage) continue;

        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: resolvedPage,
            fallbackHost: host,
        });

        if (!seo.robotsIndex) continue;
        urls.push(
            `<url><loc>${xmlEscape(seo.canonicalUrl)}</loc><lastmod>${nowIso}</lastmod></url>`,
        );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
