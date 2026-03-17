# Sevalla Production Deployment Guide (Docker)
## buildmyonlineweb CMS — Multi-Tenant

This guide covers deploying your buildmyonlineweb CMS on **Sevalla** using its **Docker Image** build strategy. Since this project already has production-ready Dockerfiles for both the API backend and the CMS frontend, Sevalla can build and serve them directly without us needing to manually configure Node.js build commands!

---

## What You Need ✅

1. **Sevalla Account**: Logged into your dashboard.
2. **GitHub Connection**: Your Sevalla account connected to GitHub to access the `any-booking-system/Booking-Engine-CMS` repo.
3. **Neon DB**: Your existing Neon Postgres DB URL.
4. **Cloudflare R2**: Your R2 credentials for media storage.

---

## Step 1 — Add a Redis Database in Sevalla

The API uses Redis for caching and rate limiting. 

1. In Sevalla, go to **Databases** → **Add Database**.
2. **Database Type**: Select **Redis**.
3. **Version**: Choose 7.x.
4. **Name**: `booking-engine-redis`
5. **Region**: Choose the region closest to your users.
6. Click **Create Database**.
7. Once created, click on it and copy the **Internal Connection String** (it will look like `redis://...`). Save this for Step 2.

---

## Step 2 — Deploy the API (Backend) using Docker

We will tell Sevalla to build the API from the `apps/api/Dockerfile`.

1. Go to **Applications** → **Add Application** in Sevalla.
2. Select your GitHub repository: `any-booking-system/Booking-Engine-CMS`.
3. **Application Name**: `booking-engine-api`
4. **Build Strategy**: Expand the **Build** section and click **Update Build Strategy**.
5. Select **Dockerfile** as the builder.
   - **Dockerfile path**: `apps/api/Dockerfile`
   - **Dockerfile context**: `.`  *(This is extremely important for a monorepo, it must be just a period!)*
6. **Environment Variables**: Add all the API secrets here.
   *Note: Generating strong random secrets (e.g., use an online UUID generator).*
   ```env
   NODE_ENV=production
   PORT=3002   # The Docker container listens on 3002
   
   # Your Neon DB Connection String
   DATABASE_URL=postgresql://neondb_owner:...@ep-wild-recipe-a10mtim6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   
   # Redis connection string (copied from Step 1)
   REDIS_URL=<your-sevalla-redis-internal-url>
   
   # Domains (Wait until both apps are created to fill these out exactly, or use the temporary Sevalla URLs for now)
   API_BASE_URL=https://api.yourdomain.com
   SITE_DOMAIN=yourdomain.com
   CMS_URL=https://app.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_SITE_DOMAIN=yourdomain.com
   CORS_ORIGIN=https://app.yourdomain.com,https://*.yourdomain.com
   
   # Strong random secrets
   JWT_SECRET=generate-a-strong-random-string-here
   JWT_REFRESH_SECRET=generate-another-strong-random-string-here
   
   # R2 Cloudflare (from your dashboard)
   R2_ACCOUNT_ID=490463fcfa7f5adab53ebb65c98b4519
   R2_ACCESS_KEY_ID=<your-r2-access-key>
   R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
   R2_BUCKET_NAME=published-sites
   R2_PUBLIC_URL=https://pub-<your-bucket-hash>.r2.dev

   # Cloudflare DNS/CDN cache purge (optional but recommended)
   CLOUDFLARE_API_TOKEN=<token-with-cache-purge-permissions>
   CLOUDFLARE_ZONE_ID=<your-zone-id>
   PUBLISHED_SITES_BASE_URL=https://pub-<your-bucket-hash>.r2.dev
   ROUTING_INDEX_CURRENT_URL=https://pub-<your-bucket-hash>.r2.dev/routing-index/current.json
   ROUTING_INDEX_CACHE_TTL_MS=30000
   WEB_PROXY_SHARED_SECRET=<same-random-secret-used-in-cms>
   ```

   Cloudflare token permissions required:
   - `Zone.Cache Purge:Edit`
   - `Zone.Zone:Read`

