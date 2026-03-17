const DOMAIN_PROTOCOL_REGEX = /^https?:\/\//i;

export function normalizeDomainHost(domain: string | null | undefined): string {
    if (!domain) {
        return '';
    }

    const trimmed = domain.trim().toLowerCase();
    if (!trimmed) {
        return '';
    }

    const candidate = DOMAIN_PROTOCOL_REGEX.test(trimmed) ? trimmed : `http://${trimmed}`;

    try {
        return new URL(candidate).hostname.toLowerCase();
    } catch {
        return '';
    }
}

export function resolvePrimarySiteDomain(): string {
    return normalizeDomainHost(process.env.SITE_DOMAIN || '');
}

export function buildPrimaryFullDomain(subdomain: string, siteDomain?: string | null): string | null {
    const normalizedSubdomain = subdomain.trim().toLowerCase();
    const normalizedSiteDomain = normalizeDomainHost(siteDomain ?? resolvePrimarySiteDomain());

    if (!normalizedSubdomain || !normalizedSiteDomain) {
        return null;
    }

    return `${normalizedSubdomain}.${normalizedSiteDomain}`;
}
