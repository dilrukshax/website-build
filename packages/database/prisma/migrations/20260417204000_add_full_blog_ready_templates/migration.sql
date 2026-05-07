-- Add one full blog-focused website template with companion blog detail theme support.

INSERT INTO "features" ("id", "name", "slug", "description", "created_at")
VALUES (
    'feature-blog-post-detail',
    'Blog Post Detail',
    'blog-post-detail',
    'Detail layout section for rendering a single published blog post.',
    NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

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
    'theme-blog-post-detail-v1',
    f."id",
    'Blog Post Detail v1',
    'blog-post-detail',
    1,
    'blog-post-detail/v1',
    100,
    '{
      "type": "object",
      "properties": {}
    }'::jsonb,
    '{
      "backgroundColor": "#ffffff",
      "textColor": "#111827"
    }'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM "features" f
WHERE f."slug" = 'blog-post-detail'
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

INSERT INTO "page_templates" (
    "id",
    "name",
    "description",
    "preview_image_url",
    "sections_jsonb",
    "is_premium",
    "is_active",
    "created_at",
    "updated_at"
)
VALUES
(
    'template-2026-editorial-pulse',
    'Train of Thought',
    'Minimalist personal-blog layout inspired by clean editorial storytelling with featured-post focus.',
    'https://images-wixmp-530a50041672c69d335ba4cf.wixmp.com/templates/image/11bbfbca1a8b6bf463894abc6a2630200c4bdb64243736657cc44193d9a7e1d11770301954318.jpg',
    $tpl_editorial_pulse$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Train of Thought",
          "menu": [
            { "label": "Home", "href": "/" },
            { "label": "About", "href": "#about" },
            { "label": "My Blog", "href": "/blog" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "",
          "ctaLink": ""
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#efefef",
            "text": "#111111",
            "primary": "#111111",
            "secondary": "#e7e7e7",
            "accent": "#4b5563",
            "font": "\"Libre Baskerville\", serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "Train of Thought",
          "subtitle": "EVERYTHING IS PERSONAL. INCLUDING THIS BLOG.",
          "ctaText": "Read Featured Posts",
          "ctaLink": "#blog"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "blog/v2",
        "defaultContent": {
          "title": "Featured Post",
          "subtitle": "Fresh stories from your published blog posts.",
          "showAllPosts": false,
          "featuredCount": 4,
          "ctaText": "View My Blog",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "showExcerpt": true,
          "showFeaturedImage": true,
          "showPublishDate": true,
          "showReadMore": true,
          "readMoreText": "Read More"
        }
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "About This Blog",
          "body": "A personal journal for ideas on writing, creativity, and everyday observations."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v2",
        "defaultContent": {
          "title": "Let's Connect",
          "email": "hello@trainofthought.example",
          "phone": "+1 (800) 555-1049",
          "ctaText": "Send Message"
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v2",
        "defaultContent": {
          "businessName": "Train of Thought",
          "text": "Personal essays, ideas, and reflections.",
          "copyrightText": "© 2026 Train of Thought"
        },
        "defaultStyles": {}
      }
    ]$tpl_editorial_pulse$::jsonb,
    false,
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "preview_image_url" = EXCLUDED."preview_image_url",
    "sections_jsonb" = EXCLUDED."sections_jsonb",
    "is_premium" = EXCLUDED."is_premium",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = NOW();
