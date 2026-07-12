import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getBlogSitemap } from '../preview/[subdomain]/sitemap-blog.xml/route';
import { GET as getMiscSitemap } from '../preview/[subdomain]/sitemap-misc.xml/route';
import { GET as getLlmsFull } from '../preview/[subdomain]/llms-full.txt/route';
import { GET as getLlms } from '../preview/[subdomain]/llms.txt/route';
import { GET as getPostsSitemap } from '../preview/[subdomain]/sitemap-posts.xml/route';
import { GET as getRobots } from '../preview/[subdomain]/robots.txt/route';
import { GET as getPagesSitemap } from '../preview/[subdomain]/sitemap-pages.xml/route';
import { GET as getSitemapIndex } from '../preview/[subdomain]/sitemap.xml/route';
import { GET as getBlogMarkdown } from '../preview/[subdomain]/blog/[slug]/markdown/route';

const mocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    resolvePublishedPageSeo: vi.fn(),
    findManifestPageByRequestedSlug: vi.fn(),
    resolveRequestedSlug: vi.fn(),
    normalizeHost: vi.fn(),
    isCmsHost: vi.fn(),
    resolveCanonicalHost: vi.fn(),
    resolveRoutedRequestHost: vi.fn(),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: mocks.resolvePublishedManifest,
    resolvePublishedPageSeo: mocks.resolvePublishedPageSeo,
    findManifestPageByRequestedSlug: mocks.findManifestPageByRequestedSlug,
    resolveRequestedSlug: mocks.resolveRequestedSlug,
    normalizeHost: mocks.normalizeHost,
    isCmsHost: mocks.isCmsHost,
    resolveCanonicalHost: mocks.resolveCanonicalHost,
    resolveRoutedRequestHost: mocks.resolveRoutedRequestHost,
}));

