import { z } from 'zod';

export const createPageSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^\/$/, 'Slug must contain only lowercase letters, numbers, and hyphens (or "/" for home)'),
    seoJsonb: z.object({
        metaTitle: z.string().max(255).optional(),
        metaDescription: z.string().max(500).optional(),
        ogTitle: z.string().max(255).optional(),
        ogDescription: z.string().max(500).optional(),
        ogImageUrl: z.string().url().optional(),
    }).optional(),
});

export const updatePageSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^\/$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    seoJsonb: z.object({
        metaTitle: z.string().max(255).optional(),
        metaDescription: z.string().max(500).optional(),
        ogTitle: z.string().max(255).optional(),
        ogDescription: z.string().max(500).optional(),
        ogImageUrl: z.string().url().optional(),
    }).optional(),
    isPublished: z.boolean().optional(),
});

export const reorderPagesSchema = z.object({
    pages: z.array(z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
    })).min(1),
});
