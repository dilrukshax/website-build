import dns from 'dns/promises';
import { normalizeDomainHost } from './domain';

const DNS_LOOKUP_TIMEOUT_MS = Number(process.env.CUSTOM_DOMAIN_DNS_LOOKUP_TIMEOUT_MS || 5000);

const DEFAULT_REQUIRED_NAMESERVERS = [
    'luciana.ns.cloudflare.com',
    'miles.ns.cloudflare.com',
] as const;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return promise;
    }

    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const timeoutError = new Error(`DNS lookup timed out after ${timeoutMs}ms`) as NodeJS.ErrnoException;
            timeoutError.code = 'DNS_TIMEOUT';
            reject(timeoutError);
        }, timeoutMs);

        void promise.then(
            (value) => {
                clearTimeout(timeoutId);
                resolve(value);
            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
        );
    });
}

function normalizeNameserver(hostname: string): string {
    const normalized = normalizeDomainHost(hostname.trim());
    return normalized.replace(/\.+$/, '');
}

function parseRequiredNameservers(rawValue?: string): string[] {
    const parsed = (rawValue || '')
        .split(',')
        .map((value) => normalizeNameserver(value))
        .filter((value) => value.length > 0);

    if (parsed.length === 0) {
        return [...DEFAULT_REQUIRED_NAMESERVERS];
    }

    return Array.from(new Set(parsed));
}

export const REQUIRED_CUSTOM_DOMAIN_NAMESERVERS = parseRequiredNameservers(process.env.CUSTOM_DOMAIN_REQUIRED_NAMESERVERS);

export interface DomainNameserverCheckResult {
    hostname: string;
    lookupHost: string;
    requiredNameservers: string[];
    actualNameservers: string[];
    missingNameservers: string[];
    matchesRequired: boolean;
    code: string | null;
}

async function resolveNameservers(hostname: string): Promise<{
    lookupHost: string;
    nameservers: string[];
    code: string | null;
}> {
    const labels = hostname.split('.').filter((part) => part.length > 0);
    if (labels.length < 2) {
        return {
            lookupHost: hostname,
            nameservers: [],
            code: 'INVALID_HOSTNAME',
        };
    }

    const lookupCandidates: string[] = [];
    for (let index = 0; index <= labels.length - 2; index += 1) {
        lookupCandidates.push(labels.slice(index).join('.'));
    }

    let lastErrorCode: string | null = null;

    for (const lookupHost of lookupCandidates) {
        try {
            const records = await withTimeout(dns.resolveNs(lookupHost), DNS_LOOKUP_TIMEOUT_MS);
            const nameservers = Array.from(new Set(
                records
                    .map((record) => normalizeNameserver(record))
                    .filter((record) => record.length > 0),
            ));

            if (nameservers.length > 0) {
                return {
                    lookupHost,
                    nameservers,
                    code: null,
                };
            }

            lastErrorCode = 'NS_RECORDS_EMPTY';
        } catch (error: unknown) {
            const nodeError = error as NodeJS.ErrnoException;
            lastErrorCode = typeof nodeError?.code === 'string' ? nodeError.code.toUpperCase() : 'DNS_LOOKUP_FAILED';
        }
    }

    return {
        lookupHost: lookupCandidates[0] || hostname,
        nameservers: [],
        code: lastErrorCode || 'DNS_LOOKUP_FAILED',
    };
}

export async function checkCustomDomainNameservers(
    domain: string,
    requiredNameservers = REQUIRED_CUSTOM_DOMAIN_NAMESERVERS,
): Promise<DomainNameserverCheckResult> {
    const hostname = normalizeDomainHost(domain);
    if (!hostname) {
        return {
            hostname: '',
            lookupHost: '',
            requiredNameservers,
            actualNameservers: [],
            missingNameservers: requiredNameservers,
            matchesRequired: false,
            code: 'INVALID_HOSTNAME',
        };
    }

    const expectedNameservers = Array.from(new Set(
        requiredNameservers
            .map((item) => normalizeNameserver(item))
            .filter((item) => item.length > 0),
    ));
    const resolved = await resolveNameservers(hostname);
    const actualNameservers = resolved.nameservers;
    const missingNameservers = expectedNameservers.filter((expected) => !actualNameservers.includes(expected));
    const matchesRequired = expectedNameservers.length > 0 && missingNameservers.length === 0;
    const code = matchesRequired ? null : (resolved.code || 'NAMESERVER_MISMATCH');

    return {
        hostname,
        lookupHost: resolved.lookupHost,
        requiredNameservers: expectedNameservers,
        actualNameservers,
        missingNameservers,
        matchesRequired,
        code,
    };
}
