import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const publishedSiteMocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    findManifestPageByRequestedSlug: vi.fn(),
    resolvePublishedPageSeo: vi.fn(),
    resolveRequestedSlug: vi.fn(),
    normalizeHost: vi.fn(),
    isCmsHost: vi.fn(),
    resolveRoutedRequestHost: vi.fn(),
    resolveCanonicalHost: vi.fn(),
    buildStructuredDataForPublishedPage: vi.fn(() => []),
}));

vi.mock('next/headers', () => ({
    headers: () => new Headers({ host: 'www.mysalon.com' }),
}));

vi.mock('next/navigation', () => ({
    notFound: vi.fn(() => {
        throw new Error('notFound');
    }),
}));

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

vi.mock('../../components/builder/section-renderer', () => ({
    SectionRenderer: ({ componentKey }: { componentKey: string }) => React.createElement('section', { 'data-component-key': componentKey }, componentKey),
}));

vi.mock('../../lib/hosted-font-utils', () => ({
    resolveHostedFontRequest: vi.fn(() => null),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: publishedSiteMocks.resolvePublishedManifest,
    findManifestPageByRequestedSlug: publishedSiteMocks.findManifestPageByRequestedSlug,
    resolvePublishedPageSeo: publishedSiteMocks.resolvePublishedPageSeo,
    resolveRequestedSlug: publishedSiteMocks.resolveRequestedSlug,
    normalizeHost: publishedSiteMocks.normalizeHost,
    isCmsHost: publishedSiteMocks.isCmsHost,
    resolveRoutedRequestHost: publishedSiteMocks.resolveRoutedRequestHost,
    resolveCanonicalHost: publishedSiteMocks.resolveCanonicalHost,
    buildStructuredDataForPublishedPage: publishedSiteMocks.buildStructuredDataForPublishedPage,
}));

