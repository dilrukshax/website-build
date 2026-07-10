WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN ('header', 'hero', 'services', 'testimonials', 'faq', 'footer')
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
    CASE fm."slug"
        WHEN 'header' THEN 'theme-header-v5'
        WHEN 'hero' THEN 'theme-hero-v5'
        WHEN 'services' THEN 'theme-services-v5'
        WHEN 'testimonials' THEN 'theme-testimonials-v5'
        WHEN 'faq' THEN 'theme-faq-v5'
        WHEN 'footer' THEN 'theme-footer-v5'
    END AS "id",
    fm."id" AS "feature_id",
    CASE fm."slug"
        WHEN 'header' THEN 'Signal Horizon Header'
        WHEN 'hero' THEN 'Signal Horizon Hero'
        WHEN 'services' THEN 'Signal Horizon Features'
        WHEN 'testimonials' THEN 'Signal Horizon Testimonials'
        WHEN 'faq' THEN 'Signal Horizon FAQ'
        WHEN 'footer' THEN 'Signal Horizon Footer'
    END AS "name",
    fm."slug" AS "slug",
    5 AS "version",
    fm."slug" || '/v5' AS "component_key",
    100 AS "access_rank",
    CASE fm."slug"
        WHEN 'header' THEN
            '{
              "type": "object",
              "properties": {
                "projectName": { "type": "string", "title": "Project Name" },
                "logoBadge": { "type": "string", "title": "Logo Badge" },
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
                "ctaText": { "type": "string", "title": "Primary Button Text" },
                "ctaLink": { "type": "string", "title": "Primary Button Link", "format": "page-link" }
              }
            }'::jsonb
        WHEN 'hero' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow Text" },
                "title": { "type": "string", "title": "Headline" },
                "subtitle": { "type": "string", "title": "Subheadline", "format": "textarea" },
                "videoUrl": { "type": "string", "title": "Video URL", "format": "url" },
                "videoPosterUrl": { "type": "string", "title": "Video Poster", "format": "image-url" },
                "primaryCtaText": { "type": "string", "title": "Primary Button Text" },
                "primaryCtaLink": { "type": "string", "title": "Primary Button Link", "format": "page-link" },
                "secondaryCtaText": { "type": "string", "title": "Secondary Button Text" },
                "secondaryCtaLink": { "type": "string", "title": "Secondary Button Link", "format": "page-link" },
                "proofItems": {
                  "type": "array",
                  "title": "Proof Items",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "title": "Label" },
                      "value": { "type": "string", "title": "Value" },
                      "tone": { "type": "string", "title": "Tone" }
                    },
                    "required": ["label", "value"]
                  }
                }
              }
            }'::jsonb
        WHEN 'services' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "items": {
                  "type": "array",
                  "title": "Feature Cards",
                  "items": {
                    "type": "object",
                    "properties": {
                      "eyebrow": { "type": "string", "title": "Eyebrow" },
                      "title": { "type": "string", "title": "Title" },
                      "description": { "type": "string", "title": "Description", "format": "textarea" },
                      "stat": { "type": "string", "title": "Highlight Stat" }
                    },
                    "required": ["title", "description"]
                  }
                }
              }
            }'::jsonb
        WHEN 'testimonials' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "testimonials": {
                  "type": "array",
                  "title": "Testimonials",
                  "items": {
                    "type": "object",
                    "properties": {
                      "quote": { "type": "string", "title": "Quote", "format": "textarea" },
                      "author": { "type": "string", "title": "Author" },
                      "role": { "type": "string", "title": "Role" }
                    },
                    "required": ["quote", "author"]
                  }
                }
              }
            }'::jsonb
        WHEN 'faq' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "faqs": {
                  "type": "array",
                  "title": "FAQ Items",
                  "items": {
                    "type": "object",
                    "properties": {
                      "q": { "type": "string", "title": "Question" },
                      "a": { "type": "string", "title": "Answer", "format": "textarea" }
                    },
                    "required": ["q", "a"]
                  }
                }
              }
            }'::jsonb
        WHEN 'footer' THEN
            '{
              "type": "object",
              "properties": {
                "businessName": { "type": "string", "title": "Business Name" },
                "text": { "type": "string", "title": "Description", "format": "textarea" },
                "copyrightText": { "type": "string", "title": "Copyright Text" },
                "columns": {
                  "type": "array",
                  "title": "Footer Columns",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string", "title": "Column Title" },
                      "links": {
                        "type": "array",
                        "title": "Links",
                        "items": {
                          "type": "object",
                          "properties": {
                            "label": { "type": "string", "title": "Label" },
                            "href": { "type": "string", "title": "Link", "format": "page-link" }
                          },
                          "required": ["label", "href"]
                        }
                      }
                    },
                    "required": ["title", "links"]
                  }
                }
              }
            }'::jsonb
        ELSE '{ "type": "object", "properties": {} }'::jsonb
    END AS "schema_jsonb",
    '{}'::jsonb AS "default_styles_jsonb",
    CASE fm."slug"
        WHEN 'hero' THEN 'https://placehold.co/1200x800/0b1121/ffffff?text=Signal+Horizon'
        ELSE NULL
    END AS "preview_image_url",
    true AS "is_active",
    NOW() AS "created_at",
    NOW() AS "updated_at"
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
VALUES (
    'template-2026-signal-horizon',
    'Signal Horizon',
    'A free dark marketing landing page with a video hero, feature cards, review wall, FAQ accordion, and structured footer.',
    'https://placehold.co/1200x800/0b1121/ffffff?text=Signal+Horizon',
    $json$[
      {
        "themeComponentKey": "header/v5",
        "defaultContent": {
          "projectName": "Signal Horizon",
          "logoBadge": "S",
          "menu": [
            { "label": "Overview", "href": "#hero" },
            { "label": "Features", "href": "#features" },
            { "label": "Reviews", "href": "#reviews" },
            { "label": "Questions", "href": "#questions" }
          ],
          "ctaText": "Get Started",
          "ctaLink": "#hero"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Flexible growth workspace",
          "title": "Launch a sharper digital presence with clear messaging and a polished product story.",
          "subtitle": "Use a conversion-focused hero with a guided video, concise value framing, and two clear next steps for visitors.",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "videoPosterUrl": "https://placehold.co/1200x720/151f38/ffffff?text=Product+Walkthrough",
          "primaryCtaText": "Start Free",
          "primaryCtaLink": "#features",
          "secondaryCtaText": "See Demo",
          "secondaryCtaLink": "#video",
          "proofItems": [
            { "label": "Response time", "value": "< 2 min", "tone": "cyan" },
            { "label": "Completion rate", "value": "98%", "tone": "green" },
            { "label": "Team coverage", "value": "24/7", "tone": "blue" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v5",
        "defaultContent": {
          "title": "Built to explain value feature by feature",
          "subtitle": "Use modular content cards to break down the offer in a way that feels clear, fast, and persuasive.",
          "items": [
            {
              "eyebrow": "Messaging",
              "title": "Clear messaging blocks",
              "description": "Present value in focused sections that help visitors understand the offer quickly.",
              "stat": "3x faster scan"
            },
            {
              "eyebrow": "Structure",
              "title": "Conversion-focused layouts",
              "description": "Guide attention with clear hierarchy, predictable actions, and strong contrast.",
              "stat": "High intent"
            },
            {
              "eyebrow": "Delivery",
              "title": "Responsive presentation",
              "description": "Keep the same polished flow across large screens, tablets, and small mobile devices.",
              "stat": "Mobile ready"
            },
            {
              "eyebrow": "Control",
              "title": "Flexible content editing",
              "description": "Update headlines, proof, FAQs, and supporting sections directly from the builder.",
              "stat": "JSON-backed"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v5",
        "defaultContent": {
          "title": "What people are saying",
          "subtitle": "A horizontally scrollable review wall that keeps feedback visible without interrupting the reading flow.",
          "testimonials": [
            {
              "quote": "The structure made it easy to explain the product without overloading visitors on the first screen.",
              "author": "Jordan Lee",
              "role": "Operations lead"
            },
            {
              "quote": "The section pacing feels polished and the visual treatment keeps the page memorable from start to finish.",
              "author": "Avery Shah",
              "role": "Growth manager"
            },
            {
              "quote": "We had room for proof, explanation, and calls to action without the page feeling heavy.",
              "author": "Taylor Brooks",
              "role": "Product owner"
            },
            {
              "quote": "The builder fields were straightforward, so updating quotes and supporting text was quick for the whole team.",
              "author": "Morgan Patel",
              "role": "Content editor"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v5",
        "defaultContent": {
          "title": "Questions, answered clearly",
          "subtitle": "A compact accordion section for the details visitors usually want before they commit.",
          "faqs": [
            {
              "q": "Can the hero content be updated after publishing?",
              "a": "Yes. Headlines, supporting copy, video links, calls to action, and proof items are all stored as editable section content."
            },
            {
              "q": "Does this layout work well on mobile devices?",
              "a": "Yes. The layout collapses into a single-column flow and keeps navigation, video, and content blocks easy to scan on smaller screens."
            },
            {
              "q": "Can the feature cards and testimonials be customized?",
              "a": "Yes. Those entries are builder-managed content arrays, so each card and quote can be replaced without changing the component code."
            },
            {
              "q": "Is this theme intended to be plan-restricted?",
              "a": "No. This theme is configured as a free option so it can be used like the rest of the unrestricted catalog entries."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v5",
        "defaultContent": {
          "businessName": "Signal Horizon",
          "text": "A polished free marketing theme with strong contrast, responsive sections, and clean content structure.",
          "copyrightText": "Copyright 2026 Signal Horizon. All rights reserved.",
          "columns": [
            {
              "title": "Explore",
              "links": [
                { "label": "Overview", "href": "#hero" },
                { "label": "Features", "href": "#features" },
                { "label": "Reviews", "href": "#reviews" }
              ]
            },
            {
              "title": "Support",
              "links": [
                { "label": "Questions", "href": "#questions" },
                { "label": "Demo", "href": "#video" },
                { "label": "Start", "href": "#hero" }
              ]
            }
          ]
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
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
