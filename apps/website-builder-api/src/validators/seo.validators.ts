import { z } from 'zod';

const CANONICAL_PATH_PATTERN = /^\/[^\s]*$/;

const nullableShortText = (max: number) => z.string().trim().max(max).nullable().optional();
const nullableUrl = z.string().url().max(2048).nullable().optional();

export const seoDataSchema = z.object({
    metaTitle: nullableShortText(255),
    metaDescription: nullableShortText(500),
    metaKeywords: nullableShortText(1000),
    canonicalPath: z
        .string()
        .trim()
        .max(2048)
        .regex(CANONICAL_PATH_PATTERN, 'canonicalPath must start with "/" and cannot contain spaces')
        .nullable()
        .optional(),
    robotsIndex: z.boolean().nullable().optional(),
    robotsFollow: z.boolean().nullable().optional(),
    ogTitle: nullableShortText(255),
    ogDescription: nullableShortText(500),
    ogImageUrl: nullableUrl,
    ogImageAlt: nullableShortText(300),
    twitterCard: z.enum(['summary', 'summary_large_image']).nullable().optional(),
    twitterTitle: nullableShortText(255),
    twitterDescription: nullableShortText(500),
    twitterImageUrl: nullableUrl,
    twitterImageAlt: nullableShortText(300),
}).strict();

export const websiteSeoBusinessSchema = z.object({
    businessType: nullableShortText(100),
    name: nullableShortText(255),
    description: nullableShortText(1000),
    imageUrl: nullableUrl,
    telephone: nullableShortText(50),
    email: z.string().trim().email().max(320).nullable().optional(),
    priceRange: nullableShortText(50),
    streetAddress: nullableShortText(255),
    addressLocality: nullableShortText(255),
    addressRegion: nullableShortText(255),
    postalCode: nullableShortText(50),
    addressCountry: nullableShortText(255),
    sameAs: z.array(z.string().url().max(2048)).max(20).nullable().optional(),
}).strict();

export const websiteSeoSettingsSchema = z.object({
    siteName: nullableShortText(255),
    defaults: seoDataSchema.nullable().optional(),
    business: websiteSeoBusinessSchema.nullable().optional(),
}).strict();

