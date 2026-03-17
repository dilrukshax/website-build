import { z } from 'zod';

export const createServiceSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    duration: z.number().int().min(1),
    price: z.number().positive(),
    currency: z.string().length(3).default('USD'),
    isActive: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export const reorderServicesSchema = z.object({
    services: z.array(
        z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
        })
    ).min(1),
});
