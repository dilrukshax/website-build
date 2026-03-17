import { z } from 'zod';

export const createBookingSchema = z.object({
    customerId: z.string().uuid(),
    serviceId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    participants: z.number().int().min(1).optional().default(1),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const updateBookingSchema = z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    participants: z.number().int().min(1).optional(),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const cancelBookingSchema = z.object({
    reason: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
    serviceId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
