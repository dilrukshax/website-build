import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from './lib/env';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PUBLIC_PATHS = ['/preview', '/web', '/routing-index', '/published', '/api'];
const ONBOARDING_PATHS = ['/onboarding'];

const ROOT_DOMAIN = env.siteDomain() || 'buildmyonlineweb.site';
const CMS_PLATFORM_URL = env.cmsUrl();
const API_PLATFORM_URL = env.apiBaseUrl();
const PLATFORM_HOST_BYPASS = env.platformHostBypass();
const RESERVED_PLATFORM_SUBDOMAINS = ['staging', 'staging-api'];
const ROUTING_INDEX_CACHE_TTL_MS = env.routingIndexCacheTtlMs();
const ROUTED_HOST_SEARCH_PARAM = '__be_routed_host';

function normalizeHost(host: string | null | undefined): string {
    if (!host) {
        return '';
    }

    const trimmed = host.split(',')[0]?.trim().toLowerCase() || '';
    if (!trimmed) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        return new URL(candidate).hostname.toLowerCase();
    } catch {
        return '';
    }
}

function normalizeBaseUrl(input: string | null | undefined): string {
    const value = (input || '').trim();
    if (!value) {
        return '';
    }

    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
        const parsed = new URL(withProtocol);
        return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
    } catch {
        return '';
    }
}

function parseHostList(input: string | null | undefined): string[] {
    if (!input) {
        return [];
    }

    return input
        .split(',')
        .map((value) => normalizeHost(value))
        .filter(Boolean);
}

function addHostWithVariants(hosts: Set<string>, host: string): void {
    if (!host) {
        return;
    }

    hosts.add(host);

    if (host.startsWith('www.')) {
        const apex = host.slice(4);
        if (apex) {
            hosts.add(apex);
        }
        return;
    }

    hosts.add(`www.${host}`);
}

function addReservedPlatformSubdomainHosts(hosts: Set<string>, rootDomain: string): void {
    if (!rootDomain) {
        return;
    }

    for (const subdomain of RESERVED_PLATFORM_SUBDOMAINS) {
        addHostWithVariants(hosts, `${subdomain}.${rootDomain}`);
    }
}

function resolvePlatformBypassHosts(): Set<string> {
    const hosts = new Set<string>();
    const normalizedRootDomain = normalizeHost(ROOT_DOMAIN);
    const configuredHosts = [
        normalizeHost(CMS_PLATFORM_URL),
        normalizeHost(API_PLATFORM_URL),
        ...parseHostList(PLATFORM_HOST_BYPASS),
    ];

    for (const host of configuredHosts) {
        addHostWithVariants(hosts, host);
    }

    addReservedPlatformSubdomainHosts(hosts, normalizedRootDomain);

    return hosts;
}

function isPlatformBypassHost(hostname: string): boolean {
    if (!hostname) {
        return false;
    }

    return resolvePlatformBypassHosts().has(hostname);
}

function isLocalDevelopmentHost(hostname: string): boolean {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname.endsWith('.localhost')
    );
}

function buildPreviewRewriteUrl(request: NextRequest, subdomain: string): URL {
    const rewriteUrl = request.nextUrl.clone();
    let pathname = request.nextUrl.pathname;

    // Rewrite /blog/<slug>.md → /blog/<slug>/markdown so the markdown route handler
    // lives at a non-conflicting path inside [slug]/ and does not shadow [slug]/page.tsx.
    const blogMdMatch = pathname.match(/^(\/blog\/)([\w-]+)\.md$/);
    if (blogMdMatch) {
        pathname = `${blogMdMatch[1]}${blogMdMatch[2]}/markdown`;
    }

    rewriteUrl.pathname = `/preview/${subdomain}${pathname === '/' ? '' : pathname}`;
    return rewriteUrl;
}

function rewritePublishedHostRequest(request: NextRequest, subdomain: string, hostname: string): NextResponse {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-routed-host', hostname);
    requestHeaders.set('x-forwarded-host', hostname);
    const rewriteUrl = buildPreviewRewriteUrl(request, subdomain);
    rewriteUrl.searchParams.set(ROUTED_HOST_SEARCH_PARAM, hostname);

    return NextResponse.rewrite(rewriteUrl, {
        request: {
            headers: requestHeaders,
        },
    });
}

interface RoutingIndexEntry {
    instanceId: string;
    tenantId: string;
    subdomain: string;
    manifestUrl: string | null;
    active: boolean;
}

interface RoutingIndexDocument {
    version: string;
    generatedAt: string;
    hosts: Record<string, RoutingIndexEntry>;
}

