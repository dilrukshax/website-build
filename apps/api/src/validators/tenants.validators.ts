import { z } from 'zod';

export const createTenantSchema = z.object({
    businessName: z
        .string()
        .trim()
        .min(2, 'Organization name must be at least 2 characters')
        .max(255, 'Organization name must be 255 characters or fewer'),
});

export const updateTenantSchema = z.object({
    businessName: z
        .string()
        .trim()
        .min(2, 'Organization name must be at least 2 characters')
        .max(255, 'Organization name must be 255 characters or fewer')
        .optional(),
});
