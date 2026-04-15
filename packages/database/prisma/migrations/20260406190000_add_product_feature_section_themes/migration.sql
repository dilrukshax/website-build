-- Add product feature and section theme catalog entries (v1-v6).
-- Also backfill existing templates that include services so they include a matching product section.

INSERT INTO "features" ("id", "name", "slug", "description", "created_at")
VALUES (
    'feature-product',
    'Products',
    'product',
    'Product catalog section with catalog-driven pricing, images, and descriptions.',
    NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

WITH product_feature AS (
    SELECT "id"
    FROM "features"
    WHERE "slug" = 'product'
),
target_versions AS (
    SELECT generate_series(1, 6)::int AS "version"
),
theme_rows AS (
    SELECT
        'theme-product-v' || tv."version" AS "id",
        pf."id" AS "feature_id",
        'Product Catalog v' || tv."version" AS "name",
        'product' AS "slug",
        tv."version" AS "version",
        'product/v' || tv."version" AS "component_key"
    FROM product_feature pf
    CROSS JOIN target_versions tv
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
    tr."id",
    tr."feature_id",
    tr."name",
    tr."slug",
    tr."version",
    tr."component_key",
    100,
    '{
      "type": "object",
      "properties": {
        "title": { "type": "string", "title": "Section Title" },
        "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
        "showAllProducts": { "type": "boolean", "title": "Show All Products" },
        "featuredCount": { "type": "number", "title": "Featured Count" },
        "ctaText": { "type": "string", "title": "Button Text" },
        "ctaLink": { "type": "string", "title": "Button Link", "format": "page-link" },
        "productsList": {
          "type": "array",
          "title": "Fallback Products",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string", "title": "Title" },
              "name": { "type": "string", "title": "Name" },
              "desc": { "type": "string", "title": "Description", "format": "textarea" },
              "description": { "type": "string", "title": "Description", "format": "textarea" },
              "imageUrl": { "type": "string", "title": "Image URL", "format": "image-url" },
              "price": { "type": "number", "title": "Price" },
              "currency": { "type": "string", "title": "Currency" },
              "badge": { "type": "string", "title": "Badge" }
            }
          }
        }
      }
    }'::jsonb,
    '{ "showPrice": true }'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM theme_rows tr
ON CONFLICT ("slug", "version") DO UPDATE SET
    "feature_id" = EXCLUDED."feature_id",
    "name" = EXCLUDED."name",
    "component_key" = EXCLUDED."component_key",
    "access_rank" = EXCLUDED."access_rank",
    "schema_jsonb" = EXCLUDED."schema_jsonb",
    "default_styles_jsonb" = EXCLUDED."default_styles_jsonb",
    "preview_image_url" = EXCLUDED."preview_image_url",
    "is_active" = true,
    "updated_at" = NOW();

WITH templates_to_update AS (
    SELECT
        pt."id",
        pt."sections_jsonb"
    FROM "page_templates" pt
    WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(pt."sections_jsonb") AS element
        WHERE (element ->> 'themeComponentKey') LIKE 'services/v%'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(pt."sections_jsonb") AS element
        WHERE (element ->> 'themeComponentKey') LIKE 'product/v%'
    )
),
rebuilt_templates AS (
    SELECT
        t."id",
        (
            SELECT jsonb_agg(merged."section" ORDER BY merged."sort_key")
            FROM (
                SELECT
                    element."value" AS "section",
                    element."ordinality" * 2 AS "sort_key"
                FROM jsonb_array_elements(t."sections_jsonb") WITH ORDINALITY AS element("value", "ordinality")

                UNION ALL

                SELECT
                    jsonb_build_object(
                        'themeComponentKey',
                        CASE
                            WHEN svc."service_version" BETWEEN 1 AND 6 THEN 'product/v' || svc."service_version"::text
                            ELSE 'product/v1'
                        END,
                        'defaultContent',
                        jsonb_build_object(
                            'title', 'Featured Products',
                            'subtitle', 'Products sync automatically from your CMS product catalog.',
                            'showAllProducts', true,
                            'featuredCount', 6
                        ),
                        'defaultStyles',
                        jsonb_build_object('showPrice', true)
                    ) AS "section",
                    svc."service_order" * 2 + 1 AS "sort_key"
                FROM (
                    SELECT
                        element."ordinality" AS "service_order",
                        COALESCE(substring(element."value" ->> 'themeComponentKey' FROM 'services/v([0-9]+)')::int, 1) AS "service_version"
                    FROM jsonb_array_elements(t."sections_jsonb") WITH ORDINALITY AS element("value", "ordinality")
                    WHERE (element."value" ->> 'themeComponentKey') LIKE 'services/v%'
                    ORDER BY element."ordinality"
                    LIMIT 1
                ) AS svc
            ) AS merged
        ) AS "new_sections_jsonb"
    FROM templates_to_update t
)
UPDATE "page_templates" pt
SET
    "sections_jsonb" = rebuilt."new_sections_jsonb",
    "updated_at" = NOW()
FROM rebuilt_templates rebuilt
WHERE pt."id" = rebuilt."id";
