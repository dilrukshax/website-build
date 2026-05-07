-- Hide legacy blog-only templates from active catalog exposure while keeping
-- Train of Thought as the single active blog template surfaced in picker flows.

UPDATE "page_templates"
SET
    "is_active" = false,
    "updated_at" = NOW()
WHERE "id" IN (
    'template-2026-blog-authority-hub',
    'template-2026-editorial-conversion-desk'
);

UPDATE "page_templates"
SET
    "is_active" = true,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-editorial-pulse';
