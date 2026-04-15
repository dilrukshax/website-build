# buildmyonlineweb CMS - CDN Routing Index Runbook

This runbook documents the provider-agnostic domain routing model for manual DNS and CDN index routing.

## 1) Architecture Overview

- Runtime host resolution uses a CDN-hosted routing index:
  - `routing-index/v-{timestamp}.json` (immutable)
  - `routing-index/current.json` (pointer)
- Runtime preview rendering uses CDN artifacts only:
  - `sites/{instanceId}/v{version}/manifest.json`
  - `sites/{instanceId}/current.json` (pointer)
- Public runtime request path:
  - `customer-domain -> CMS middleware rewrite (/preview/{subdomain})`
  - `theme widgets -> CMS /web proxy -> API /web`
  - `API /web resolves host via routing index -> tenant/instance context`
- Cloudflare is used for DNS/CDN proxy and optional cache purge only.
- Customer TLS certificates are handled by hosting platform/domain provider.

## 2) Domain Route APIs

- `PUT /cms/instances/:id/domain-route`
  - body: `{ host, active, isPrimary }`
- `DELETE /cms/instances/:id/domain-route/:host`
- `POST /cms/superadmin/routing-index/rebuild`

## 3) Publish Flow

- Publishing writes immutable manifest artifact to R2.
- API updates instance pointer file (`sites/{instanceId}/current.json`).
- API rebuilds and republishes routing index.
- API purges Cloudflare cache for routing index pointer and affected hosts.

## 4) Required Environment Variables

- `R2_ENDPOINT` or `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` (or `PUBLISHED_SITES_BASE_URL`)
- `CLOUDFLARE_API_TOKEN` (optional for purge)
- `CLOUDFLARE_ZONE_ID` (optional for purge)

Optional routing-index URLs/cache tuning:

- `PUBLISHED_SITES_BASE_URL`
- `ROUTING_INDEX_CURRENT_URL`
- `ROUTING_INDEX_CACHE_TTL_MS`
- `PUBLISHED_SITES_PRUNE_OLD_VERSIONS` (optional, default `true`)
- `WEB_PROXY_SHARED_SECRET` (same value in API and CMS runtimes)
- `NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL`
- `NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL`
- `NEXT_PUBLIC_ROUTING_INDEX_CACHE_TTL_MS`

## 5) Operational Checklist

1. Configure R2 bucket and public CDN/base URL.
2. Deploy database migration for `domain_routes`.
3. Deploy API and CMS.
4. Add/update domain routes via `/domain-route` endpoint.
5. Publish website and verify `routing-index/current.json` updates.
6. Validate custom host resolves to `/preview/{subdomain}` with CDN index lookup.

## 6) Troubleshooting

- `Site not found` on custom domain:
  - verify host exists and is active in `domain_routes`.
  - run `POST /cms/superadmin/routing-index/rebuild`.
- Preview loads but no content:
  - verify `sites/{instanceId}/current.json` exists.
  - verify target manifest URL returns published manifest JSON.
- Stale routing:
  - trigger rebuild and ensure cache purge credentials are valid.
