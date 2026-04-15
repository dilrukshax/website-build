import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url().max(2048).optional().nullable(),
    price: z.number().positive(),
    currency: z.string().length(3).default('USD'),
    isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export const reorderProductsSchema = z.object({
    products: z.array(
        z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
        })
    ).min(1),
});
