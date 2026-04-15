-- Ensure a "logos" feature row exists so the logos/v5 theme record can reference it.
-- Uses INSERT ... ON CONFLICT DO NOTHING to be safe if it already exists.
INSERT INTO "features" ("id", "slug", "name", "description", "created_at")
VALUES (
    'feature-logos',
    'logos',
    'Logos / Brand Strip',
    'Logo strip / trust badges section',
    NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

-- Add the logos/v5 theme entry.
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
    'theme-logos-v5',
    f."id",
    'Signal Horizon Logos',
    'logos',
    5,
    'logos/v5',
    100,
    '{
      "type": "object",
      "properties": {
        "eyebrow": { "type": "string", "title": "Eyebrow Label" },
        "logos": {
          "type": "array",
          "title": "Company Logos",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string", "title": "Company Name" },
              "imageUrl": { "type": "string", "title": "Logo Image URL", "format": "image-url" }
            },
            "required": ["name"]
          }
        }
      }
    }'::jsonb,
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM "features" f
WHERE f."slug" = 'logos'
ON CONFLICT ("slug", "version") DO UPDATE SET
    "feature_id" = EXCLUDED."feature_id",
    "name" = EXCLUDED."name",
    "component_key" = EXCLUDED."component_key",
    "access_rank" = EXCLUDED."access_rank",
    "schema_jsonb" = EXCLUDED."schema_jsonb",
    "default_styles_jsonb" = EXCLUDED."default_styles_jsonb",
    "is_active" = true,
    "updated_at" = NOW();
