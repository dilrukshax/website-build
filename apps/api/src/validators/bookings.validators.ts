import { z } from 'zod';

export const createBookingSchema = z.object({
    customerId: z.string().uuid().optional(),
    customer: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().max(50).optional(),
    }).optional(),
    serviceId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    notes: z.string().optional(),
}).refine(data => data.customerId || data.customer, {
    message: "Either customerId or customer details must be provided",
    path: ["customer"],
});

export const cancelBookingSchema = z.object({
    reason: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
    serviceId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
