import { z } from 'zod';

export const createInquirySchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    message: z.string().min(1).max(5000),
});

export const updateInquiryStatusSchema = z.object({
    status: z.enum(['new', 'in_progress', 'resolved', 'spam']),
});
