# buildmyonlineweb CMS

Multi-tenant SaaS booking and website management platform for service-based businesses.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **API**: Node.js + Express (TypeScript)
- **CMS**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Custom JWT (session + tenant-scoped tokens)
- **Styling**: Tailwind CSS v4

## Deployment Guides

- AWS EC2 (single instance): `docs/AWS_DEPLOYMENT.md`
- AWS environment template: `.env.aws.example`

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
API_PORT=3002
API_BASE_URL=http://localhost:3002
SITE_DOMAIN=buildmyonlineweb.site
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
NEXT_PUBLIC_FINGERPRINT_ENABLED=true
FINGERPRINT_ENABLED=true
FINGERPRINT_MODE=log
DEVICE_CHECK_RATE_LIMIT_PER_MIN=10
IPINFO_TOKEN=
```

`SITE_DOMAIN` is used by the API to persist each instance primary full domain (`{subdomain}.{SITE_DOMAIN}`), and `NEXT_PUBLIC_SITE_DOMAIN` is used by the CMS to render subdomain domain suffixes in UI. `WEB_PROXY_SHARED_SECRET` must match in API + CMS runtimes for trusted `/web` host routing. `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` are optional and used only for CDN cache purge operations.

> **Note**: If your database password contains special characters like `@`, URL-encode them (e.g., `@` becomes `%40`).

### 2. Database package `.env`

Prisma needs its own `.env` file next to the schema:

```bash
# Create file: packages/database/.env
```

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/booking_engine
```

### 3. CMS `.env.local`

Next.js loads environment variables from its own directory:

```bash
# Create file: apps/cms/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_SITE_DOMAIN=buildmyonlineweb.site
NEXT_PUBLIC_PUBLISHER_TAGLINE=Built Your Website with My Online Web
NEXT_PUBLIC_PUBLISHER_URL=https://buildmyonlineweb.site
WEB_PROXY_SHARED_SECRET=replace-with-a-strong-shared-secret
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

Optional: preserve additional users with `DB_CLEANUP_KEEP_EMAILS` in `.env`
(comma-separated), or pass `--keep-email=<email>`.

### 6. Build packages (in order)

Packages must be built in dependency order:

```bash
pnpm --filter @booking-engine/core build
pnpm --filter @booking-engine/database build
pnpm --filter @booking-engine/auth build
```

---

## Running the Project

### Start API server

```bash
pnpm --filter @booking-engine/api dev
```

### Start CMS frontend

```bash
pnpm --filter @booking-engine/cms dev
```

> Run each command in a separate terminal window.

---

## Application Links

| Service | URL | Description |
|---------|-----|-------------|
| CMS Panel | http://localhost:3001 | Admin dashboard (Next.js) |
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
pnpm --filter @booking-engine/core build
pnpm --filter @booking-engine/database build
pnpm --filter @booking-engine/auth build

# 5. Start servers (each in separate terminal)
pnpm --filter @booking-engine/api dev       # API  → http://localhost:3002
pnpm --filter @booking-engine/cms dev       # CMS  → http://localhost:3001
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

### CMS — Instances (`/cms/instances`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/instances` | Auth only | List user's business instances |
| POST | `/cms/instances` | Auth only | Create new instance |
| GET | `/cms/instances/:id` | Auth only | Get instance details |
| PUT | `/cms/instances/:id` | Owner only | Update instance |
| DELETE | `/cms/instances/:id` | Owner only | Deactivate instance |
| PUT | `/cms/instances/:id/domain-route` | Auth only | Map host route to an instance |
| DELETE | `/cms/instances/:id/domain-route/:host` | Auth only | Remove mapped host route |

### CMS — Roles (`/cms/roles`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/roles` | `roles.view` | List all roles |
| POST | `/cms/roles` | `roles.create` | Create custom role |
| GET | `/cms/roles/:id` | `roles.view` | Get role details |
| PUT | `/cms/roles/:id` | `roles.update` | Update role and permissions |
| DELETE | `/cms/roles/:id` | `roles.delete` | Delete custom role |

### CMS — Staff (`/cms/staff`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/staff` | `staff.view` | List staff members |
| POST | `/cms/staff` | `staff.create` | Add staff member |
| GET | `/cms/staff/:id` | `staff.view` | Get staff details |
| PUT | `/cms/staff/:id` | `staff.update` | Update staff role/status |
| DELETE | `/cms/staff/:id` | `staff.delete` | Remove staff member |

### CMS — Permissions (`/cms/permissions`)

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cms/permissions` | Auth required | List all permissions by module |

### CMS — Other Routes

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

1. Open the **CMS** at http://localhost:3001
2. You'll be redirected to the **Register** page
3. **Register** with your email, password, full name, business name, and subdomain
4. After registration you'll land on the **Dashboard**
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
│   ├── api/                  # Express API server (port 3002)
│   │   └── src/
│   │       ├── controllers/  # Route handlers
│   │       ├── middleware/    # Auth, tenant, error handling
│   │       ├── routes/       # Route definitions (cms/, web/, auth/)
│   │       └── validators/   # Zod request validation
│   │
│   └── cms/                  # Next.js CMS panel (port 3001)
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

Ensure `apps/cms/postcss.config.js` uses `@tailwindcss/postcss` (not `tailwindcss` directly):

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### CMS can't reach the API

Ensure `apps/cms/.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```
