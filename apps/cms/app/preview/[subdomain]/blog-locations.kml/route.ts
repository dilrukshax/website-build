import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalHost, resolvePublishedManifest, resolveRoutedRequestHost } from '../../../../lib/published-site';
import {
    buildDailySeoCacheControl,
    fetchPublishedBlogSlugs,
    hasBlogDetailTemplatePage,
    hasSelectedBlogTemplatePage,
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

function buildPlacemark(name: string, url: string, timestampIso: string): string {
    return `<Placemark>`
        + `<name>${xmlEscape(name)}</name>`
        + `<description>${xmlEscape(url)}</description>`
        + `<TimeStamp><when>${timestampIso}</when></TimeStamp>`
        + `<ExtendedData><Data name="url"><value>${xmlEscape(url)}</value></Data></ExtendedData>`
        + `</Placemark>`;
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

    const generatedAtIso = resolveUtcDayStartIso();
    const placemarks: string[] = [
        buildPlacemark('Blog Index', `${origin}/blog`, generatedAtIso),
    ];

    const blogSlugs = await fetchPublishedBlogSlugs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const hasBlogSurface = hasSelectedBlogTemplatePage(manifest) || hasBlogDetailTemplatePage(manifest);

    if (!hasBlogSurface && blogSlugs.length === 0) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    for (const slug of Array.from(new Set(blogSlugs))) {
        placemarks.push(buildPlacemark(`Blog: ${slug}`, `${origin}/blog/${slug}`, generatedAtIso));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>`
        + `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>`
        + `<name>Blog URL KML</name>`
        + `<description>${xmlEscape('Generated daily at 00:00 UTC for selected blog-template pages.')}</description>`
        + placemarks.join('')
        + `</Document></kml>`;

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'content-type': 'application/vnd.google-earth.kml+xml; charset=utf-8',
            'cache-control': buildDailySeoCacheControl(),
            'x-seo-refresh-window': '00:00-utc',
        },
    });
}
