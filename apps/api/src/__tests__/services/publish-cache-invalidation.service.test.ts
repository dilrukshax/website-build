import { describe, expect, it } from 'vitest';
import {
    buildInvalidationHosts,
} from '../../services/publish-cache-invalidation.service';

describe('publish-cache-invalidation host builder', () => {
    it('builds subdomain-only host target', () => {
        const hosts = buildInvalidationHosts({
            subdomain: 'salon',
            siteDomain: 'buildmyonlineweb.site',
        });

        expect(hosts).toEqual(['salon.buildmyonlineweb.site']);
    });

    it('builds subdomain + custom domain host targets', () => {
        const hosts = buildInvalidationHosts({
            subdomain: 'salon',
            customDomain: 'www.mysalon.com',
            siteDomain: 'buildmyonlineweb.site',
        });

        expect(hosts).toEqual(['salon.buildmyonlineweb.site', 'www.mysalon.com']);
    });

    it('normalizes host casing, ports, and dedupes targets', () => {
        const hosts = buildInvalidationHosts({
            subdomain: 'Salon',
            customDomain: 'HTTPS://WWW.MySalon.com:443/path',
            siteDomain: 'BuildMyOnlineWeb.Site',
        });

        expect(hosts).toEqual(['salon.buildmyonlineweb.site', 'www.mysalon.com']);
    });
});
