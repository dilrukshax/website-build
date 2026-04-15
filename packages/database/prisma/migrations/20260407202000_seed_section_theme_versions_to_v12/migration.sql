-- Seed section theme versions up to v12 for active feature slugs.
-- Creates missing versions while preserving existing rows.

WITH target_features AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN (
        'about',
        'booking-widget',
        'contact',
        'faq',
        'footer',
        'gallery',
        'header',
        'hero',
        'logos',
        'pricing',
        'product',
        'services',
        'team',
        'testimonials'
    )
),
base_themes AS (
    SELECT DISTINCT ON (t."slug")
        t."feature_id",
        t."slug",
        t."name",
        t."access_rank",
        t."schema_jsonb",
        t."default_styles_jsonb",
        t."preview_image_url"
    FROM "themes" t
    JOIN target_features f
        ON f."id" = t."feature_id"
       AND f."slug" = t."slug"
    WHERE t."is_active" = true
    ORDER BY t."slug", t."version" DESC, t."updated_at" DESC
),
target_versions AS (
    SELECT generate_series(5, 12)::int AS "version"
),
rows_to_insert AS (
    SELECT
        ('theme-' || bt."slug" || '-v' || tv."version"::text) AS "id",
        bt."feature_id",
        CASE
            WHEN trim(regexp_replace(bt."name", '\\s*v[0-9]+$', '', 'i')) = ''
                THEN initcap(replace(bt."slug", '-', ' ')) || ' v' || tv."version"::text
            ELSE trim(regexp_replace(bt."name", '\\s*v[0-9]+$', '', 'i')) || ' v' || tv."version"::text
        END AS "name",
        bt."slug",
        tv."version",
        (bt."slug" || '/v' || tv."version"::text) AS "component_key",
        bt."access_rank",
        bt."schema_jsonb",
        bt."default_styles_jsonb",
        bt."preview_image_url"
    FROM base_themes bt
    CROSS JOIN target_versions tv
    WHERE NOT EXISTS (
        SELECT 1
        FROM "themes" existing
        WHERE existing."slug" = bt."slug"
          AND existing."version" = tv."version"
    )
)
INSERT INTO "themes" (
    "id",
    "feature_id",
    "name",
    "slug",
    "version",
    "component_key",
    "access_rank",
    "schema_jsonb",
    "default_styles_jsonb",
    "preview_image_url",
    "is_active",
    "created_at",
    "updated_at"
)
SELECT
    r."id",
    r."feature_id",
    r."name",
    r."slug",
    r."version",
    r."component_key",
    r."access_rank",
    r."schema_jsonb",
    r."default_styles_jsonb",
    r."preview_image_url",
    true,
    NOW(),
    NOW()
FROM rows_to_insert r
ON CONFLICT ("slug", "version") DO NOTHING;
