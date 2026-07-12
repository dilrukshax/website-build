import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    normalizeHost: vi.fn(),
    isCmsHost: vi.fn(),
    resolveCanonicalHost: vi.fn(),
    findManifestPageByRequestedSlug: vi.fn(),
    resolvePublishedPageSeo: vi.fn(),
    resolveRoutedRequestHost: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: () => new Headers({ host: 'www.mysalon.com' }),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: mocks.resolvePublishedManifest,
    normalizeHost: mocks.normalizeHost,
    isCmsHost: mocks.isCmsHost,
    resolveCanonicalHost: mocks.resolveCanonicalHost,
    findManifestPageByRequestedSlug: mocks.findManifestPageByRequestedSlug,
    resolvePublishedPageSeo: mocks.resolvePublishedPageSeo,
    resolveRoutedRequestHost: mocks.resolveRoutedRequestHost,
}));

describe('preview blog metadata generation', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        mocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
        mocks.normalizeHost.mockReturnValue('www.mysalon.com');
        mocks.isCmsHost.mockReturnValue(false);
        mocks.resolveCanonicalHost.mockReturnValue('www.mysalon.com');
        mocks.findManifestPageByRequestedSlug.mockReturnValue({ page: { slug: '/', title: 'Home' }, sections: [] });
        mocks.resolvePublishedPageSeo.mockReturnValue({
            title: 'My Salon',
            description: 'Default description',
            robotsIndex: true,
            robotsFollow: true,
            twitterCard: 'summary_large_image',
        });
    });

    it('returns noindex metadata when post cannot be resolved', async () => {
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                pages: [],
            },
        });

        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: false,
            json: async () => ({}),
        })) as any);

        const { generateMetadata } = await import('../preview/[subdomain]/blog/[slug]/page');
        const metadata = await generateMetadata({
            params: { subdomain: 'mysalon', slug: 'missing-post' },
        });

        expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('returns canonical/open-graph metadata for resolved blog posts', async () => {
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                tokens: {},
                pages: [{ page: { slug: '/', title: 'Home' }, sections: [] }],
            },
        });

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
                    featuredImageUrl: 'https://cdn.example.com/blog.jpg',
                    publishedAt: '2026-04-17T08:30:00.000Z',
                    seoJsonb: {
                        metaTitle: 'Custom Blog Title',
                        metaDescription: 'Custom description',
                        canonicalPath: '/blog/post-title',
                        ogTitle: 'OG Blog Title',
                    },
                },
            }),
        })) as any);

        const { generateMetadata } = await import('../preview/[subdomain]/blog/[slug]/page');
        const metadata = await generateMetadata({
            params: { subdomain: 'mysalon', slug: 'post-title' },
        });

        expect(metadata.alternates?.canonical).toBe('https://www.mysalon.com/blog/post-title');
        expect(metadata.title).toBe('Custom Blog Title');
        expect(metadata.openGraph?.title).toBe('OG Blog Title');
        expect(metadata.openGraph?.url).toBe('https://www.mysalon.com/blog/post-title');
    });
});
