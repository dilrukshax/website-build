import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalHost, resolvePublishedManifest, resolveRoutedRequestHost } from '../../../../../../lib/published-site';
import { fetchPublishedBlogPostBySlug } from '../../../seo-artifacts';
import { htmlToMarkdown, toMarkdownDate } from '../../../seo-markdown';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildOriginFromHost(host: string): string {
    if (!host) {
        return '';
    }

    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    return `${isLocal ? 'http' : 'https'}://${host}`;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }

    return null;
}

export async function GET(
    request: NextRequest,
    context: { params: { subdomain: string; slug: string } },
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

    const post = await fetchPublishedBlogPostBySlug({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        slug: context.params.slug,
        baseUrl: origin,
    });

    if (!post) {
        return new NextResponse('Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    }

    const title = firstNonEmpty(post.title, post.slug) || post.slug;
    const excerpt = firstNonEmpty(post.excerpt);
    const postUrl = `${origin}/blog/${post.slug}`;
    const publishedDate = toMarkdownDate(post.publishedAt || post.updatedAt || null);
    const markdownBody = htmlToMarkdown(post.contentHtml);

    const lines: string[] = [
        `# ${title}`,
        '',
    ];

    if (excerpt) {
        lines.push(`> ${excerpt}`);
        lines.push('');
    }

    lines.push(`**URL:** ${postUrl}`);
    lines.push(`**Published:** ${publishedDate}`);
    lines.push('');
    lines.push(markdownBody || '_No content available._');
    lines.push('');

    return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
