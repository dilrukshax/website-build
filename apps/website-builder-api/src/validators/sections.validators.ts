import { z } from 'zod';

export const createSectionSchema = z.object({
    // Theme IDs are string primary keys and may be UUID or named IDs (e.g. seed IDs).
    themeId: z.string().min(1, 'Theme ID is required'),
    position: z.number().int().min(0).optional(),
    contentJsonb: z.record(z.unknown()).optional(),
    stylesJsonb: z.record(z.unknown()).optional(),
});

export const updateSectionSchema = z.object({
    themeId: z.string().min(1, 'Theme ID is required').optional(),
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
