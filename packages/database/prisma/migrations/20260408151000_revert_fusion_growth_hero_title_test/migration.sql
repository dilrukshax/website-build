UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        "sections_jsonb",
        '{1,defaultContent,title}',
        '"Build a storefront page that feels like a best-selling product launch."'::jsonb,
        false
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-fusion-growth';
