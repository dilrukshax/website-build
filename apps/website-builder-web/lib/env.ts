/**
 * Central environment resolution for the CMS (website-builder-web) app.
 *
 * Each concern has ONE canonical variable name (the single source of truth).
 * Legacy alias names are retained ONLY as silent fallbacks so existing
 * deployments keep working; new deployments should set the canonical name
 * only — see AGENTS.md "Environment Variables Reference".
 */

function firstDefined(...values: Array<string | undefined>): string {
    for (const value of values) {
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return '';
}

function parsePositiveIntegerOr(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const env = {
    /** API origin (server-side only). Canonical: WEBSITE_BUILDER_API_URL */
    apiBaseUrl(): string {
        return firstDefined(
            process.env.WEBSITE_BUILDER_API_URL,
            process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_URL,
            process.env.NEXT_PUBLIC_API_URL,
            process.env.API_BASE_URL,
        );
    },

    /** CMS/web origin (server-side only). Canonical: WEBSITE_BUILDER_WEB_URL */
    cmsUrl(): string {
        return firstDefined(
            process.env.WEBSITE_BUILDER_WEB_URL,
            process.env.CMS_URL,
            process.env.NEXT_PUBLIC_CMS_URL,
        );
    },

    /** Root domain. Canonical: SITE_DOMAIN (auto-exposes NEXT_PUBLIC_SITE_DOMAIN). */
    siteDomain(): string {
        return firstDefined(process.env.SITE_DOMAIN, process.env.NEXT_PUBLIC_SITE_DOMAIN);
    },

    /** Published-site artifact base URL. Canonical: PUBLISHED_SITES_BASE_URL */
    publishedSitesBaseUrl(): string {
        return firstDefined(
            process.env.PUBLISHED_SITES_BASE_URL,
            process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL,
        );
    },

    /** Routing-index pointer URL. Canonical: ROUTING_INDEX_CURRENT_URL */
    routingIndexCurrentUrl(): string {
        return firstDefined(
            process.env.ROUTING_INDEX_CURRENT_URL,
            process.env.NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL,
        );
    },

    /** Routing-index cache TTL (ms). Canonical: ROUTING_INDEX_CACHE_TTL_MS */
    routingIndexCacheTtlMs(fallback = 30_000): number {
        const raw = firstDefined(
            process.env.ROUTING_INDEX_CACHE_TTL_MS,
            process.env.NEXT_PUBLIC_ROUTING_INDEX_CACHE_TTL_MS,
        );
        return raw ? parsePositiveIntegerOr(raw, fallback) : fallback;
    },

    /** Hosts that must never be treated as tenant/published hosts. Canonical: PLATFORM_HOST_BYPASS */
    platformHostBypass(): string {
        return firstDefined(
            process.env.PLATFORM_HOST_BYPASS,
            process.env.NEXT_PUBLIC_PLATFORM_HOST_BYPASS,
        );
    },

    /** Shared secret between CMS /web proxy and API /web host resolver. Canonical: WEB_PROXY_SHARED_SECRET */
    webProxySharedSecret(): string {
        return (process.env.WEB_PROXY_SHARED_SECRET || '').trim();
    },
};
