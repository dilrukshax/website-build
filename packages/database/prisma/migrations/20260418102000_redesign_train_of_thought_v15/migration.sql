-- Redesign Train of Thought into an isolated editorial lane.
-- Adds dedicated v15 section themes and blog-post-detail/v2, then rewires
-- template-2026-editorial-pulse to the new stack.

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN ('header', 'hero', 'blog', 'about', 'contact', 'footer', 'blog-post-detail')
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
    'theme-header-v15',
    fm."id",
    'Train of Thought Header',
    'header',
    15,
    'header/v15',
    100,
    '{
      "type": "object",
      "properties": {
        "businessName": { "type": "string", "title": "Site Name" },
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
        },
        "ctaText": { "type": "string", "title": "CTA Text" },
        "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" }
      }
    }'::jsonb,
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
WHERE fm."slug" = 'header'
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'hero'
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
    'theme-hero-v15',
    fm."id",
    'Train of Thought Hero',
    'hero',
    15,
    'hero/v15',
    100,
    '{
      "type": "object",
      "properties": {
        "title": { "type": "string", "title": "Headline" },
        "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
        "ctaText": { "type": "string", "title": "CTA Text" },
        "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
        "imageUrl": { "type": "string", "title": "Hero Image", "format": "image-url" }
      }
    }'::jsonb,
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'blog'
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
    'theme-blog-v15',
    fm."id",
    'Train of Thought Blog Listing',
    'blog',
    15,
    'blog/v15',
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
              "category": { "type": "string", "title": "Category" },
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
FROM feature_map fm
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'about'
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
    'theme-about-v15',
    fm."id",
    'Train of Thought About',
    'about',
    15,
    'about/v15',
    100,
    '{
      "type": "object",
      "properties": {
        "title": { "type": "string", "title": "Title" },
        "body": { "type": "string", "title": "Body", "format": "textarea" },
        "imageUrl": { "type": "string", "title": "Image URL", "format": "image-url" }
      }
    }'::jsonb,
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'contact'
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
    'theme-contact-v15',
    fm."id",
    'Train of Thought Contact',
    'contact',
    15,
    'contact/v15',
    100,
    '{
      "type": "object",
      "properties": {
        "title": { "type": "string", "title": "Title" },
        "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
        "email": { "type": "string", "title": "Email" },
        "phone": { "type": "string", "title": "Phone" },
        "ctaText": { "type": "string", "title": "Button Text" }
      }
    }'::jsonb,
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'footer'
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
    'theme-footer-v15',
    fm."id",
    'Train of Thought Footer',
    'footer',
    15,
    'footer/v15',
    100,
    '{
      "type": "object",
      "properties": {
        "businessName": { "type": "string", "title": "Site Name" },
        "text": { "type": "string", "title": "Description", "format": "textarea" },
        "copyrightText": { "type": "string", "title": "Copyright Text" },
        "links": {
          "type": "array",
          "title": "Footer Links",
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
    '{}'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
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

WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" = 'blog-post-detail'
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
    'theme-blog-post-detail-v2',
    fm."id",
    'Blog Post Detail v2',
    'blog-post-detail',
    2,
    'blog-post-detail/v2',
    100,
    '{
      "type": "object",
      "properties": {}
    }'::jsonb,
    '{
      "backgroundColor": "#f7f6f3",
      "textColor": "#1b1b1b"
    }'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
FROM feature_map fm
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

UPDATE "page_templates"
SET
    "name" = 'Train of Thought',
    "description" = 'Editorial blog system with clean storytelling layout for home, listing, and post detail pages.',
    "preview_image_url" = 'https://images-wixmp-530a50041672c69d335ba4cf.wixmp.com/templates/image/11bbfbca1a8b6bf463894abc6a2630200c4bdb64243736657cc44193d9a7e1d11770301954318.jpg',
    "sections_jsonb" = $tpl_editorial_v15$[
      {
        "themeComponentKey": "header/v15",
        "defaultContent": {
          "businessName": "train of thought",
          "menu": [
            { "label": "Home", "href": "/" },
            { "label": "About", "href": "#about" },
            { "label": "Blog", "href": "/blog" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "Subscribe",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f7f6f3",
            "text": "#181818",
            "primary": "#111111",
            "secondary": "#e8e4da",
            "accent": "#6a675f",
            "font": "\"Libre Baskerville\", serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v15",
        "defaultContent": {
          "title": "Train of Thought",
          "subtitle": "A personal space for observations, stories, and slow ideas.",
          "ctaText": "Read the Blog",
          "ctaLink": "/blog",
          "imageUrl": "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "blog/v15",
        "defaultContent": {
          "title": "latest posts",
          "subtitle": "Stories, notes, and ideas from the journal.",
          "showAllPosts": true,
          "featuredCount": 6,
          "ctaText": "View all posts",
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
        "themeComponentKey": "about/v15",
        "defaultContent": {
          "title": "about this journal",
          "body": "This blog is where I share essays on creative process, growth, books, and the practical side of building a meaningful life.",
          "imageUrl": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v15",
        "defaultContent": {
          "title": "stay in touch",
          "subtitle": "If a post resonates, send me a note.",
          "email": "hello@trainofthought.example",
          "phone": "+1 (800) 555-1049",
          "ctaText": "Send Message"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v15",
        "defaultContent": {
          "businessName": "train of thought",
          "text": "Notes on writing, work, and everyday life.",
          "copyrightText": "© 2026 train of thought",
          "links": [
            { "label": "Home", "href": "/" },
            { "label": "Blog", "href": "/blog" },
            { "label": "About", "href": "#about" },
            { "label": "Contact", "href": "#contact" }
          ]
        },
        "defaultStyles": {}
      }
    ]$tpl_editorial_v15$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-editorial-pulse';
