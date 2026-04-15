import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cms domain-route routing', () => {
    it('keeps domain-route endpoints and allows legacy custom-domain aliases', () => {
        const source = readFileSync(join(process.cwd(), 'src/routes/cms/index.ts'), 'utf-8');

        expect(source).toContain("tenantRouter.put('/instances/:id/domain-route', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);");
        expect(source).toContain("tenantRouter.post('/instances/:id/domain-route', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);");
        expect(source).toContain("tenantRouter.delete('/instances/:id/domain-route/:host', InstancesController.removeDomainRoute);");

        expect(source).toContain("tenantRouter.put('/instances/:id/custom-domain', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);");
        expect(source).toContain("tenantRouter.post('/instances/:id/custom-domain', InstancesController.updateCustomDomainLegacy);");
        expect(source).toContain("tenantRouter.delete('/instances/:id/custom-domain/:host', InstancesController.removeDomainRoute);");
        expect(source).toContain("tenantRouter.get('/instances/:id/custom-domain/status', InstancesController.getCustomDomainStatusLegacy);");
        expect(source).toContain("tenantRouter.get('/instances/:id/custom-domain/setup', InstancesController.getCustomDomainSetupLegacy);");
        expect(source).toContain("tenantRouter.post('/instances/:id/custom-domain/check', InstancesController.checkCustomDomainConnection);");
        expect(source).toContain("tenantRouter.delete('/instances/:id/custom-domain', InstancesController.removeCustomDomainLegacy);");
    });
});
