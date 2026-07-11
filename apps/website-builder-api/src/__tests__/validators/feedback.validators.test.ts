import { describe, expect, it } from 'vitest';
import {
    createFeedbackRatingSchema,
    createFeedbackSuggestionSchema,
} from '../../validators/feedback.validators';

describe('feedback validators', () => {
    it('accepts valid feedback payloads', () => {
        const rating = createFeedbackRatingSchema.safeParse({
            score: 4,
            note: 'Nice workflow improvements this month.',
        });
        const suggestion = createFeedbackSuggestionSchema.safeParse({
            title: 'Bulk action support',
            message: 'Add bulk status updates for entries in management tables.',
        });

        expect(rating.success).toBe(true);
        expect(suggestion.success).toBe(true);
    });

    it('rejects out-of-range rating scores', () => {
        const tooLow = createFeedbackRatingSchema.safeParse({ score: 0 });
        const tooHigh = createFeedbackRatingSchema.safeParse({ score: 6 });

        expect(tooLow.success).toBe(false);
        expect(tooHigh.success).toBe(false);
    });

    it('rejects empty suggestion fields', () => {
        const missingTitle = createFeedbackSuggestionSchema.safeParse({
            title: '',
            message: 'Valid message',
        });
        const missingMessage = createFeedbackSuggestionSchema.safeParse({
            title: 'Valid title',
            message: '',
        });

        expect(missingTitle.success).toBe(false);
        expect(missingMessage.success).toBe(false);
    });
});
