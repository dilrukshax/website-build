import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cms superadmin custom-domain routes', () => {
    it('keeps custom-domain review routes protected by requireSuperAdmin', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');

        expect(source).toContain("router.get('/superadmin/custom-domains', requireSuperAdmin, SuperAdminController.listCustomDomainRequests);");
        expect(source).toContain("router.post('/superadmin/custom-domains/:instanceId/mark-connected', requireSuperAdmin, SuperAdminController.markCustomDomainRequestConnected);");
    });
});
