import { z } from 'zod';

export const createTenantSchema = z.object({
    businessName: z.string().min(1, 'Business name is required').max(255),
});

export const updateTenantSchema = z.object({
    businessName: z.string().min(1).max(255).optional(),
});