describe('published custom HTML renderers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('React', React);
        publishedSiteMocks.normalizeHost.mockReturnValue('www.mysalon.com');
        publishedSiteMocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
        publishedSiteMocks.isCmsHost.mockReturnValue(true);
        publishedSiteMocks.resolveRequestedSlug.mockReturnValue('/');
        publishedSiteMocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        publishedSiteMocks.resolvePublishedPageSeo.mockReturnValue({
            title: 'My Salon',
            description: 'Preview page',
            canonicalUrl: 'https://www.mysalon.com',
            robotsIndex: true,
            robotsFollow: true,
            ogTitle: 'My Salon',
            ogDescription: 'Preview page',
            twitterCard: 'summary_large_image',
            twitterTitle: 'My Salon',
            twitterDescription: 'Preview page',
            siteName: 'My Salon',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    it('renders body-start and footer HTML on normal preview pages', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            tokens: {},
            features: {},
            customCode: {
                bodyTop: '<div id="body-start-marker">body start</div>',
                bodyBottom: '<script id="footer-marker">console.log("footer")</script>',
            },
            pages: [{
                page: { id: 'page-1', slug: '/', title: 'Home' },
                sections: [{ id: 'section-1', type: 'hero/v1', props: {}, styles: {}, conditions: [], position: 1 }],
            }],
        };

        publishedSiteMocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        publishedSiteMocks.findManifestPageByRequestedSlug.mockReturnValue(manifest.pages[0]);

        const module = await import('../preview/[subdomain]/[[...slug]]/page');
        const element = await module.default({ params: { subdomain: 'mysalon', slug: [] } });
        const markup = renderToStaticMarkup(element);

        expect(markup).toContain('id="body-start-marker"');
        expect(markup).toContain('body start');
        expect(markup).toContain('id="footer-marker"');
        expect(markup).toContain('hero/v1');
    });

    it('adds named Head HTML meta tags to page metadata on published-host rewrites', async () => {
        publishedSiteMocks.isCmsHost.mockReturnValue(false);

        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            tokens: {},
            features: {},
            customCode: {
                head: '<meta name="google-site-verification" content="abc123" />',
            },
            pages: [{
                page: { id: 'page-1', slug: '/', title: 'Home' },
                sections: [{ id: 'section-1', type: 'hero/v1', props: {}, styles: {}, conditions: [], position: 1 }],
            }],
        };

        publishedSiteMocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        publishedSiteMocks.findManifestPageByRequestedSlug.mockReturnValue(manifest.pages[0]);

        const module = await import('../preview/[subdomain]/[[...slug]]/page');
        const metadata = await module.generateMetadata({
            params: { subdomain: 'mysalon', slug: [] },
            searchParams: { __be_routed_host: 'www.mysalon.com' },
        });

        expect(metadata.other?.['google-site-verification']).toBe('abc123');
        expect(publishedSiteMocks.resolvePublishedManifest).toHaveBeenCalledWith({
            subdomain: 'mysalon',
            hostname: 'www.mysalon.com',
        });
    });

    it('does not render empty custom HTML placeholders on normal preview pages', async () => {
        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            tokens: {},
            features: {},
            customCode: {
                bodyTop: '   ',
                bodyBottom: '',
            },
            pages: [{
                page: { id: 'page-1', slug: '/', title: 'Home' },
                sections: [{ id: 'section-1', type: 'hero/v1', props: {}, styles: {}, conditions: [], position: 1 }],
            }],
        };

        publishedSiteMocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        publishedSiteMocks.findManifestPageByRequestedSlug.mockReturnValue(manifest.pages[0]);

        const module = await import('../preview/[subdomain]/[[...slug]]/page');
        const element = await module.default({ params: { subdomain: 'mysalon', slug: [] } });
        const markup = renderToStaticMarkup(element);

        expect(markup).not.toContain('body-start-marker');
        expect(markup).not.toContain('footer-marker');
    });

    it('renders body-start and footer HTML on blog index pages', async () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            siteName: 'My Salon',
            tokens: {},
            features: {},
            customCode: {
                bodyTop: '<div id="blog-index-start">index start</div>',
                bodyBottom: '<script id="blog-index-footer">console.log("index footer")</script>',
            },
            pages: [],
        };

        publishedSiteMocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        publishedSiteMocks.findManifestPageByRequestedSlug.mockReturnValue(null);
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ success: true, data: [] }),
        })) as any);

        const module = await import('../preview/[subdomain]/blog/page');
        const element = await module.default({ params: { subdomain: 'mysalon' } });
        const markup = renderToStaticMarkup(element);

        expect(markup).toContain('id="blog-index-start"');
        expect(markup).toContain('id="blog-index-footer"');
        expect(markup).toContain('No published blog posts yet.');
    });

    it('renders body-start and footer HTML on blog detail pages', async () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

        const manifest = {
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            subdomain: 'mysalon',
            tokens: {},
            features: {},
            customCode: {
                bodyTop: '<div id="blog-detail-start">detail start</div>',
                bodyBottom: '<script id="blog-detail-footer">console.log("detail footer")</script>',
            },
            pages: [{ page: { id: 'home-1', slug: '/', title: 'Home' }, sections: [] }],
        };

        publishedSiteMocks.resolvePublishedManifest.mockResolvedValue({ manifest });
        publishedSiteMocks.findManifestPageByRequestedSlug.mockReturnValue(manifest.pages[0]);
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: 'blog-1',
                    title: 'Post Title',
                    slug: 'post-title',
                    excerpt: 'Post excerpt',
                    contentHtml: '<p>Body</p>',
                    featuredImageUrl: null,
                    seoJsonb: null,
                    publishedAt: '2026-04-17T08:30:00.000Z',
                },
            }),
        })) as any);

        const module = await import('../preview/[subdomain]/blog/[slug]/page');
        const element = await module.default({ params: { subdomain: 'mysalon', slug: 'post-title' } });
        const markup = renderToStaticMarkup(element);

        expect(markup).toContain('id="blog-detail-start"');
        expect(markup).toContain('id="blog-detail-footer"');
        expect(markup).toContain('Post Title');
        expect(markup).toContain('<p>Body</p>');
    });
});
