import { z } from 'zod';

// ============================================================
// Industry validators
// ============================================================

export const createIndustrySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    icon: z.string().max(255).optional(),
});

export const updateIndustrySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    icon: z.string().max(255).optional(),
});

// ============================================================
// Feature validators
// ============================================================

export const createFeatureSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().max(1000).optional(),
});

export const updateFeatureSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    description: z.string().max(1000).optional(),
});

// ============================================================
// Industry-Feature assignment
// ============================================================

export const assignFeaturesSchema = z.object({
    featureIds: z.array(z.string().uuid()).min(1, 'At least one feature is required'),
});

// ============================================================
// Theme validators
// ============================================================

export const createThemeSchema = z.object({
    featureId: z.string().uuid('Feature ID must be a valid UUID'),
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1).max(255)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    version: z.number().int().positive().default(1),
    componentKey: z.string().min(1, 'Component key is required').max(255),
    accessRank: z.number().int().min(1).max(10_000).optional(),
    schemaJsonb: z.record(z.unknown()),
    defaultStylesJsonb: z.record(z.unknown()),
    previewImageUrl: z.string().url().optional(),
});

export const updateThemeSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    componentKey: z.string().min(1).max(255).optional(),
    accessRank: z.number().int().min(1).max(10_000).optional(),
    schemaJsonb: z.record(z.unknown()).optional(),
    defaultStylesJsonb: z.record(z.unknown()).optional(),
    previewImageUrl: z.string().url().nullable().optional(),
    isActive: z.boolean().optional(),
});
