import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cms feedback route protection', () => {
    it('keeps tenant feedback routes under tenant context', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');

        expect(source).toContain('tenantRouter.use(requireTenant);');
        expect(source).toContain("tenantRouter.get('/feedback/ratings', FeedbackController.listRatings);");
        expect(source).toContain("tenantRouter.post('/feedback/ratings', validate(createFeedbackRatingSchema), FeedbackController.createRating);");
        expect(source).toContain("tenantRouter.get('/feedback/suggestions', FeedbackController.listSuggestions);");
        expect(source).toContain("tenantRouter.post('/feedback/suggestions', validate(createFeedbackSuggestionSchema), FeedbackController.createSuggestion);");
    });

    it('keeps superadmin feedback route protected by requireSuperAdmin', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');

        expect(source).toContain("router.get('/superadmin/feedback', requireSuperAdmin, FeedbackController.listSuperAdmin);");
    });
});
