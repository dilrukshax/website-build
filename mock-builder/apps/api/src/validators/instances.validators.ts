import { z } from 'zod';

export const createInstanceSchema = z.object({
    name: z.string().min(1, 'Instance name is required').max(255),
    subdomain: z.string().min(3).max(63)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
    businessType: z.string().max(255).optional(),
});

export const updateInstanceSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    businessType: z.string().max(255).optional(),
});
