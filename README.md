# Aurora — SaaS Booking & Website Builder

![Aurora Website Builder](docs/images/screenshot.png)

Aurora is a modern, production-ready multi-tenant SaaS website builder and booking platform designed for service-based businesses. It enables users to create beautiful websites, manage blog content, accept online bookings/inquiries, and go live on their own custom domains.

---

## Key Features

- **Multi-Tenancy**: Complete isolation of organizations (tenants) and website instances.
- **Visual Section Builder**: Edit pages using schema-driven sections, theme component layouts, and customize styles with background and text color controls.
- **TipTap Blog Editor**: A rich Word-style blog editor with auto-saving, draft/publish workflows, and built-in SEO metadata and OG image controls.
- **Booking Engine**: Integrated customer booking calendar, booking slots, stats, and automatic customer profile creation.
- **Role-Based Access Control (RBAC)**: Define custom staff roles and assign granular permissions across 7 system modules.
- **Static Website Publishing**: Publishes website manifests to Cloudflare R2 / S3-compatible object storage.
- **Custom Domain Routing**: Resolve custom domains and subdomains dynamically, including nameserver validation and CDN cache purging.
- **Device Fingerprinting**: Fraud risk scoring for bookings and referrals.

---

## System Architecture

```mermaid
flowchart TD
    U["CMS User / Team"] --> Web["apps/website-builder-web (Next.js Dashboard)"]
    V["Public Visitors"] --> Web
    Web --> API["apps/website-builder-api (Express API)"]
    API --> DB["PostgreSQL via Prisma"]
    API --> R2["Cloudflare R2 / S3 Storage"]
    API --> CF["Cloudflare Cache Purge APIs"]
    Web --> R2
```

1. **Dashboard & Visual Builder (`apps/website-builder-web`)**:
   - Built on Next.js 14 utilizing the App Router.
   - Serves as the dashboard (admin interface) for tenant organizations to manage booking workflows, staff roles, and services.
   - Provides a visual page builder interface that syncs layouts and page content sections.

2. **Backend REST API (`apps/website-builder-api`)**:
   - An Express.js server written in TypeScript.
   - Handles core business logic, including authentication, role-based permission enforcement, booking schedules, referral workflows, and device checking.

3. **Data Scoping & Security**:
   - Powered by PostgreSQL and Prisma ORM.
   - Implements strict tenant (organization) and instance (website) isolation.
   - Utilizes a two-level JWT scheme: a session-level token for user authentication, and a tenant-scoped token for workspace actions.

4. **Static Site Publishing & Routing**:
   - Publishing builds a static JSON manifest of pages and uploads it to Cloudflare R2 / S3-compatible storage.
   - Dynamic domain routing index matches incoming hosts (subdomains or custom domains) and serves the pages using theme components from `@project-aurora/themes`.

