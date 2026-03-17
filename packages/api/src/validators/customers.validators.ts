import { z } from 'zod';

export const createCustomerSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(255),
    phone: z.string().max(50).optional(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        zip: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const searchCustomerSchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
