import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(100),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).min(1, 'At least one permission is required'),
});

export const updateRoleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).min(1).optional(),
});