interface RoutingIndexPointer {
    version: string;
    generatedAt: string;
    indexKey: string;
    indexUrl: string | null;
}

type CachedRoutingIndex = {
    expiresAt: number;
    index: RoutingIndexDocument;
};

let cachedRoutingIndex: CachedRoutingIndex | null = null;

function resolvePublishedBaseUrl(): string {
    return normalizeBaseUrl(
        env.publishedSitesBaseUrl()
        || process.env.R2_PUBLIC_URL
        || ''
    );
}

function resolveCurrentIndexUrl(): string {
    const explicit = env.routingIndexCurrentUrl();
    if (explicit) {
        return explicit;
    }

    const base = resolvePublishedBaseUrl();
    return base ? `${base}/routing-index/current.json` : '';
}

function resolveVersionIndexUrl(pointer: RoutingIndexPointer): string {
    if (pointer.indexUrl) {
        return pointer.indexUrl;
    }

    const base = resolvePublishedBaseUrl();
    if (!base || !pointer.indexKey) {
        return '';
    }

    return `${base}/${pointer.indexKey.replace(/^\/+/, '')}`;
}

function buildHostCandidates(hostname: string): string[] {
    const normalized = normalizeHost(hostname);
    if (!normalized) {
        return [];
    }

    if (normalized.startsWith('www.')) {
        const apex = normalized.slice(4);
        return apex ? [normalized, apex] : [normalized];
    }

    return [normalized, `www.${normalized}`];
}

async function loadRoutingIndex(): Promise<RoutingIndexDocument | null> {
    const now = Date.now();
    if (cachedRoutingIndex && cachedRoutingIndex.expiresAt > now) {
        return cachedRoutingIndex.index;
    }

    const currentUrl = resolveCurrentIndexUrl();
    if (!currentUrl) {
        return null;
    }

    try {
        const pointerResponse = await fetch(currentUrl, {
            method: 'GET',
            cache: 'no-store',
        });

        if (!pointerResponse.ok) {
            return null;
        }

        const pointer = await pointerResponse.json() as RoutingIndexPointer;
        const versionUrl = resolveVersionIndexUrl(pointer);
        if (!versionUrl) {
            return null;
        }

        const indexResponse = await fetch(versionUrl, {
            method: 'GET',
            cache: 'no-store',
        });

        if (!indexResponse.ok) {
            return null;
        }

        const index = await indexResponse.json() as RoutingIndexDocument;
        cachedRoutingIndex = {
            expiresAt: now + ROUTING_INDEX_CACHE_TTL_MS,
            index,
        };

        return index;
    } catch {
        return null;
    }
}

async function resolveSubdomainFromHost(hostname: string): Promise<string | null> {
    const index = await loadRoutingIndex();
    if (!index) {
        return null;
    }

    const candidates = buildHostCandidates(hostname);
    for (const candidate of candidates) {
        const entry = index.hosts[candidate];
        if (entry?.active && entry.subdomain) {
            return entry.subdomain;
        }
    }

    return null;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = normalizeHost(request.headers.get('host'));
    const rootDomain = normalizeHost(ROOT_DOMAIN);

    const isWebProxyPath = pathname === '/web' || pathname.startsWith('/web/');
    const isPreviewPath = pathname === '/preview' || pathname.startsWith('/preview/');
    const isRoutingIndexPath = pathname === '/routing-index' || pathname.startsWith('/routing-index/');
    const isPublishedProxyPath = pathname === '/published' || pathname.startsWith('/published/');
    const isApiProxyPath = pathname === '/api' || pathname.startsWith('/api/');

    const isPublishedHostCandidate =
        Boolean(hostname && rootDomain) &&
        hostname !== rootDomain &&
        hostname !== `www.${rootDomain}` &&
        !isPlatformBypassHost(hostname) &&
        !isLocalDevelopmentHost(hostname);

    if (isPublishedHostCandidate && !isWebProxyPath && !isPreviewPath && !isRoutingIndexPath && !isPublishedProxyPath && !isApiProxyPath) {
        const resolvedSubdomain = await resolveSubdomainFromHost(hostname);
        if (resolvedSubdomain) {
            return rewritePublishedHostRequest(request, resolvedSubdomain, hostname);
        }

        // If no host mapping exists yet, keep normal CMS routing instead of forcing a preview 404.
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('accessToken')?.value;

    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    const isOnboardingPath = ONBOARDING_PATHS.some((path) => pathname.startsWith(path));
    const isRoot = pathname === '/';

    if ((isAuthPath || isRoot) && accessToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!isAuthPath && !isPublicPath && !isOnboardingPath && !isRoot && !accessToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isOnboardingPath && !accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
