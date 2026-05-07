import { NextRequest, NextResponse } from 'next/server';
import {
    findManifestPageByRequestedSlug,
    resolveCanonicalHost,
    resolvePublishedManifest,
    resolvePublishedPageSeo,
    resolveRequestedSlug,
    resolveRoutedRequestHost,
} from '../../../../lib/published-site';
import {
    fetchPublishedBlogs,
    fetchPublishedBlogPostBySlug,
    hasBlogDetailTemplatePage,
    hasSelectedBlogTemplatePage,
    isSeoExcludedManifestPage,
} from '../seo-artifacts';
import { htmlToMarkdown, toMarkdownDate } from '../seo-markdown';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildOriginFromHost(host: string): string {
    if (!host) {
        return '';
    }

    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    return `${isLocal ? 'http' : 'https'}://${host}`;
}

function formatMarkdownLink(label: string, url: string, description?: string): string {
    return description
        ? `- [${label}](${url}): ${description}`
        : `- [${label}](${url})`;
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

    const siteTitle = (manifest.siteName || manifest.subdomain || context.params.subdomain || 'Published Website').trim();
    const pageLinks: string[] = [];
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
        const pageTitle = (resolvedPage.page.title || seo.title || seo.canonicalPath || seo.canonicalUrl).trim();
        const description = seo.description || `Published page at ${seo.canonicalPath}`;
        pageLinks.push(formatMarkdownLink(pageTitle, seo.canonicalUrl, description));
    }

    const posts = await fetchPublishedBlogs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const uniquePosts = Array.from(new Map(
        posts
            .map((post) => ({ ...post, slug: post.slug.trim() }))
            .filter((post) => post.slug.length > 0)
            .map((post) => [post.slug, post] as const),
    ).values());

    const fullPosts = await Promise.all(uniquePosts.map(async (post) => {
        const detail = await fetchPublishedBlogPostBySlug({
            tenantId: manifest.tenantId,
            instanceId: manifest.instanceId,
            slug: post.slug,
            baseUrl: origin,
        });

        return detail || post;
    }));

    const hasBlogTemplate = hasSelectedBlogTemplatePage(manifest) || hasBlogDetailTemplatePage(manifest);
    const includeBlogSection = hasBlogTemplate || fullPosts.length > 0;
    const blogLinks = fullPosts.map((post) => {
        const title = firstNonEmpty(post.title, post.slug) || post.slug;
        const description = firstNonEmpty(post.excerpt, 'Published article');
        return formatMarkdownLink(title, `${origin}/blog/${post.slug}`, description || undefined);
    });

    const lines: string[] = [
        `# ${siteTitle}`,
        '',
        `> Full-content LLM index for ${siteTitle}.`,
        '',
        `This file contains complete published post content in markdown-like form for AI ingestion.`,
        `For curated discovery links, see \`${origin}/llms.txt\`.`,
        '',
        `- Canonical origin: ${origin}`,
        `- Sitemap: ${origin}/sitemap.xml`,
        '',
        '## Core Content',
        formatMarkdownLink('Homepage', `${origin}/`, 'Site entry point'),
    ];

    if (includeBlogSection) {
        lines.push(formatMarkdownLink('Blog Archive', `${origin}/blog`, 'Published blog index'));
    }

    lines.push('', '## Pages');
    lines.push(...(pageLinks.length > 0 ? pageLinks : [formatMarkdownLink('Home', `${origin}/`)]));

    if (includeBlogSection) {
        lines.push('', '## Blog Posts');
        lines.push(...(blogLinks.length > 0 ? blogLinks : [formatMarkdownLink('Blog index', `${origin}/blog`)]));
    }

    if (fullPosts.length > 0) {
        lines.push('', '## Full Post Content');

        for (const post of fullPosts) {
            const title = firstNonEmpty(post.title, post.slug) || post.slug;
            const bodyMarkdown = htmlToMarkdown(post.contentHtml);
            const summary = firstNonEmpty(post.excerpt, bodyMarkdown.slice(0, 220));
            const publishedDate = toMarkdownDate(post.publishedAt || post.updatedAt || null);
            const postUrl = `${origin}/blog/${post.slug}`;

            lines.push('');
            lines.push(`### Post: ${title}`);
            lines.push('');
            lines.push(`**URL:** ${postUrl}`);
            lines.push(`**Published:** ${publishedDate}`);
            lines.push('');

            if (summary) {
                lines.push('#### Summary');
                lines.push('');
                lines.push(summary);
                lines.push('');
            }

            lines.push('#### Content');
            lines.push('');
            lines.push(bodyMarkdown || '_No content available._');
            lines.push('');
            lines.push('---');
        }
    }

    lines.push('', '## Optional');
    lines.push(formatMarkdownLink('Blog Locations KML', `${origin}/blog-locations.kml`, 'Utility metadata resource'));
    lines.push(formatMarkdownLink('XML Sitemap', `${origin}/sitemap.xml`, 'Machine-readable sitemap index'));
    lines.push(formatMarkdownLink('Curated llms.txt', `${origin}/llms.txt`, 'Short-form AI discovery index'));

    return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
