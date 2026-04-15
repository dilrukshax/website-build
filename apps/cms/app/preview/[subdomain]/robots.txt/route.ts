import { NextRequest, NextResponse } from 'next/server';
import { isCmsHost, normalizeHost, resolveCanonicalHost, resolvePublishedManifest } from '../../../../lib/published-site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getOriginForHost(host: string): string {
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
    const requestHost = normalizeHost(request.headers.get('host'));
    const { manifest } = await resolvePublishedManifest({
        subdomain: context.params.subdomain,
        hostname: requestHost,
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

    const canonicalHost = resolveCanonicalHost(manifest, requestHost);
    const origin = getOriginForHost(canonicalHost || requestHost);
    const sitemapUrl = `${origin}/sitemap.xml`;

    const lines = isCmsHost(requestHost)
        ? [
            'User-agent: *',
            'Disallow: /preview/',
            'Disallow: /published/',
            'Disallow: /api/',
            'Disallow: /dashboard/',
            `Sitemap: ${sitemapUrl}`,
        ]
        : [
            'User-agent: *',
            'Allow: /',
            'Disallow: /preview/',
            'Disallow: /published/',
            'Disallow: /api/',
            'Disallow: /dashboard/',
            `Sitemap: ${sitemapUrl}`,
        ];

    return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
