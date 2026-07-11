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
    fetchPublishedBlogSlugs,
    hasBlogDetailTemplatePage,
    hasSelectedBlogTemplatePage,
    isSeoExcludedManifestPage,
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

function formatMarkdownLink(label: string, url: string, description?: string): string {
    return description
        ? `- [${label}](${url}): ${description}`
        : `- [${label}](${url})`;
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

    const slugs = await fetchPublishedBlogSlugs({
        tenantId: manifest.tenantId,
        instanceId: manifest.instanceId,
        baseUrl: origin,
    });
    const uniqueSlugs = Array.from(new Set(
        slugs
            .map((slug) => slug.trim())
            .filter(Boolean),
    ));
    const hasBlogTemplate = hasSelectedBlogTemplatePage(manifest) || hasBlogDetailTemplatePage(manifest);
    const includeBlogSection = hasBlogTemplate || uniqueSlugs.length > 0;
    const hasPublishedBlogPosts = uniqueSlugs.length > 0;
    const blogLinks: string[] = includeBlogSection
        ? [
            formatMarkdownLink('Blog index', `${origin}/blog`, 'Full published archive page'),
            ...uniqueSlugs.map((slug) => formatMarkdownLink(`Blog post: ${slug}`, `${origin}/blog/${slug}`, 'Published article')),
        ]
        : [];

    const siteTitle = (manifest.siteName || manifest.subdomain || context.params.subdomain || 'Published Website').trim();
    const lines: string[] = [
        `# ${siteTitle}`,
        '',
        '> LLM-readable index of published public pages for this website.',
        '',
        `- Canonical origin: ${origin}`,
        `- Sitemap: ${origin}/sitemap.xml`,
        `- Pages sitemap: ${origin}/sitemap-pages.xml`,
        `- Full LLM index: ${origin}/llms-full.txt`,
    ];

    if (includeBlogSection) {
        lines.push(`- Blog sitemap: ${origin}/sitemap-blog.xml`);
        lines.push(`- Misc sitemap: ${origin}/sitemap-misc.xml`);
        if (hasPublishedBlogPosts) {
            lines.push(`- Posts sitemap: ${origin}/sitemap-posts.xml`);
        }
        lines.push(`- Legacy blog sitemap (compat): ${origin}/blog-sitemap.xml`);
    }

    lines.push('', '## Pages');
    lines.push(...(pageLinks.length > 0 ? pageLinks : [formatMarkdownLink('Home', `${origin}/`)]));

    if (includeBlogSection) {
        lines.push('', '## Blog');
        lines.push(...(blogLinks.length > 0 ? blogLinks : [formatMarkdownLink('Blog index', `${origin}/blog`)]));
    }

    lines.push('', '## Optional');
    lines.push(formatMarkdownLink('Blog Locations KML', `${origin}/blog-locations.kml`, 'Utility metadata resource'));
    lines.push(formatMarkdownLink('XML Sitemap', `${origin}/sitemap.xml`, 'Machine-readable sitemap index'));
    lines.push(formatMarkdownLink('LLMs Full', `${origin}/llms-full.txt`, 'Full-content index for AI ingestion'));

    return new NextResponse(lines.join('\n'), {
        status: 200,
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=120, stale-while-revalidate=300',
        },
    });
}
