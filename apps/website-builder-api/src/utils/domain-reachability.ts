import dns from 'dns/promises';
import { normalizeDomainHost } from './domain';

const DNS_LOOKUP_TIMEOUT_MS = Number(process.env.CUSTOM_DOMAIN_DNS_LOOKUP_TIMEOUT_MS || 5000);

export interface DomainReachabilityCheck {
    hostname: string;
    reachable: boolean;
    code: string | null;
}

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

export async function checkDomainReachability(domain: string): Promise<DomainReachabilityCheck> {
    const hostname = normalizeDomainHost(domain);
    if (!hostname) {
        return {
            hostname: '',
            reachable: false,
            code: 'INVALID_HOSTNAME',
        };
    }

    try {
        const records = await withTimeout(
            dns.lookup(hostname, { all: true, verbatim: true }),
            DNS_LOOKUP_TIMEOUT_MS,
        );

        return {
            hostname,
            reachable: Array.isArray(records) && records.length > 0,
            code: null,
        };
    } catch (error: unknown) {
        const nodeError = error as NodeJS.ErrnoException;
        return {
            hostname,
            reachable: false,
            code: typeof nodeError?.code === 'string' ? nodeError.code.toUpperCase() : 'DNS_LOOKUP_FAILED',
        };
    }
}

export function buildDomainReachabilityWarning(domain: string, code?: string | null): string {
    const hostname = normalizeDomainHost(domain) || domain.trim().toLowerCase();
    const suffix = code ? ` (${code})` : '';
    return `Public DNS lookup for ${hostname} is not ready${suffix}. Add/verify this exact hostname record and wait for DNS propagation.`;
}
