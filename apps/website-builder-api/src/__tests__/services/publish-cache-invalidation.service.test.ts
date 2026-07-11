import { describe, expect, it } from 'vitest';
import {
    buildInvalidationFiles,
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

    it('builds sitemap and llms file URLs for each host', () => {
        const files = buildInvalidationFiles({
            hosts: ['salon.buildmyonlineweb.site', 'www.mysalon.com'],
            paths: ['/sitemap.xml', '/llms.txt'],
        });

        expect(files).toEqual([
            'https://salon.buildmyonlineweb.site/sitemap.xml',
            'https://salon.buildmyonlineweb.site/llms.txt',
            'https://www.mysalon.com/sitemap.xml',
            'https://www.mysalon.com/llms.txt',
        ]);
    });

    it('uses http origin for localhost hosts when building file URLs', () => {
        const files = buildInvalidationFiles({
            hosts: ['localhost:3000'],
            paths: ['/sitemap.xml'],
        });

        expect(files).toEqual(['http://localhost/sitemap.xml']);
    });

    it('includes split sitemap children in default invalidation targets', () => {
        const files = buildInvalidationFiles({
            hosts: ['salon.buildmyonlineweb.site'],
        });

        expect(files).toContain('https://salon.buildmyonlineweb.site/sitemap.xml');
        expect(files).toContain('https://salon.buildmyonlineweb.site/sitemap-pages.xml');
        expect(files).toContain('https://salon.buildmyonlineweb.site/sitemap-blog.xml');
        expect(files).toContain('https://salon.buildmyonlineweb.site/sitemap-posts.xml');
        expect(files).toContain('https://salon.buildmyonlineweb.site/sitemap-misc.xml');
        expect(files).toContain('https://salon.buildmyonlineweb.site/llms-full.txt');
    });
});
