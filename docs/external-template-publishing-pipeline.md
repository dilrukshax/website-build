# External Template Publishing Pipeline Blueprint

Last updated: 2026-04-03

## 1. Purpose

This document defines how external teams can submit and publish website templates/themes safely in Project Aurora without breaking:

- builder editing flows
- publish/preview/runtime flows
- public booking and inquiry flows (`/web/services`, `/web/bookings`, `/web/inquiries`)
- tenant and instance isolation

It is aligned with:

- `docs/CLAUDE.md`
- `docs/website-builder-template-domain-technical-architecture.md`

## 2. Current Constraints (As-Is)

1. Theme components are React modules in `packages/themes/src/components/<feature>/vN.tsx`.
2. Registry mapping is centralized in `packages/themes/src/registry.ts`.
3. Templates are persisted in DB `page_templates.sections_jsonb` and currently seeded by Prisma migrations (not baseline `seed.ts`).
4. Publish/rollback flows are controlled by `BuilderController.publish` and `BuilderController.rollback`.
5. Public widgets depend on same-origin proxy routes to `/web/*` and routed host resolution.

## 3. Core Problem

If multiple external teams submit updates concurrently, direct edits to `registry.ts` and migration files create merge/collision risk:

- duplicate component versions (two teams both adding `hero/v7`)
- migration timestamp conflicts
- registry key conflicts
- inconsistent template-to-theme mappings

## 4. Design Principles

1. External teams do not directly edit canonical migration files.
2. External teams do not directly edit canonical registry mapping.
3. Platform assigns final component versions and writes canonical artifacts.
4. Validation returns both blockers and non-blocking suggestions.
5. Promotion to production is staged and reversible.

## 5. Recommended Submission Model

### 5.1 Submission methods

Method A (Recommended now): Git-based submission package in PR.

Method B (Future): API submission portal that writes the same package internally.

Start with Method A first because it is lower complexity and works with the existing monorepo process.

### 5.2 Submission package contract

Each external partner submits only under:

`external-submissions/<partnerSlug>/<templateSlug>/`

Required files:

- `manifest.json`
- `sections/<feature>/<name>.tsx` (no forced final `vN` in partner naming)
- `schema/<feature>.schema.json` (dynamic form schema)
- `styles/default-styles.json`
- `metadata.json` (preview image, category, tags, supported features)

External submission must not include:

- `packages/themes/src/registry.ts` edits
- `packages/database/prisma/migrations/*` edits
- direct DB migration lock changes

## 6. Example Submission

### 6.1 Example manifest

```json
{
  "submissionVersion": 1,
  "partner": {
    "id": "studio-acme",
    "name": "Studio Acme"
  },
  "template": {
    "slug": "clean-spa-landing",
    "displayName": "Clean Spa Landing",
    "changeType": "create",
    "industry": "beauty",
    "planTier": "free"
  },
  "sections": [
    {
      "feature": "header",
      "source": "sections/header/main.tsx",
      "schema": "schema/header.schema.json"
    },
    {
      "feature": "hero",
      "source": "sections/hero/main.tsx",
      "schema": "schema/hero.schema.json"
    },
    {
      "feature": "services",
      "source": "sections/services/main.tsx",
      "schema": "schema/services.schema.json"
    },
    {
      "feature": "booking-widget",
      "source": "sections/booking-widget/main.tsx",
      "schema": "schema/booking-widget.schema.json"
    },
    {
      "feature": "contact",
      "source": "sections/contact/main.tsx",
      "schema": "schema/contact.schema.json"
    },
    {
      "feature": "footer",
      "source": "sections/footer/main.tsx",
      "schema": "schema/footer.schema.json"
    }
  ],
  "tokens": {
    "primary": "#0EA5E9",
    "secondary": "#1E293B",
    "accent": "#10B981",
    "text": "#0F172A",
    "background": "#F8FAFC",
    "font": "'Manrope', sans-serif"
  },
  "metadata": {
    "previewImage": "https://cdn.example.com/previews/clean-spa-landing.png",
    "description": "High-conversion spa landing page",
    "tags": ["spa", "wellness", "booking"],
    "supports": ["dynamic-form", "booking-widget", "inquiry-form"]
  }
}
```

### 6.2 Example suggestion output from validator

```json
{
  "status": "validation_failed",
  "blocking": [
    {
      "code": "SCHEMA_REQUIRED_FIELD_MISSING",
      "path": "schema/booking-widget.schema.json",
      "message": "customer.email is required for booking submissions"
    }
  ],
  "warnings": [
    {
      "code": "TOKEN_CONTRAST_LOW",
      "path": "tokens.primary",
      "message": "Primary color contrast may fail WCAG on white text"
    }
  ],
  "suggestions": [
    {
      "code": "PREFER_SHARED_HELPERS",
      "path": "sections/booking-widget/main.tsx",
      "message": "Use shared public-web helpers to keep /web integration consistent"
    }
  ]
}
```

## 7. Backend Handling Plan

### 7.1 Validation service (new)

Create a submission validation pipeline that runs on every external PR:

