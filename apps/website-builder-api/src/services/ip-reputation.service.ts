import { IPReputationResult } from '../lib/fingerprint/types';

interface CachedResult {
    value: IPReputationResult;
    expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 2000;

const cache = new Map<string, CachedResult>();

function getFromCache(ip: string): IPReputationResult | null {
    const cached = cache.get(ip);
    if (!cached) {
        return null;
    }

    if (Date.now() > cached.expiresAt) {
        cache.delete(ip);
        return null;
    }

    return cached.value;
}

function setCache(ip: string, value: IPReputationResult): void {
    cache.set(ip, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}

async function fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`IP reputation request failed: ${response.status}`);
        }

        return response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function queryIpApi(ipAddress: string): Promise<IPReputationResult> {
    const fields = ['status', 'proxy', 'hosting', 'mobile', 'query', 'message'].join(',');
    const payload = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=${fields}`) as {
        status?: string;
        proxy?: boolean;
        hosting?: boolean;
        mobile?: boolean;
        message?: string;
    };

    if (payload.status !== 'success') {
        return {
            isProxyLike: false,
            provider: 'none',
            confidence: 'low',
            reason: payload.message || 'ip-api lookup unsuccessful',
        };
    }

    const isProxyLike = Boolean(payload.proxy || payload.hosting);

    return {
        isProxyLike,
        provider: 'ip-api',
        confidence: 'high',
        reason: isProxyLike ? 'ip-api flagged proxy/hosting' : undefined,
    };
}

async function queryIpInfo(ipAddress: string): Promise<IPReputationResult> {
    const token = process.env.IPINFO_TOKEN;
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    const payload = await fetchJson(`https://ipinfo.io/${encodeURIComponent(ipAddress)}/json${tokenQuery}`) as {
        bogon?: boolean;
        privacy?: {
            vpn?: boolean;
            proxy?: boolean;
            tor?: boolean;
            relay?: boolean;
            hosting?: boolean;
        };
    };

    if (payload.bogon) {
        return {
            isProxyLike: false,
            provider: 'none',
            confidence: 'low',
            reason: 'Bogon or private IP',
        };
    }

    const privacy = payload.privacy || {};
    const isProxyLike = Boolean(
        privacy.vpn || privacy.proxy || privacy.tor || privacy.relay || privacy.hosting,
    );

    return {
        isProxyLike,
        provider: 'ipinfo',
        confidence: 'high',
        reason: isProxyLike ? 'ipinfo privacy flags indicate proxy-like IP' : undefined,
    };
}

export class IPReputationService {
    static async check(ipAddress: string): Promise<IPReputationResult> {
        if (!ipAddress) {
            return {
                isProxyLike: false,
                provider: 'none',
                confidence: 'low',
                reason: 'Missing IP address',
            };
        }

        const cached = getFromCache(ipAddress);
        if (cached) {
            return cached;
        }

        try {
            const ipApiResult = await queryIpApi(ipAddress);
            setCache(ipAddress, ipApiResult);
            return ipApiResult;
        } catch {
            // Fall through to ipinfo
        }

        try {
            const ipInfoResult = await queryIpInfo(ipAddress);
            setCache(ipAddress, ipInfoResult);
            return ipInfoResult;
        } catch {
            const fallback: IPReputationResult = {
                isProxyLike: false,
                provider: 'none',
                confidence: 'low',
                reason: 'IP reputation providers unavailable',
            };
            setCache(ipAddress, fallback);
            return fallback;
        }
    }
}
