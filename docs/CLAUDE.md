# CLAUDE.md — Master Agent Configuration
# SaaS Platform — Enterprise Multi-Tenant Booking System
# Antigravity IDE (VS Code) | Claude Sonnet 4.6

---

## PROJECT IDENTITY

You are operating inside an enterprise-grade SaaS platform project. This is a
multi-tenant, multi-instance booking and website management platform serving
service-based businesses of all types. Every decision you make must be measured
against four non-negotiables:

1. **SEO-FIRST** — Semantic HTML, JSON-LD structured data, SSR/SSG, canonical URLs, sitemaps
2. **AI-READ-FRIENDLY** — Clean content hierarchy, schema markup, descriptive alt text
3. **LIGHTNING PERFORMANCE** — Core Web Vitals baseline, minimal JS, CDN-ready, aggressive caching
4. **MOBILE-FIRST** — Responsive by default, touch-optimized, no desktop-first overrides

VIOLATION OF ANY OF THESE FOUR PILLARS IS A BLOCKER. No exceptions.

---

## AGENT ROLES IN THIS PROJECT

This project is operated by three agents in a continuous loop:

| Agent | File | Role |
|---|---|---|
| BA | `.claude/agents/ba.md` | Requirements analysis, documentation, handoff to Dev |
| DEV | `.claude/agents/dev.md` | Full stack development (UI + functional), handoff to QA |
| QA | `.claude/agents/qa.md` | Live testing, bug reporting, handoff back to BA |

**The CLIENT** (you, the human) feeds requirements to BA. The loop runs autonomously from there.

To invoke an agent, start your message with its trigger:
- `@BA` — Engage the Business Analyst
- `@DEV` — Engage the Full Stack Developer
- `@QA` — Engage the QA Tester
- `@ALL` — Broadcast context to all agents (use for architecture decisions)

---

## MONOREPO STRUCTURE (ENFORCED — DO NOT DEVIATE)

```
/
├── apps/
│   ├── api/                        ← Raw Node.js + Express (API layer)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── cms/            ← /cms/* namespace
│   │   │   │   └── web/            ← /web/* namespace
│   │   │   ├── engines/
│   │   │   │   ├── appointments/
│   │   │   │   ├── tours/
│   │   │   │   ├── on-demand/
│   │   │   │   ├── courses/
│   │   │   │   ├── events/
│   │   │   │   └── subscriptions/
│   │   │   ├── middleware/
│   │   │   │   ├── tenant.ts       ← Tenant resolution from domain/subdomain
│   │   │   │   ├── auth.ts         ← Clerk JWT verification
│   │   │   │   └── error.ts        ← Global error handler + crash reporter
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── cms/                        ← Next.js — Tenant CMS panel
│   │   ├── app/
│   │   │   ├── (auth)/             ← Clerk auth flows
│   │   │   ├── dashboard/
│   │   │   └── [instanceId]/       ← Instance-scoped routes
│   │   └── package.json
│   │
│   ├── super-admin/                ← RESERVED. Empty. Do not develop.
│   │   └── .gitkeep
│   │
│   └── themes/
│       └── theme-[name]/           ← Each theme = standalone Next.js app
│           └── package.json
│
├── packages/
│   ├── database/                   ← Prisma client + tenant middleware (CRITICAL)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── client.ts           ← Prisma client singleton
│   │   │   ├── middleware/
│   │   │   │   └── tenant-scope.ts ← ALL queries auto-scoped to tenantId
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                      ← Shared TypeScript types/interfaces
│   ├── ui/                         ← Shared component primitives
│   └── config/                     ← Shared ESLint, TS, Tailwind configs
│
├── .claude/                        ← Agent kit (this directory)
│   ├── agents/
│   ├── protocols/
│   └── schemas/
│
├── turbo.json
├── package.json
└── CLAUDE.md                       ← You are here
```

---

## TECHNOLOGY STACK (LOCKED — NO SUBSTITUTIONS WITHOUT CLIENT APPROVAL)

| Concern | Technology |
|---|---|
| Monorepo | Turborepo |
| API | Node.js + Express (raw, no frameworks) |
| Frontend | Next.js 14+ (App Router) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Clerk |
| Language | TypeScript throughout |
| Styling | Tailwind CSS |
| Multi-tenancy | Shared DB, shared schema, Prisma middleware tenant scoping |

---

## MULTI-TENANCY RULES (ABSOLUTE)

These rules apply to every agent. Any code that violates them must be rejected.

1. **Every database model** must have a `tenantId` field
2. **All queries** must flow through `packages/database/src/middleware/tenant-scope.ts`
3. **No raw SQL** that bypasses the Prisma middleware layer
4. **Tenant resolution** happens in `apps/api/src/middleware/tenant.ts` from the request domain/subdomain
5. **Feature toggles** are stored in the DB per instance — never in config files or env vars
6. **Instance switching** is available to both owners and staff via unified view with context switcher

---

## API NAMESPACE RULES (ABSOLUTE)

```
/cms/*   ← CMS panel consumers only (authenticated, staff/owner)
/web/*   ← Frontend theme consumers only (public + authenticated)
```

These namespaces must never cross-contaminate. A `/web/` route must never
require CMS-level auth. A `/cms/` route must never be publicly accessible.

---

## BOOKING ENGINES

All five engines are active simultaneously per tenant. Each tenant activates
the engines they need via feature toggles stored in the DB.

| Engine | Activation Toggle |
|---|---|
| Appointments | `engine_appointments_enabled` |
| Tours/Experiences | `engine_tours_enabled` |
| On-demand | `engine_ondemand_enabled` |
| Courses | `engine_courses_enabled` |
| Events | `engine_events_enabled` |
| Subscriptions | `engine_subscriptions_enabled` |

---

## ERROR HANDLING STANDARDS

- **API layer**: Global error middleware in `apps/api/src/middleware/error.ts`. All unhandled errors caught, logged with structured JSON, and returned as consistent error shapes.
- **CMS / Themes**: Next.js error boundaries at layout level. `error.tsx` files at every route segment.
- **Crash recovery**: Process-level crash must log to error reporting service before exit. Implement graceful shutdown.
- **Never expose stack traces** to the client in production.

---

## HANDOFF PROTOCOL

Read `.claude/protocols/handoff.md` before executing any inter-agent transfer.
All handoffs use the document schemas defined in `.claude/schemas/`.

---

## SESSION STARTUP CHECKLIST

When starting any new session, every agent must:

1. Read this `CLAUDE.md` file fully
2. Read their own agent file in `.claude/agents/`
3. Read `.claude/protocols/handoff.md`
4. Check `.claude/schemas/` for the relevant document type
5. Review the last handoff document in `.claude/handoffs/` (most recent file)
6. Then and only then — begin work