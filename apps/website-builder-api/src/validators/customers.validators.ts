import { z } from 'zod';

export const createCustomerSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(50).optional(),
    notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const searchCustomerSchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
