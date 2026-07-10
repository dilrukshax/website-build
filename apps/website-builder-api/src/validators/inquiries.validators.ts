import { z } from 'zod';

export const createInquirySchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().max(50).optional(),
    message: z.string().trim().min(1).max(5000),
    sourceType: z.enum(['contact_form', 'booking_form']).optional(),
    sourcePageSlug: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .regex(/^\/[A-Za-z0-9\-/_]*$/, 'sourcePageSlug must start with "/"')
        .optional(),
});

export const updateInquiryStatusSchema = z.object({
    status: z.enum(['new', 'in_progress', 'resolved', 'spam']),
});
