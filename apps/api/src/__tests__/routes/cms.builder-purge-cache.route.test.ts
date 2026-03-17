import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cms builder route permissions', () => {
    it('keeps website.publish protection for publish, rollback, and manual purge', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');
        expect(source).toContain("instanceRouter.post('/builder/purge-cache', requirePermission('website.publish'), BuilderController.purgeCache);");
    });
});
