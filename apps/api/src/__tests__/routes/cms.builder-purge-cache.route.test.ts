import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cms builder routes', () => {
    it('allows manual purge without website.publish permission middleware', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');
        expect(source).toContain("instanceRouter.post('/builder/purge-cache', BuilderController.purgeCache);");
    });
});
