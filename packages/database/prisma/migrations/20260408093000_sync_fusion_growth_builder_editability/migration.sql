UPDATE "themes"
SET
    "schema_jsonb" = '{
      "type": "object",
      "properties": {
        "brandName": { "type": "string", "title": "Brand Name" },
        "menu": {
          "type": "array",
          "title": "Navigation Menu",
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string", "title": "Label" },
              "href": { "type": "string", "title": "Link", "format": "page-link" }
            },
            "required": ["label", "href"]
          }
        }
      }
    }'::jsonb,
    "updated_at" = NOW()
WHERE "component_key" = 'header/v13';

UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            "sections_jsonb",
            '{0,defaultContent}',
            '{
              "brandName": "Acquisition Press",
              "menu": [
                { "label": "Home", "href": "#hero" },
                { "label": "Shop", "href": "#offers" },
                { "label": "Workshop", "href": "#about" }
              ]
            }'::jsonb,
            false
        ),
        '{0,defaultStyles,themeTokens,font}',
        '"Roboto, sans-serif"'::jsonb,
        true
    ),
    "preview_image_url" = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    "updated_at" = NOW()
WHERE "id" = 'template-2026-fusion-growth';
