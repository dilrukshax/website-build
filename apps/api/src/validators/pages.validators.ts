import { z } from 'zod';
import { seoDataSchema } from './seo.validators';

export const createPageSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^\/$/, 'Slug must contain only lowercase letters, numbers, and hyphens (or "/" for home)'),
    seoJsonb: seoDataSchema.nullable().optional(),
});

export const updatePageSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^\/$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    seoJsonb: seoDataSchema.nullable().optional(),
    isPublished: z.boolean().optional(),
});

export const reorderPagesSchema = z.object({
    pages: z.array(z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
    })).min(1),
});