7. **Deploy the Application**. Note the generated Sevalla URL for the API (e.g., `booking-engine-api-abc.sevalla.app`).

### Run Database Migrations
Before the API can work, the database schema needs to be initialized.
1. In the Sevalla dashboard for `booking-engine-api`, go to the **Console** or **Terminal** tab.
2. Run this command to apply migrations to your Neon database:
   ```bash
   cd packages/database && npx prisma migrate deploy
   ```

---

## Step 3 — Deploy the CMS (Frontend) using Docker

We will now do the exact same thing for the frontend, pointing it to the CMS Dockerfile.

1. Go to **Applications** → **Add Application** again.
2. Select your repository: `any-booking-system/Booking-Engine-CMS`.
3. **Application Name**: `booking-engine-cms`
4. **Build Strategy**: Expand the **Build** section and click **Update Build Strategy**.
5. Select **Dockerfile** as the builder.
   - **Dockerfile path**: `apps/cms/Dockerfile`
   - **Dockerfile context**: `.`  *(Must be a single period!)*
6. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3001   # The Docker container listens on 3001
   
   # Point this to the API URL Sevalla generated in Step 2:
   NEXT_PUBLIC_API_URL=https://booking-engine-api-abc.sevalla.app
   WEB_PROXY_SHARED_SECRET=<same-random-secret-used-in-api>
   ```
7. **Deploy the Application**. Note the generated Sevalla URL for the CMS.

---

## Step 4 — Update Environment Variables and CORS

Now that you have both the API and the CMS running from their Docker containers and you know their Sevalla URLs, go back to the **API Application's Environment Variables** in Sevalla and ensure `CORS_ORIGIN` and `CMS_URL` whitelist the new CMS URL:

```env
CMS_URL=https://booking-engine-cms-xyz.sevalla.app
CORS_ORIGIN=https://booking-engine-cms-xyz.sevalla.app
API_BASE_URL=https://booking-engine-api-abc.sevalla.app
SITE_DOMAIN=yourdomain.com
WEB_PROXY_SHARED_SECRET=<same-random-secret-used-in-cms>
```
*(Restart the API application if you changed the variables).*

---

## Step 5 — Configure Custom Domains (Optional)

If you want to use custom domains (like `app.yourdomain.com` and `api.yourdomain.com`):

1. In the Sevalla dashboard for the **API** app, go to **Domains** and add `api.yourdomain.com`.
2. In the Sevalla dashboard for the **CMS** app, go to **Domains** and add `app.yourdomain.com` AND `*.yourdomain.com` (for the wildcard feature).
3. Sevalla will give you DNS instructions (usually a `CNAME` or `A` record). 
4. Log in to Cloudflare, go to DNS, and add those records pointing to Sevalla.
5. Update your `CORS_ORIGIN`, `API_BASE_URL`, and `NEXT_PUBLIC_API_URL` environment variables in both Sevalla apps to match your new real domain.

---

## Step 6 — Test Subdomain Preview
Your webites will use the `/preview/` route to test what you published.

Visit:
`https://booking-engine-cms-xyz.sevalla.app/preview/mysalon` 
*(or whatever URL Sevalla gave your frontend CMS app)*. It resolves host mappings from CDN routing index and loads manifests from R2/CDN artifacts.

---

## Step 7 — Routing Index + Domain Routes

After deploying migrations and API:

1. Add domain route mappings using `PUT /cms/instances/:id/domain-route`.
2. Publish at least one version of each website to generate manifest artifacts.
3. Trigger `POST /cms/superadmin/routing-index/rebuild` to refresh `routing-index/current.json`.
4. Verify `https://<customer-host>` rewrites to the expected instance preview.
   - public widgets should call `https://<customer-host>/web/*` (same-origin CMS proxy).
   - CMS proxy forwards trusted host headers to API `/web/*` for routing-index based tenant/instance resolution.
5. Keep hosting-platform TLS/certificate onboarding for customer domains outside this app flow.
