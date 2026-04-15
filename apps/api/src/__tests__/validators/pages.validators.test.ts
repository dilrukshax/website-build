import { describe, expect, it } from 'vitest';
import { createPageSchema, updatePageSchema } from '../../validators/pages.validators';

describe('page validators', () => {
    it('accepts extended SEO metadata payload fields', () => {
        const parsed = createPageSchema.safeParse({
            title: 'About',
            slug: 'about',
            seoJsonb: {
                metaTitle: 'About Us',
                metaDescription: 'Learn more about our team.',
                metaKeywords: 'about, team',
                canonicalPath: '/about',
                robotsIndex: true,
                robotsFollow: true,
                ogTitle: 'About Us',
                ogDescription: 'Learn more about our team.',
                ogImageUrl: 'https://example.com/og.jpg',
                ogImageAlt: 'Team photo',
                twitterCard: 'summary_large_image',
                twitterTitle: 'About Us',
                twitterDescription: 'Learn more about our team.',
                twitterImageUrl: 'https://example.com/twitter.jpg',
                twitterImageAlt: 'Team photo',
            },
        });

        expect(parsed.success).toBe(true);
    });

    it('rejects canonicalPath values that do not begin with "/"', () => {
        const parsed = updatePageSchema.safeParse({
            seoJsonb: {
                canonicalPath: 'about',
            },
        });

        expect(parsed.success).toBe(false);
    });

    it('allows clearing page SEO overrides by sending seoJsonb null', () => {
        const parsed = updatePageSchema.safeParse({
            seoJsonb: null,
        });

        expect(parsed.success).toBe(true);
    });
});

