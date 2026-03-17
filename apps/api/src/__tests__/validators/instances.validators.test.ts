import { describe, expect, it } from 'vitest';
import {
    createInstanceSchema,
    upsertDomainRouteSchema,
} from '../../validators/instances.validators';

describe('instance validators', () => {
    it('rejects create-instance payloads without industry (businessType)', () => {
        const parsed = createInstanceSchema.safeParse({
            name: 'My Website',
            subdomain: 'my-website',
            timezone: 'Asia/Colombo',
        });

        expect(parsed.success).toBe(false);
        if (!parsed.success) {
            const fieldNames = parsed.error.issues.map((issue) => issue.path.join('.'));
            expect(fieldNames).toContain('businessType');
        }
    });

    it('accepts valid create-instance payloads with required industry', () => {
        const parsed = createInstanceSchema.parse({
            name: 'My Website',
            subdomain: 'my-website',
            businessType: 'Salon & Spa',
            timezone: 'Asia/Colombo',
        });

        expect(parsed.businessType).toBe('Salon & Spa');
        expect(parsed.subdomain).toBe('my-website');
    });

    it('accepts valid domain-route hostnames and lowercases values', () => {
        const parsed = upsertDomainRouteSchema.parse({
            host: 'WWW.Example.COM',
        });

        expect(parsed.host).toBe('www.example.com');
    });

    it('rejects domain-route host values with protocol or path', () => {
        const withProtocol = upsertDomainRouteSchema.safeParse({
            host: 'https://www.example.com',
        });
        expect(withProtocol.success).toBe(false);

        const withPath = upsertDomainRouteSchema.safeParse({
            host: 'www.example.com/path',
        });
        expect(withPath.success).toBe(false);
    });
});
