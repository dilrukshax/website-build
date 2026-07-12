import { z } from 'zod';
import { websiteSeoSettingsSchema } from './seo.validators';

export const updateWebsiteSettingsSchema = z.object({
    tokens: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        text: z.string().optional(),
        background: z.string().optional(),
        font: z.string().optional(),
    }).optional(),
    features: z.record(z.boolean()).optional(),
    header: z.object({
        logoUrl: z.string().optional(),
        logoAlt: z.string().optional(),
        menu: z.array(z.object({
            label: z.string(),
            href: z.string(),
        })).optional(),
    }).optional(),
    footer: z.object({
        copyrightText: z.string().optional(),
        columns: z.array(z.object({
            title: z.string(),
            links: z.array(z.object({
                label: z.string(),
                href: z.string(),
            })),
        })).optional(),
        social: z.array(z.object({
            platform: z.string(),
            url: z.string(),
        })).optional(),
    }).optional(),
    seo: websiteSeoSettingsSchema.optional(),
    customCode: z.object({
        head: z.string().optional(),
        bodyTop: z.string().optional(),
        bodyBottom: z.string().optional(),
    }).optional(),
    analytics: z.object({
        ga4MeasurementId: z.string().trim().regex(/^G-[A-Z0-9]+$/, 'GA4 Measurement ID must look like G-XXXXXXX').optional().nullable(),
        ga4PropertyId: z.string().trim().regex(/^\d{1,12}$/, 'GA4 Property ID must be numeric').optional().nullable(),
    }).optional(),
});

export const applySiteTemplateSchema = z.object({
    templateId: z.string()
        .describe('Template ID or Name to apply'),
    replaceSharedLayoutContent: z.boolean().optional().default(false),
    selectedPageId: z.string().uuid().optional(),
});
