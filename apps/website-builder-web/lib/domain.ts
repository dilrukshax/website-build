import { env } from './env';

const DEFAULT_SITE_DOMAIN = 'buildmyonlineweb.site';
const DOMAIN_PROTOCOL_REGEX = /^https?:\/\//i;

function normalizeDomainHost(domain: string | null | undefined): string {
    if (!domain) {
        return '';
    }

    return domain
        .trim()
        .toLowerCase()
        .replace(DOMAIN_PROTOCOL_REGEX, '')
        .replace(/\/.*$/, '');
}

export function getPrimarySiteDomain(): string {
    return normalizeDomainHost(env.siteDomain()) || DEFAULT_SITE_DOMAIN;
}

export function getPrimaryDomainSuffix(): string {
    return `.${getPrimarySiteDomain()}`;
}

export function buildPrimaryFullDomain(subdomain: string | null | undefined): string {
    const normalizedSubdomain = subdomain?.trim().toLowerCase() || '';
    if (!normalizedSubdomain) {
        return '';
    }

    return `${normalizedSubdomain}.${getPrimarySiteDomain()}`;
}

export function getInstanceDisplayDomain(instance?: { subdomain?: string | null; fullDomain?: string | null } | null): string {
    const storedFullDomain = normalizeDomainHost(instance?.fullDomain);
    if (storedFullDomain) {
        return storedFullDomain;
    }

    return buildPrimaryFullDomain(instance?.subdomain);
}