describe('preview SEO routes', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.normalizeHost.mockImplementation((value: string | null | undefined) => (value || '').toLowerCase());
        mocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
    });

    it('returns per-site sitemap.xml as a sitemap index with child files', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'about', title: 'About' }, sections: [] },
                { page: { slug: 'blog', title: 'Blog' }, sections: [{ type: 'blog/v15' }] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest,
        });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string } } }) => ({
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    { slug: 'post-one' },
                    { slug: 'post-two' },
                ],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap.xml');
        const response = await getSitemapIndex(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/xml');
        expect(body).toContain('<sitemapindex');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-pages.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-blog.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-posts.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-misc.xml</loc>');
    });

    it('includes blog-related child sitemaps when posts exist without a dedicated blog section page', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest,
        });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string } } }) => ({
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    { slug: 'post-one' },
                ],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap.xml');
        const response = await getSitemapIndex(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-pages.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-blog.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-posts.xml</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/sitemap-misc.xml</loc>');
    });

    it('excludes legacy blog-layout pages from sitemap-pages.xml', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'blog-layout', title: 'Blog Layout' }, sections: [{ type: 'blog-post-detail/v2' }] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest,
        });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string } } }) => ({
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap-pages.xml');
        const response = await getPagesSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<loc>https://www.mysalon.com/</loc>');
        expect(body).not.toContain('/blog-layout');
    });

    it('returns page URLs in sitemap-pages.xml', async () => {
        const manifest = {
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'about', title: 'About' }, sections: [] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string } } }) => ({
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap-pages.xml');
        const response = await getPagesSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/xml');
        expect(body).toContain('<loc>https://www.mysalon.com/</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/about</loc>');
        expect(body).toContain('<changefreq>daily</changefreq>');
        expect(body).toContain('<priority>1.0</priority>');
    });

    it('returns blog index URL in sitemap-blog.xml', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [{ page: { slug: '/', title: 'Home' }, sections: [] }],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ slug: 'post-one', updatedAt: '2026-04-20T09:00:00.000Z' }],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap-blog.xml');
        const response = await getBlogSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<loc>https://www.mysalon.com/blog</loc>');
        expect(body).toContain('<changefreq>daily</changefreq>');
        expect(body).toContain('<priority>0.9</priority>');
    });

    it('returns blog post URLs with image metadata in sitemap-posts.xml', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [{ page: { slug: '/', title: 'Home' }, sections: [] }],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    {
                        slug: 'post-one',
                        title: 'Post One',
                        excerpt: 'Post one summary',
                        featuredImageUrl: 'https://cdn.example.com/post-one.jpg',
                        updatedAt: '2026-04-20T10:00:00.000Z',
                    },
                    {
                        slug: 'post-two',
                        title: 'Post Two',
                        updatedAt: '2026-04-19T10:00:00.000Z',
                    },
                ],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap-posts.xml');
        const response = await getPostsSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<loc>https://www.mysalon.com/blog/post-one</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/blog/post-two</loc>');
        expect(body).toContain('<changefreq>weekly</changefreq>');
        expect(body).toContain('<priority>0.8</priority>');
        expect(body).toContain('<image:image>');
        expect(body).toContain('<image:loc>https://cdn.example.com/post-one.jpg</image:loc>');
    });

    it('returns utility URLs in sitemap-misc.xml', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [{ page: { slug: 'blog', title: 'Blog' }, sections: [{ type: 'blog/v15' }] }],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap-misc.xml');
        const response = await getMiscSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('<loc>https://www.mysalon.com/blog-locations.kml</loc>');
        expect(body).toContain('<changefreq>monthly</changefreq>');
        expect(body).toContain('<priority>0.3</priority>');
    });

    it('returns llms.txt with page and blog links for blog-enabled sites', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            siteName: 'My Salon',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'blog', title: 'Blog' }, sections: [{ type: 'blog/v15' }] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string; title: string } } }) => ({
            title: pageEntry.page.title,
            canonicalPath: pageEntry.page.slug === '/' ? '/' : `/${pageEntry.page.slug}`,
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [
                    { slug: 'post-one' },
                    { slug: 'post-two' },
                ],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/llms.txt');
        const response = await getLlms(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(body).toContain('# My Salon');
        expect(body).toContain('- Sitemap: https://www.mysalon.com/sitemap.xml');
        expect(body).toContain('- Pages sitemap: https://www.mysalon.com/sitemap-pages.xml');
        expect(body).toContain('- Blog sitemap: https://www.mysalon.com/sitemap-blog.xml');
        expect(body).toContain('- Posts sitemap: https://www.mysalon.com/sitemap-posts.xml');
        expect(body).toContain('- Misc sitemap: https://www.mysalon.com/sitemap-misc.xml');
        expect(body).toContain('## Pages');
        expect(body).toContain('- [Home](https://www.mysalon.com/)');
        expect(body).toContain('## Blog');
        expect(body).toContain('- [Blog index](https://www.mysalon.com/blog)');
        expect(body).toContain('- [Blog post: post-one](https://www.mysalon.com/blog/post-one)');
        expect(body).toContain('- [Blog post: post-two](https://www.mysalon.com/blog/post-two)');
    });

    it('does not include legacy blog-layout pages in llms.txt page links', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            siteName: 'My Salon',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'blog-layout', title: 'Blog Layout' }, sections: [{ type: 'blog-post-detail/v2' }] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string; title: string } } }) => ({
            title: pageEntry.page.title,
            canonicalPath: pageEntry.page.slug === '/' ? '/' : `/${pageEntry.page.slug}`,
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/llms.txt');
        const response = await getLlms(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain('## Pages');
        expect(body).toContain('- [Home](https://www.mysalon.com/)');
        expect(body).not.toContain('blog-layout');
    });

    it('returns llms-full.txt with full post content blocks', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            siteName: 'My Salon',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
                { page: { slug: 'blog', title: 'Blog' }, sections: [{ type: 'blog/v15' }] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.findManifestPageByRequestedSlug.mockImplementation((_: unknown, slug: string) =>
            manifest.pages.find((entry) => (entry.page.slug === '/' ? '/' : entry.page.slug) === slug) || null,
        );
        mocks.resolvePublishedPageSeo.mockImplementation(({ pageEntry }: { pageEntry: { page: { slug: string; title: string } } }) => ({
            title: pageEntry.page.title,
            canonicalPath: pageEntry.page.slug === '/' ? '/' : `/${pageEntry.page.slug}`,
            canonicalUrl: pageEntry.page.slug === '/' ? 'https://www.mysalon.com/' : `https://www.mysalon.com/${pageEntry.page.slug}`,
            robotsIndex: true,
            description: `${pageEntry.page.title} description`,
        }));

        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
            const url = input.toString();
            if (url.endsWith('/web/blogs/post-one')) {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            slug: 'post-one',
                            title: 'Post One',
                            excerpt: 'Post one summary',
                            contentHtml: '<p>Hello <strong>world</strong>.</p>',
                            publishedAt: '2026-04-20T10:00:00.000Z',
                        },
                    }),
                };
            }

            return {
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        {
                            slug: 'post-one',
                            title: 'Post One',
                            excerpt: 'Post one summary',
                        },
                    ],
                }),
            };
        }) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/llms-full.txt');
        const response = await getLlmsFull(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(body).toContain('# My Salon');
        expect(body).toContain('## Full Post Content');
        expect(body).toContain('### Post: Post One');
        expect(body).toContain('**URL:** https://www.mysalon.com/blog/post-one');
        expect(body).toContain('Hello **world**.');
    });

    it('returns markdown for blog post .md URL', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            pages: [
                { page: { slug: '/', title: 'Home' }, sections: [] },
            ],
        };

        mocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    slug: 'post-one',
                    title: 'Post One',
                    excerpt: 'Post one summary',
                    contentHtml: '<p>Line one.</p><p>Line two.</p>',
                    publishedAt: '2026-04-20T10:00:00.000Z',
                },
            }),
        })) as any);

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/blog/post-one.md');
        const response = await getBlogMarkdown(request, { params: { subdomain: 'mysalon', slug: 'post-one' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/markdown');
        expect(body).toContain('# Post One');
        expect(body).toContain('**URL:** https://www.mysalon.com/blog/post-one');
        expect(body).toContain('Line one.');
        expect(body).toContain('Line two.');
    });

    it('returns per-site robots.txt with sitemap reference', async () => {
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
                pages: [],
                primaryDomain: 'www.mysalon.com',
            },
        });
        mocks.isCmsHost.mockReturnValue(false);
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/robots.txt');
        const response = await getRobots(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(body).toContain('User-agent: *');
        expect(body).toContain('Allow: /');
        expect(body).toContain('Sitemap: https://www.mysalon.com/sitemap.xml');
    });
});
