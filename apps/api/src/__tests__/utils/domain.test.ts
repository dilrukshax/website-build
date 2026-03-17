import { describe, expect, it } from 'vitest';
import { buildPrimaryFullDomain, normalizeDomainHost } from '../../utils/domain';

describe('domain utils', () => {
    it('normalizes a domain host by removing protocol/path and lowercasing', () => {
        expect(normalizeDomainHost('HTTPS://Example.COM/some/path')).toBe('example.com');
    });

    it('normalizes host values that include a port', () => {
        expect(normalizeDomainHost('www.clientsite.com:443')).toBe('www.clientsite.com');
    });

    it('builds primary full domain from subdomain and site domain', () => {
        expect(buildPrimaryFullDomain('my-salon', 'buildmyonlineweb.site')).toBe('my-salon.buildmyonlineweb.site');
    });

    it('returns null when site domain is missing', () => {
        expect(buildPrimaryFullDomain('my-salon', '')).toBeNull();
    });
});
