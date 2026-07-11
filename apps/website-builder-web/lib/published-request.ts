import { isCmsHost, normalizeHost, resolveRoutedRequestHost } from './published-site';

export const ROUTED_HOST_SEARCH_PARAM = '__be_routed_host';

export type RouteSearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(searchParams: RouteSearchParams | undefined, key: string): string | null {
    const value = searchParams?.[key];
    if (Array.isArray(value)) {
        return value[0] || null;
    }
    return value || null;
}

export function resolvePublishedRouteRequest(input: {
    headers: { get(name: string): string | null };
    searchParams?: RouteSearchParams;
}): {
    headerHost: string;
    routeHost: string;
    isPublishedHostRewrite: boolean;
    shouldRenderPageBodySlots: boolean;
} {
    const headerHost = resolveRoutedRequestHost(input.headers);
    const routedHost = normalizeHost(readSearchParam(input.searchParams, ROUTED_HOST_SEARCH_PARAM));
    const routeHost = routedHost || headerHost;

    return {
        headerHost,
        routeHost,
        isPublishedHostRewrite: Boolean(routedHost),
        shouldRenderPageBodySlots: isCmsHost(headerHost),
    };
}