---

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **API**: Node.js + Express (TypeScript)
- **Frontend / Website Builder**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Custom JWT (session + tenant-scoped tokens)
- **Styling**: Tailwind CSS v4

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) running locally
- [pnpm](https://pnpm.io/) package manager

```bash
npm install -g pnpm
```

---

## Environment Setup

### 1. Root `.env`

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Key variables:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/booking_engine
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
NEXT_PUBLIC_AUTH_IDLE_TIMEOUT_MINUTES=30
API_PORT=3002
API_BASE_URL=http://localhost:3002
SITE_DOMAIN=buildmyonlineweb.site
PLATFORM_HOST_BYPASS=
CMS_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
NEXT_PUBLIC_SITE_DOMAIN=buildmyonlineweb.site
NEXT_PUBLIC_PUBLISHER_TAGLINE=Built Your Website with My Online Web
NEXT_PUBLIC_PUBLISHER_URL=https://buildmyonlineweb.site
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
R2_ENDPOINT=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
PUBLISHED_SITES_BASE_URL=
ROUTING_INDEX_CURRENT_URL=
ROUTING_INDEX_CACHE_TTL_MS=30000
WEB_PROXY_SHARED_SECRET=
NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL=
NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL=
NEXT_PUBLIC_ROUTING_INDEX_CACHE_TTL_MS=30000
NEXT_PUBLIC_PLATFORM_HOST_BYPASS=
NEXT_PUBLIC_FINGERPRINT_ENABLED=true
FINGERPRINT_ENABLED=true
FINGERPRINT_MODE=log
DEVICE_CHECK_RATE_LIMIT_PER_MIN=10
IPINFO_TOKEN=
```

`SITE_DOMAIN` is used by the API to persist each instance primary full domain (`{subdomain}.{SITE_DOMAIN}`), and `NEXT_PUBLIC_SITE_DOMAIN` is used by the Website Builder Web App to render subdomain suffixes in the UI. `PLATFORM_HOST_BYPASS` (and optional `NEXT_PUBLIC_PLATFORM_HOST_BYPASS`) lets you reserve platform hosts (for example `staging.buildmyonlineweb.site,staging-api.buildmyonlineweb.site`) so they are never treated as tenant published hosts. By default, `staging.{SITE_DOMAIN}` and `staging-api.{SITE_DOMAIN}` are already treated as reserved platform hosts. `WEB_PROXY_SHARED_SECRET` must match in the API and Website Builder Web runtimes for trusted `/web` host routing. `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` are optional and used only for CDN cache purge operations.

> **Note**: If your database password contains special characters like `@`, URL-encode them (e.g., `@` becomes `%40`).

### 2. Database package `.env`

Prisma needs its own `.env` file next to the schema:

```bash
# Create file: packages/database/.env
```

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/booking_engine
```

### 3. Website Builder Web `.env.local`

Next.js loads environment variables from its own directory:

```bash
# Create file: apps/website-builder-web/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_SITE_DOMAIN=buildmyonlineweb.site
NEXT_PUBLIC_PUBLISHER_TAGLINE=Built Your Website with My Online Web
NEXT_PUBLIC_PUBLISHER_URL=https://buildmyonlineweb.site
WEB_PROXY_SHARED_SECRET=replace-with-a-strong-shared-secret
NEXT_PUBLIC_PLATFORM_HOST_BYPASS=
```

---

## Installation & Setup

Run all commands from the project root.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Generate Prisma client

```bash
cd packages/database && npx prisma generate && cd ../..
```

### 3. Push database schema

For first-time setup:

```bash
cd packages/database && npx prisma db push && cd ../..
```

> If you have conflicting old data, use `--force-reset` (this wipes the database):
> ```bash
> cd packages/database && npx prisma db push --force-reset && cd ../..
> ```

### 4. Seed permissions and default roles

```bash
pnpm db:seed
```

This creates 30 system permissions across 7 modules (bookings, services, customers, inquiries, settings, staff, roles).

### 5. Cleanup non-admin user data (optional)

Dry-run (shows what will be removed while preserving admin + system template data):

```bash
pnpm db:cleanup-users
```

Execute deletion:

```bash
pnpm db:cleanup-users -- --execute
```

Optional: preserve additional users with `DB_CLEANUP_KEEP_EMAILS` in `.env` (comma-separated), or pass `--keep-email=<email>`.

### 6. Build packages (in order)

Packages must be built in dependency order:

```bash
pnpm --filter @project-aurora/core build
pnpm --filter @project-aurora/database build
pnpm --filter @project-aurora/auth build
```

---

## Running the Project

### Start API server

```bash
pnpm --filter @project-aurora/website-builder-api dev
```

### Start Website Builder Web App

```bash
pnpm --filter @project-aurora/website-builder-web dev
```

> Run each command in a separate terminal window.

---

## Application Links

| Service | URL | Description |
|---------|-----|-------------|
| Website Builder Dashboard | http://localhost:3001 | Web Admin dashboard (Next.js) |
| API Server | http://localhost:3002 | Backend API (Express) |
| API Docs (Swagger) | http://localhost:3002/docs | Interactive API documentation |
| API Spec (JSON) | http://localhost:3002/docs.json | OpenAPI JSON specification |
| Health Check | http://localhost:3002/health | API health status |

---

## Quick Start (All Commands)

```bash
# 1. Install
pnpm install

# 2. Set up environment files (see Environment Setup section above)

# 3. Database
cd packages/database && npx prisma generate && cd ../..
cd packages/database && npx prisma db push && cd ../..
pnpm db:seed

# 4. Build packages
pnpm --filter @project-aurora/core build
pnpm --filter @project-aurora/database build
pnpm --filter @project-aurora/auth build

# 5. Start servers (each in separate terminal)
pnpm --filter @project-aurora/website-builder-api dev       # API      → http://localhost:3002
pnpm --filter @project-aurora/website-builder-web dev       # Web App  → http://localhost:3001
```

---

## API Endpoints

### Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register owner + first business instance |
| POST | `/auth/login` | Public | Login with email and password |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/logout` | Required | Revoke refresh token |
| GET | `/auth/me` | Required | Get current user and tenants |
| POST | `/auth/switch-tenant` | Required | Switch active business instance |

### Website Builder — Instances (`/cms/instances`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/instances` | Auth only | List user's business instances |
| POST | `/cms/instances` | Auth only | Create new instance |
| GET | `/cms/instances/:id` | Auth only | Get instance details |
| PUT | `/cms/instances/:id` | Owner only | Update instance |
| DELETE | `/cms/instances/:id` | Owner only | Deactivate instance |
| PUT | `/cms/instances/:id/domain-route` | Auth only | Map host route to an instance |
| DELETE | `/cms/instances/:id/domain-route/:host` | Auth only | Remove mapped host route |

### Website Builder — Roles (`/cms/roles`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/roles` | `roles.view` | List all roles |
| POST | `/cms/roles` | `roles.create` | Create custom role |
| GET | `/cms/roles/:id` | `roles.view` | Get role details |
| PUT | `/cms/roles/:id` | `roles.update` | Update role and permissions |
| DELETE | `/cms/roles/:id` | `roles.delete` | Delete custom role |

### Website Builder — Staff (`/cms/staff`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/staff` | `staff.view` | List staff members |
| POST | `/cms/staff` | `staff.create` | Add staff member |
| GET | `/cms/staff/:id` | `staff.view` | Get staff details |
| PUT | `/cms/staff/:id` | `staff.update` | Update staff role/status |
| DELETE | `/cms/staff/:id` | `staff.delete` | Remove staff member |

### Website Builder — Permissions (`/cms/permissions`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/permissions` | Auth required | List all permissions by module |

### Website Builder — Other Routes

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/customers` | `customers.view` | List customers |
| POST | `/cms/customers` | `customers.create` | Create customer |
| GET | `/cms/services` | `services.view` | List services |
| POST | `/cms/services` | `services.create` | Create service |
| GET | `/cms/bookings` | `bookings.view` | List bookings |
| POST | `/cms/bookings` | `bookings.create` | Create booking |
| GET | `/cms/inquiries` | `inquiries.view` | List inquiries |
| GET | `/cms/referrals/me` | Auth required | Get/create current user's referral code and stats |
| POST | `/cms/referrals/claim` | Auth required | Claim referral for the current account |

### Fraud & Device Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/device-check` | Optional | Device fingerprint risk scoring for referral abuse checks |

---

## Testing Flow

1. Open the **Website Builder Dashboard** at http://localhost:3001
2. You'll be redirected to the **Register** page
3. **Register** with your email, password, full name, business name, and subdomain
4. After registration, you'll land on the **Dashboard**
5. From the sidebar, navigate to:
   - **Instances** — view and create business instances
   - **Roles** — create custom roles with specific permissions
   - **Staff** — add team members and assign roles
6. Use the **Instance Switcher** (top of sidebar) to switch between business instances
7. **Logout** from the user menu at the bottom of the sidebar

---

## Project Structure

```
├── apps/
│   ├── website-builder-api/  # Express API server (port 3002)
│   │   └── src/
│   │       ├── controllers/  # Route handlers
│   │       ├── middleware/   # Auth, tenant, error handling
│   │       ├── routes/       # Route definitions (cms/, web/, auth/)
│   │       └── validators/   # Zod request validation
│   │
│   └── website-builder-web/  # Next.js Website Builder web app (port 3001)
│       ├── app/              # App Router pages
│       │   ├── login/
│       │   ├── register/
│       │   ├── forgot-password/
│       │   ├── reset-password/
│       │   └── dashboard/    # Protected dashboard pages
│       ├── components/       # Sidebar, InstanceSwitcher
│       ├── contexts/         # AuthContext provider
│       └── lib/              # API client utility
│
├── packages/
│   ├── auth/                 # JWT + password services
│   ├── core/                 # Shared types, constants, logger
│   ├── database/             # Prisma schema, client, migrations
│   └── config/               # Shared TypeScript/ESLint config
│
├── .env                      # Root environment variables
├── .env.example              # Template for .env
├── turbo.json                # Turborepo config
└── package.json              # Root workspace config
```

---

## Auth System

The platform uses a **two-level JWT** system:

1. **Session Token** — Contains `userId` and `email`. Issued on login before selecting an instance.
2. **Tenant-Scoped Token** — Contains `userId`, `email`, `tenantId`, and `role`. Issued when selecting or switching a business instance.

**RBAC** (Role-Based Access Control):
- 4 default system roles per instance: **Owner**, **Admin**, **Staff**, **Read Only**
- Custom roles can be created with any combination of 30 permissions
- Owner role bypasses all permission checks

---

## Troubleshooting

### Port already in use

If you see `EADDRINUSE` errors:

```bash
# Windows — find and kill process on a port
netstat -ano | findstr :3002
taskkill /PID <pid> /F

# macOS/Linux
lsof -i :3002
kill -9 <pid>
```

### Prisma can't find DATABASE_URL

Make sure `packages/database/.env` exists with your `DATABASE_URL`.

### CORS errors in browser

Check that `.env` has `CORS_ORIGIN` set as comma-separated origins:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

### Tailwind styles not loading

Ensure `apps/website-builder-web/postcss.config.js` uses `@tailwindcss/postcss` (not `tailwindcss` directly):

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Website Builder Web App can't reach the API

Ensure `apps/website-builder-web/.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

---

## AI Pair-Programming & Development Tools

This project has been developed, refactored, and maintained in partnership with advanced AI agent systems, primarily using:
- **Google Antigravity (Gemini)**: Utilized for visual layout builder updates, rich TipTap blog integration, sitemap generations, and multi-tenant scoping fixes.
- **Claude Code**: Utilized for architecture cleanups, package restructuring, and configuration optimizations.

