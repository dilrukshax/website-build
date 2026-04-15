import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getSitemap } from '../preview/[subdomain]/sitemap.xml/route';
import { GET as getRobots } from '../preview/[subdomain]/robots.txt/route';

const mocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    resolvePublishedPageSeo: vi.fn(),
    findManifestPageByRequestedSlug: vi.fn(),
    resolveRequestedSlug: vi.fn(),
    normalizeHost: vi.fn(),
    isCmsHost: vi.fn(),
    resolveCanonicalHost: vi.fn(),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: mocks.resolvePublishedManifest,
    resolvePublishedPageSeo: mocks.resolvePublishedPageSeo,
    findManifestPageByRequestedSlug: mocks.findManifestPageByRequestedSlug,
    resolveRequestedSlug: mocks.resolveRequestedSlug,
    normalizeHost: mocks.normalizeHost,
    isCmsHost: mocks.isCmsHost,
    resolveCanonicalHost: mocks.resolveCanonicalHost,
}));

describe('preview SEO routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.normalizeHost.mockImplementation((value: string | null | undefined) => (value || '').toLowerCase());
    });

    it('returns per-site sitemap.xml with canonical URLs', async () => {
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

        const request = new NextRequest('https://www.mysalon.com/preview/mysalon/sitemap.xml');
        const response = await getSitemap(request, { params: { subdomain: 'mysalon' } } as any);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/xml');
        expect(body).toContain('<loc>https://www.mysalon.com/</loc>');
        expect(body).toContain('<loc>https://www.mysalon.com/about</loc>');
    });

    it('returns per-site robots.txt with sitemap reference', async () => {
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
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

