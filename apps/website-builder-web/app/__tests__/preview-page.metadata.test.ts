import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    findManifestPageByRequestedSlug: vi.fn(),
    resolvePublishedPageSeo: vi.fn(),
    resolveRequestedSlug: vi.fn(),
    normalizeHost: vi.fn(),
    isCmsHost: vi.fn(),
    resolveRoutedRequestHost: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: () => new Headers({ host: 'www.mysalon.com' }),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: mocks.resolvePublishedManifest,
    findManifestPageByRequestedSlug: mocks.findManifestPageByRequestedSlug,
    resolvePublishedPageSeo: mocks.resolvePublishedPageSeo,
    resolveRequestedSlug: mocks.resolveRequestedSlug,
    normalizeHost: mocks.normalizeHost,
    isCmsHost: mocks.isCmsHost,
    resolveRoutedRequestHost: mocks.resolveRoutedRequestHost,
    buildStructuredDataForPublishedPage: vi.fn(() => []),
}));

describe('preview page metadata generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
        mocks.normalizeHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRequestedSlug.mockImplementation((segments?: string[]) => {
            if (!segments || segments.length === 0) return '/';
            return segments.join('/');
        });
        mocks.isCmsHost.mockReturnValue(false);
    });

    it('returns noindex metadata when page is missing', async () => {
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: { pages: [] },
        });
        mocks.findManifestPageByRequestedSlug.mockReturnValue(null);

        const { generateMetadata } = await import('../preview/[subdomain]/[[...slug]]/page');
        const metadata = await generateMetadata({ params: { subdomain: 'missing-site', slug: ['missing'] } });

        expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('returns canonical/open-graph metadata for resolved pages', async () => {
        const pageEntry = { page: { slug: 'about', title: 'About' }, sections: [] };
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: { pages: [pageEntry] },
        });
        mocks.findManifestPageByRequestedSlug.mockReturnValue(pageEntry);
        mocks.resolvePublishedPageSeo.mockReturnValue({
            title: 'About My Salon',
            description: 'About description',
            metaKeywords: 'about,salon',
            canonicalUrl: 'https://www.mysalon.com/about',
            robotsIndex: true,
            robotsFollow: true,
            ogTitle: 'About OG',
            ogDescription: 'OG description',
            ogImageUrl: 'https://example.com/og.jpg',
            ogImageAlt: 'OG image',
            twitterCard: 'summary_large_image',
            twitterTitle: 'About Twitter',
            twitterDescription: 'Twitter description',
            twitterImageUrl: 'https://example.com/twitter.jpg',
            twitterImageAlt: 'Twitter image',
            siteName: 'My Salon',
        });

        const { generateMetadata } = await import('../preview/[subdomain]/[[...slug]]/page');
        const metadata = await generateMetadata({ params: { subdomain: 'mysalon', slug: ['about'] } });

        expect(metadata.alternates?.canonical).toBe('https://www.mysalon.com/about');
        expect(metadata.openGraph?.url).toBe('https://www.mysalon.com/about');
        expect(metadata.robots).toEqual({
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        });
    });
});