1. Contract validation (required files and schema shape).
2. Component compile checks.
3. Theme token/color checks.
4. Dynamic form schema checks.
5. Template section mapping checks.
6. Runtime integration checks for `/web/services`, `/web/bookings`, `/web/inquiries`.

Validation result levels:

- `blocking`: cannot promote
- `warning`: can promote with approval
- `suggestion`: advisory improvement

### 7.2 Promotion service (new)

After validation and human approval, run a promotion job that creates canonical changes automatically:

1. Allocate final `component_key` versions (`<feature>/vN`) centrally.
2. Copy approved section source into `packages/themes/src/components/<feature>/vN.tsx`.
3. Generate registry entries (do not hand-edit).
4. Generate migration SQL for `themes` + `page_templates`.
5. Run tests and create promotion PR.

## 8. Registry Conflict Strategy

### 8.1 Target model

Keep `registry.ts` as a thin wrapper and generate `registry.generated.ts` from approved components.

- deterministic key ordering
- deterministic import ordering
- no manual key conflict resolution

### 8.2 Why this solves second-submission conflicts

If two approved submissions both add hero sections:

- allocator assigns next available versions in promotion order
- generator rewrites registry deterministically
- second promotion rebases on latest generated registry

No external contributor edits canonical registry directly.

## 9. Migration Conflict Strategy

### 9.1 Rules

1. External PRs do not include Prisma migration files.
2. Promotion job creates migrations only after approval.
3. Promotion jobs are serialized (single queue).
4. SQL is idempotent where possible (`ON CONFLICT DO UPDATE`).

### 9.2 Migration content

Generated migration inserts/updates:

- `themes` rows (`component_key`, `schema_jsonb`, `default_styles_jsonb`, `access_rank`, `is_active`)
- `page_templates` rows (`sections_jsonb`, metadata)

### 9.3 Serialization options

Use one of:

1. CI concurrency group (single promotion workflow at a time).
2. DB advisory lock in promotion script.
3. Queue worker with one consumer.

## 10. Testing Matrix (Mandatory Before Publish)

### 10.1 Baseline

- `pnpm lint`
- `pnpm build`
- `pnpm --filter @project-aurora/website-builder-api test`
- `pnpm --filter @project-aurora/website-builder-web test`

### 10.2 Template-specific functional checks

1. Apply template (`POST /cms/pages/:id/apply-template`) succeeds.
2. Header/footer preservation behavior remains correct.
3. Builder dynamic form renders from `schema_jsonb`.
4. Token updates (color palette/font) propagate into settings and render output.
5. Publish succeeds (`POST /cms/builder/publish`) and artifacts are produced.
6. Preview loads published artifacts (not drafts).
7. Rollback (`POST /cms/builder/rollback`) restores previous version.

### 10.3 Public service continuity checks

1. `/web/services` returns scoped services.
2. `/web/bookings` creates booking and customer linking still works.
3. `/web/inquiries` creates inquiry and customer linking still works.
4. Routed-host and proxy-secret behavior remains valid.

## 11. Suggested Implementation Phases

### Phase 1: Repo-first pipeline (recommended first)

Scope:

- submission package contract
- CI validator
- manual internal promotion script
- staging smoke tests

Complexity: Medium

### Phase 2: Automated promotion

Scope:

- version allocator service
- registry/migration generation
- serialized promotion queue

Complexity: High

### Phase 3: External submission portal

Scope:

- API-based intake
- submission status UI
- reviewer workflow UI

Complexity: High

## 12. Limitations and Tradeoffs

1. Serialized promotion reduces throughput but prevents migration corruption.
2. External teams do not get instant self-serve production publish.
3. Arbitrary React from external parties is high risk; require code/security review.
4. Initial setup adds tooling overhead (validator + generator + queue).
5. Generated registry/migrations reduce flexibility for manual hotfix editing.

## 13. Complexity Summary

| Area | Complexity | Why |
|---|---|---|
| Submission contract | Low | Mostly file and schema standards |
| Validator implementation | Medium | Multiple rule types and test hooks |
| Registry generation | Medium | Deterministic code generation |
| Migration generation | High | Versioning and idempotent SQL correctness |
| Concurrent promotion control | High | Queueing/locking and re-run safety |
| End-to-end runtime testing | Medium | Needs seeded/staging environment |

## 14. Definition of Done for External Template Publish

A submission is done only when all are true:

1. Validation has zero blocking findings.
2. Registry and migration are generated by promotion job.
3. Staging publish + smoke tests pass.
4. Public booking/services/inquiry checks pass.
5. Rollback scenario is verified.
6. Documentation is updated for new template catalog entry.

## 15. Recommended Next Actions

1. Approve this contract and choose Method A (Git-based) as initial launch model.
2. Implement `scripts/validate-external-template-submission.ts`.
3. Implement `scripts/promote-approved-template.ts` with serialized promotion.
4. Add CI workflow for validation + staging smoke checks.
5. Add generated registry pattern (`registry.generated.ts`) to remove manual conflicts.
