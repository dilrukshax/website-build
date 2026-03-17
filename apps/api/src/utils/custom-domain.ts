export function normalizeCustomDomainStatus(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    return normalized || null;
}

export function isCustomDomainActive(
    hostnameStatus: string | null | undefined,
    sslStatus: string | null | undefined
): boolean {
    return (
        normalizeCustomDomainStatus(hostnameStatus) === 'active'
        && normalizeCustomDomainStatus(sslStatus) === 'active'
    );
}
