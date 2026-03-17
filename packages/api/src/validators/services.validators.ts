import { z } from 'zod';

export const createServiceSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    category: z.string().max(100).optional(),
    durationMinutes: z.number().int().min(1).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional().default('USD'),
    capacity: z.number().int().min(1).optional().default(1),
    bufferTimeMinutes: z.number().int().min(0).optional().default(0),
    settings: z.record(z.unknown()).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
