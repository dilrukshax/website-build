import { z } from 'zod';

export const createStaffSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(1, 'Full name is required').max(255),
    roleId: z.string().uuid('Valid role ID is required'),
});

export const updateStaffSchema = z.object({
    fullName: z.string().min(1).max(255).optional(),
    roleId: z.string().uuid().optional(),
    status: z.enum(['active', 'inactive']).optional(),
});
