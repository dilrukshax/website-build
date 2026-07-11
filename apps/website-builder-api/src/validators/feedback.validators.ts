import { z } from 'zod';

export const createFeedbackRatingSchema = z.object({
    score: z.number().int().min(1).max(5),
    note: z.string().max(2000).optional(),
});

export const createFeedbackSuggestionSchema = z.object({
    title: z.string().min(1).max(255),
    message: z.string().min(1).max(5000),
});
