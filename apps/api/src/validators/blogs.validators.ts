import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const seoDataSchema = z.object({
    metaTitle: z.string().trim().min(1).max(255).optional().nullable(),
    metaDescription: z.string().trim().min(1).max(2000).optional().nullable(),
    metaKeywords: z.string().trim().min(1).max(2000).optional().nullable(),
    canonicalPath: z.string().trim().min(1).max(255).optional().nullable(),
    robotsIndex: z.boolean().optional().nullable(),
    robotsFollow: z.boolean().optional().nullable(),
    ogTitle: z.string().trim().min(1).max(255).optional().nullable(),
    ogDescription: z.string().trim().min(1).max(2000).optional().nullable(),
    ogImageUrl: z.string().url().max(2048).optional().nullable(),
    ogImageAlt: z.string().trim().min(1).max(255).optional().nullable(),
    twitterCard: z.enum(['summary', 'summary_large_image']).optional().nullable(),
    twitterTitle: z.string().trim().min(1).max(255).optional().nullable(),
    twitterDescription: z.string().trim().min(1).max(2000).optional().nullable(),
    twitterImageUrl: z.string().url().max(2048).optional().nullable(),
    twitterImageAlt: z.string().trim().min(1).max(255).optional().nullable(),
});

export const createBlogSchema = z.object({
    title: z.string().trim().min(1).max(255),
    slug: z.string().trim().min(1).max(200).regex(slugPattern, 'Slug can include lowercase letters, numbers, and hyphens only'),
    excerpt: z.string().trim().max(1000).optional().nullable(),
    contentHtml: z.string().trim().min(1).max(200000),
    featuredImageUrl: z.string().url().max(2048).optional().nullable(),
    seoJsonb: seoDataSchema.optional().nullable(),
    isPublished: z.boolean().optional(),
    publishedAt: z.string().datetime().optional().nullable(),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
    isPublished: z.boolean().optional(),
    publishedAt: z.string().datetime().optional().nullable(),
});
