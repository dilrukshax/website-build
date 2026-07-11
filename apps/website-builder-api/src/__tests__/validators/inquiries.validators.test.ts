import { describe, expect, it } from 'vitest';
import { createInquirySchema } from '../../validators/inquiries.validators';

describe('createInquirySchema', () => {
    it('rejects payload without firstName and lastName', () => {
        const parsed = createInquirySchema.safeParse({
            email: 'john@example.com',
            message: 'Need more details',
        });

        expect(parsed.success).toBe(false);
    });

    it('accepts canonical inquiry payload', () => {
        const parsed = createInquirySchema.safeParse({
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            phone: '+1-555-0000',
            message: 'Need more details',
            sourceType: 'contact_form',
            sourcePageSlug: '/contact',
        });

        expect(parsed.success).toBe(true);
    });
});
