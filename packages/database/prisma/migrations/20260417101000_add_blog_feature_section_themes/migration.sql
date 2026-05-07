-- Add blog feature and section theme catalog entries (v1-v12).

INSERT INTO "features" ("id", "name", "slug", "description", "created_at")
VALUES (
    'feature-blog',
    'Blog',
    'blog',
    'Blog section with card listing powered by CMS blog posts.',
    NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

WITH blog_feature AS (
    SELECT "id"
    FROM "features"
    WHERE "slug" = 'blog'
),
target_versions AS (
    SELECT generate_series(1, 12)::int AS "version"
),
theme_rows AS (
    SELECT
        'theme-blog-v' || tv."version" AS "id",
        bf."id" AS "feature_id",
        'Blog v' || tv."version" AS "name",
        'blog' AS "slug",
        tv."version" AS "version",
        'blog/v' || tv."version" AS "component_key"
    FROM blog_feature bf
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
        "showAllPosts": { "type": "boolean", "title": "Show All Posts" },
        "featuredCount": { "type": "number", "title": "Featured Count" },
        "ctaText": { "type": "string", "title": "Button Text" },
        "ctaLink": { "type": "string", "title": "Button Link", "format": "page-link" },
        "postsList": {
          "type": "array",
          "title": "Fallback Posts",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string", "title": "Title" },
              "slug": { "type": "string", "title": "Slug" },
              "excerpt": { "type": "string", "title": "Excerpt", "format": "textarea" },
              "featuredImageUrl": { "type": "string", "title": "Featured Image", "format": "image-url" },
              "publishedAt": { "type": "string", "title": "Publish Date" }
            }
          }
        }
      }
    }'::jsonb,
    '{
      "showExcerpt": true,
      "showFeaturedImage": true,
      "showPublishDate": true,
      "showReadMore": true,
      "readMoreText": "Read More"
    }'::jsonb,
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
