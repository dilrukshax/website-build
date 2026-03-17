# buildmyonlineweb CMS - Cloudflare DNS Baseline (No Worker Flow)

This guide covers base DNS/SSL setup for API + CMS when hosted on Sevalla.

For customer-owned custom domains and CDN routing-index flow, follow:

- `docs/domain_routing_index_runbook.md`

## 1) Prerequisites

1. Root domain added to Cloudflare.
2. API and CMS deployed on Sevalla.
3. Sevalla custom domains configured for:
   - API: `api.<your-domain>`
   - CMS: root/app domain and wildcard subdomain (`*.<your-domain>`) as required by your routing model.

## 2) DNS Records in Cloudflare

Add records that point to Sevalla app hostnames.

### API

- Type: `CNAME`
- Name: `api`
- Target: `<your-api-sevalla-url>.sevalla.app`
- Proxy: Proxied (orange cloud)

### CMS Primary

- Type: `CNAME`
- Name: `@` (or `app`)
- Target: `<your-cms-sevalla-url>.sevalla.app`
- Proxy: Proxied

### Optional `www`

- Type: `CNAME`
- Name: `www`
- Target: same as CMS primary
- Proxy: Proxied

### Wildcard Subdomains

- Configure wildcard DNS/Sevalla domain routing directly for your setup.
- Do not rely on legacy Worker-based hostname rewrites for custom-domain onboarding.

## 3) SSL/TLS

- SSL/TLS mode: **Full (strict)**
- Enable **Always Use HTTPS**

## 4) API Environment Variables

Set these in the API runtime:

- `API_BASE_URL=https://api.<your-domain>`
- `CMS_URL=https://<your-cms-domain>`
- `SITE_DOMAIN=<your-domain>`
- `NEXT_PUBLIC_SITE_DOMAIN=<your-domain>`
- `CORS_ORIGIN=https://<your-cms-domain>,https://*.<your-domain>`
- `WEB_PROXY_SHARED_SECRET=<same-secret-in-api-and-cms>`

Cloudflare purge credentials (optional):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

## 5) Verification

1. `https://<cms-domain>` opens CMS.
2. `https://api.<domain>/health` (or your health endpoint) responds.
3. A tenant subdomain resolves and loads the expected instance.
4. Domain routing updates work via `/cms/instances/:id/domain-route` and the routing index rebuild endpoint.
