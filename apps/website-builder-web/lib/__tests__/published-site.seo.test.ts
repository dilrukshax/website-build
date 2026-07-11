import { describe, expect, it } from 'vitest';
import {
    buildStructuredDataForPublishedPage,
    findManifestPageByRequestedSlug,
    resolvePublishedPageSeo,
    type PublishedManifest,
    type PublishedManifestPage,
} from '../published-site';

function createManifest(overrides?: Partial<PublishedManifest>): PublishedManifest {
    return {
        tenantId: 'tenant-1',
        instanceId: 'instance-1',
        subdomain: 'mysalon',
        fullDomain: 'mysalon.buildmyonlineweb.site',
        primaryDomain: 'www.mysalon.com',
        siteName: 'My Salon',
        seoDefaults: {
            metaTitle: 'My Salon',
            metaDescription: 'Default description',
            canonicalPath: '/',
            robotsIndex: true,
            robotsFollow: true,
            ogImageUrl: 'https://example.com/default-og.jpg',
            twitterCard: 'summary_large_image',
        },
        seoBusiness: {
            businessType: 'HealthAndBeautyBusiness',
            name: 'My Salon',
            streetAddress: '123 Main St',
            addressLocality: 'Colombo',
            addressCountry: 'LK',
            sameAs: ['https://instagram.com/mysalon'],
        },
        tokens: {
            primary: '#ef4444',
            secondary: '#10b981',
            accent: '#f59e0b',
            text: '#1f2937',
            background: '#ffffff',
            font: 'Inter',
        },
        features: {},
        header: {},
        footer: {},
        pages: [],
        ...overrides,
    };
}

function createPage(overrides?: Partial<PublishedManifestPage>): PublishedManifestPage {
    return {
        page: {
            id: 'page-1',
            slug: 'about',
            title: 'About',
            seo: {
                metaTitle: 'About My Salon',
                metaDescription: 'About page description',
                canonicalPath: '/about',
                ogTitle: 'About OG',
                twitterTitle: 'About Twitter',
            },
        },
        sections: [],
        ...overrides,
    };
}

describe('published SEO resolver', () => {
    it('prefers page SEO fields over website defaults and uses custom-domain canonical host', () => {
        const manifest = createManifest();
        const page = createPage();

        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: page,
            fallbackHost: 'mysalon.buildmyonlineweb.site',
        });

        expect(seo.title).toBe('About My Salon');
        expect(seo.description).toBe('About page description');
        expect(seo.ogTitle).toBe('About OG');
        expect(seo.twitterTitle).toBe('About Twitter');
        expect(seo.canonicalUrl).toBe('https://www.mysalon.com/about');
    });

    it('forces noindex/nofollow when requested by host policy', () => {
        const manifest = createManifest();
        const page = createPage({
            page: {
                id: 'page-1',
                slug: '/',
                title: 'Home',
                seo: null,
            },
        });

        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: page,
            fallbackHost: 'buildmyonlineweb.site',
            forceNoIndex: true,
        });

        expect(seo.robotsIndex).toBe(false);
        expect(seo.robotsFollow).toBe(false);
    });
});

describe('structured data builder', () => {
    it('emits LocalBusiness and breadcrumb for non-home pages', () => {
        const manifest = createManifest();
        const page = createPage();
        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: page,
            fallbackHost: 'www.mysalon.com',
        });

        const entries = buildStructuredDataForPublishedPage({
            manifest,
            pageEntry: page,
            seo,
        });

        expect(entries.length).toBe(2);
        expect(entries[0]?.['@type']).toBe('HealthAndBeautyBusiness');
        expect(entries[1]?.['@type']).toBe('BreadcrumbList');
    });

    it('falls back to Organization structured data when LocalBusiness minimum fields are missing', () => {
        const manifest = createManifest({
            seoBusiness: {
                businessType: 'Organization',
                name: 'My Salon',
                sameAs: ['https://facebook.com/mysalon'],
            },
        });
        const page = createPage({
            page: {
                id: 'page-home',
                slug: '/',
                title: 'Home',
                seo: null,
            },
        });
        const seo = resolvePublishedPageSeo({
            manifest,
            pageEntry: page,
            fallbackHost: 'www.mysalon.com',
        });

        const entries = buildStructuredDataForPublishedPage({
            manifest,
            pageEntry: page,
            seo,
        });

        expect(entries.length).toBe(1);
        expect(entries[0]?.['@type']).toBe('Organization');
    });
});

describe('published page resolver', () => {
    it('uses manifest.defaultPageSlug for root requests when "/" page is missing', () => {
        const manifest = createManifest({
            defaultPageSlug: 'landing',
            pages: [
                createPage({
                    page: {
                        id: 'page-about',
                        slug: 'about',
                        title: 'About',
                        seo: null,
                    },
                }),
                createPage({
                    page: {
                        id: 'page-landing',
                        slug: 'landing',
                        title: 'Landing',
                        seo: null,
                    },
                }),
            ],
        });

        const resolved = findManifestPageByRequestedSlug(manifest, '/');
        expect(resolved?.page.slug).toBe('landing');
    });

    it('falls back to first available page for root request when preferred root slug is missing', () => {
        const manifest = createManifest({
            defaultPageSlug: 'home',
            pages: [
                createPage({
                    page: {
                        id: 'page-services',
                        slug: 'services',
                        title: 'Services',
                        seo: null,
                    },
                }),
                createPage({
                    page: {
                        id: 'page-contact',
                        slug: 'contact',
                        title: 'Contact',
                        seo: null,
                    },
                }),
            ],
        });

        const resolved = findManifestPageByRequestedSlug(manifest, '/');
        expect(resolved?.page.slug).toBe('services');
    });
});
