import { describe, expect, it } from 'vitest';
import { createBlogSchema, updateBlogSchema } from '../../validators/blogs.validators';

describe('blogs validators', () => {
    it('accepts a canonical create payload', () => {
        const parsed = createBlogSchema.safeParse({
            title: 'How to Prepare for Your First Visit',
            slug: 'how-to-prepare-for-your-first-visit',
            excerpt: 'A quick checklist before your appointment.',
            contentHtml: '<p>Sample content</p>',
            isPublished: false,
        });

        expect(parsed.success).toBe(true);
    });

    it('rejects invalid slug characters', () => {
        const parsed = createBlogSchema.safeParse({
            title: 'Invalid slug sample',
            slug: 'Invalid Slug',
            contentHtml: '<p>Sample content</p>',
        });

        expect(parsed.success).toBe(false);
    });

    it('allows partial update payloads', () => {
        const parsed = updateBlogSchema.safeParse({
            isPublished: true,
            publishedAt: '2026-04-17T08:30:00.000Z',
        });

        expect(parsed.success).toBe(true);
    });
});
