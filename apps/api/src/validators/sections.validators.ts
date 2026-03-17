import { z } from 'zod';

export const createSectionSchema = z.object({
    themeId: z.string().uuid('Theme ID must be a valid UUID'),
    position: z.number().int().min(0).optional(),
    contentJsonb: z.record(z.unknown()).optional(),
    stylesJsonb: z.record(z.unknown()).optional(),
});

export const updateSectionSchema = z.object({
    contentJsonb: z.record(z.unknown()).optional(),
    stylesJsonb: z.record(z.unknown()).optional(),
    enabled: z.boolean().optional(),
    conditionsJsonb: z.array(z.object({
        op: z.enum(['equals', 'notEquals', 'exists', 'notExists', 'gt', 'lt']),
        path: z.string(),
        value: z.unknown().optional(),
    })).optional(),
});

export const reorderSectionsSchema = z.object({
    sections: z.array(z.object({
        id: z.string().uuid(),
        position: z.number().int().min(0),
    })).min(1),
});
