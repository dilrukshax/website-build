-- Reconcile the page_templates catalog to the correct active/inactive state.
--
-- The template picker (apps/website-builder-web/components/builder/template-picker.tsx)
-- only surfaces a curated set of template IDs (VISIBLE_TEMPLATE_IDS). With the long
-- chain of re-seed/compensate migrations, the `is_active` flag can drift so the
-- curated templates are inactive (or legacy blog templates stay active), leaving the
-- picker empty even though rows exist.
--
-- This migration is non-destructive: it only fixes `is_active`. It does not rewrite
-- `sections_jsonb`, so any previously-applied template content is preserved.
-- Earlier migrations (run in order by `prisma migrate deploy`) are responsible for
-- creating the rows themselves; this migration guarantees their visibility.

-- 1) Ensure the curated, picker-visible templates are active.
UPDATE "page_templates"
SET "is_active" = true, "updated_at" = NOW()
WHERE "id" IN (
    'template-2026-clean-appointments',
    'template-2026-elegant-concierge',
    'template-2026-motion-studio',
    'template-2026-signal-horizon',
    'template-2026-acquisition-shop',
    'template-2026-fusion-growth',
    'template-2026-editorial-pulse',
    'template-2026-harmozi-vsl'
);

-- 2) Keep the other non-legacy catalog templates active so the catalog endpoint is
--    fully populated (the picker filters these out by its curated list anyway).
UPDATE "page_templates"
SET "is_active" = true, "updated_at" = NOW()
WHERE "id" IN (
    'template-2026-neon-grid-lab',
    'template-2026-prism-grid-conversion',
    'template-2026-salesforce-pipeline',
    'template-2026-velocity-vsl',
    'template-2026-aurora-atelier',
    'template-2026-spectrum-prime'
);

-- 3) Keep legacy blog-only templates hidden from the catalog.
UPDATE "page_templates"
SET "is_active" = false, "updated_at" = NOW()
WHERE "id" IN (
    'template-2026-blog-authority-hub',
    'template-2026-editorial-conversion-desk'
);
