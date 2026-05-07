-- Refocus blog-focused templates to pure blog-only, single-section page templates.

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
    'template-2026-blog-authority-hub',
    'Blog Authority Hub',
    'Single-page blog template focused only on article discovery and blog detail navigation.',
    'https://placehold.co/1200x800/f0f9ff/0c4a6e?text=Blog+Authority+Hub+Single+Page',
    $tpl_blog_only_v2$[
      {
        "themeComponentKey": "blog/v2",
        "defaultContent": {
          "title": "Latest Articles",
          "subtitle": "A clean blog-only page that lists your published posts.",
          "showAllPosts": true,
          "featuredCount": 12,
          "ctaText": "Blog Index",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "showExcerpt": true,
          "showFeaturedImage": true,
          "showPublishDate": true,
          "showReadMore": true,
          "readMoreText": "Read Article",
          "themeTokens": {
            "background": "#f0f9ff",
            "text": "#082f49",
            "primary": "#0284c7",
            "secondary": "#e0f2fe",
            "accent": "#0ea5e9",
            "font": "Space Grotesk, sans-serif"
          }
        }
      }
    ]$tpl_blog_only_v2$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-editorial-conversion-desk',
    'Editorial Conversion Desk',
    'Single-page editorial blog template focused only on post listing and detail-page click-through.',
    'https://placehold.co/1200x800/fff7ed/7c2d12?text=Editorial+Desk+Single+Page',
    $tpl_blog_only_v3$[
      {
        "themeComponentKey": "blog/v3",
        "defaultContent": {
          "title": "From The Editorial Desk",
          "subtitle": "A focused blog page with no extra sections.",
          "showAllPosts": true,
          "featuredCount": 12,
          "ctaText": "Explore Blog",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "showExcerpt": true,
          "showFeaturedImage": true,
          "showPublishDate": true,
          "showReadMore": true,
          "readMoreText": "Read Full Story",
          "themeTokens": {
            "background": "#fff7ed",
            "text": "#7c2d12",
            "primary": "#ea580c",
            "secondary": "#ffedd5",
            "accent": "#fb923c",
            "font": "Outfit, sans-serif"
          }
        }
      }
    ]$tpl_blog_only_v3$::jsonb,
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