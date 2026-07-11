import { describe, expect, it } from 'vitest';
import { updateWebsiteSettingsSchema } from '../../validators/builder.validators';

describe('builder settings validators', () => {
    it('accepts publisher custom HTML strings for head and body slots', () => {
        const parsed = updateWebsiteSettingsSchema.safeParse({
            customCode: {
                head: '<meta name="google-site-verification" content="abc123" />',
                bodyTop: '<noscript><div>body start</div></noscript>',
                bodyBottom: '<script src="https://cdn.example.com/widget.js" defer></script>',
            },
        });

        expect(parsed.success).toBe(true);
    });

    it('accepts SEO defaults and business fields in website settings payload', () => {
        const parsed = updateWebsiteSettingsSchema.safeParse({
            seo: {
                siteName: 'My Salon',
                defaults: {
                    metaTitle: 'My Salon',
                    metaDescription: 'Best salon in town',
                    canonicalPath: '/',
                    robotsIndex: true,
                    robotsFollow: true,
                    ogImageUrl: 'https://example.com/og.png',
                    twitterCard: 'summary_large_image',
                },
                business: {
                    businessType: 'HealthAndBeautyBusiness',
                    name: 'My Salon',
                    streetAddress: '123 Main St',
                    addressLocality: 'Colombo',
                    addressCountry: 'LK',
                    sameAs: ['https://instagram.com/mysalon'],
                },
            },
        });

        expect(parsed.success).toBe(true);
    });

    it('rejects invalid business sameAs URLs', () => {
        const parsed = updateWebsiteSettingsSchema.safeParse({
            seo: {
                business: {
                    sameAs: ['not-a-url'],
                },
            },
        });

        expect(parsed.success).toBe(false);
    });
});
