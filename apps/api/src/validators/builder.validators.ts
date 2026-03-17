import { z } from 'zod';

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
});
