WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN ('header', 'hero', 'testimonials', 'about', 'logos', 'product', 'services', 'team', 'footer')
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
    'theme-' || fm."slug" || '-v13' AS "id",
    fm."id" AS "feature_id",
    CASE fm."slug"
        WHEN 'header' THEN 'Fusion Growth Store Header'
        WHEN 'hero' THEN 'Fusion Growth Store Hero'
        WHEN 'testimonials' THEN 'Fusion Growth Review Wall'
        WHEN 'about' THEN 'Fusion Growth Authority Block'
        WHEN 'logos' THEN 'Fusion Growth Highlight Rail'
        WHEN 'product' THEN 'Fusion Growth Store Grid'
        WHEN 'services' THEN 'Fusion Growth Curriculum Stack'
        WHEN 'team' THEN 'Fusion Growth Audience Cards'
        WHEN 'footer' THEN 'Fusion Growth Store Footer'
    END AS "name",
    fm."slug" AS "slug",
    13 AS "version",
    fm."slug" || '/v13' AS "component_key",
    100 AS "access_rank",
    CASE fm."slug"
        WHEN 'header' THEN
            '{
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
            }'::jsonb
        WHEN 'hero' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Headline" },
                "subtitle": { "type": "string", "title": "Subheadline", "format": "textarea" },
                "primaryCtaText": { "type": "string", "title": "Primary CTA Text" },
                "primaryCtaLink": { "type": "string", "title": "Primary CTA Link", "format": "page-link" },
                "secondaryCtaText": { "type": "string", "title": "Secondary CTA Text" },
                "secondaryCtaLink": { "type": "string", "title": "Secondary CTA Link", "format": "page-link" },
                "ratingText": { "type": "string", "title": "Rating Text" },
                "proofText": { "type": "string", "title": "Proof Text" },
                "productLabel": { "type": "string", "title": "Product Label" },
                "productTitle": { "type": "string", "title": "Product Title" },
                "productSubtitle": { "type": "string", "title": "Product Subtitle" },
                "productImageUrl": { "type": "string", "title": "Product Image URL" },
                "productAccentImageUrl": { "type": "string", "title": "Accent Image URL" },
                "badges": {
                  "type": "array",
                  "title": "Hero Badges",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "title": "Label" }
                    },
                    "required": ["label"]
                  }
                }
              }
            }'::jsonb
        WHEN 'testimonials' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "ctaText": { "type": "string", "title": "CTA Text" },
                "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
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
        WHEN 'about' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Title" },
                "body": { "type": "string", "title": "Body", "format": "textarea" },
                "imageUrl": { "type": "string", "title": "Image URL" },
                "stats": {
                  "type": "array",
                  "title": "Stats",
                  "items": {
                    "type": "object",
                    "properties": {
                      "value": { "type": "string", "title": "Value" },
                      "label": { "type": "string", "title": "Label" }
                    },
                    "required": ["value", "label"]
                  }
                }
              }
            }'::jsonb
        WHEN 'logos' THEN
            '{
              "type": "object",
              "properties": {
                "highlights": {
                  "type": "array",
                  "title": "Highlights",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "title": "Label" }
                    },
                    "required": ["label"]
                  }
                }
              }
            }'::jsonb
        WHEN 'product' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "items": {
                  "type": "array",
                  "title": "Offer Cards",
                  "items": {
                    "type": "object",
                    "properties": {
                      "badge": { "type": "string", "title": "Badge" },
                      "title": { "type": "string", "title": "Title" },
                      "subtitle": { "type": "string", "title": "Subtitle" },
                      "price": { "type": "string", "title": "Price" },
                      "ctaText": { "type": "string", "title": "CTA Text" },
                      "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
                      "imageUrl": { "type": "string", "title": "Image URL" }
                    },
                    "required": ["title", "subtitle", "price"]
                  }
                }
              }
            }'::jsonb
        WHEN 'services' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "ctaText": { "type": "string", "title": "CTA Text" },
                "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
                "items": {
                  "type": "array",
                  "title": "Lessons",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string", "title": "Title" },
                      "description": { "type": "string", "title": "Description", "format": "textarea" }
                    },
                    "required": ["title", "description"]
                  }
                }
              }
            }'::jsonb
        WHEN 'team' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Title" },
                "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                "cards": {
                  "type": "array",
                  "title": "Audience Cards",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string", "title": "Label" },
                      "headline": { "type": "string", "title": "Headline" },
                      "description": { "type": "string", "title": "Description", "format": "textarea" }
                    },
                    "required": ["title", "headline", "description"]
                  }
                }
              }
            }'::jsonb
        WHEN 'footer' THEN
            '{
              "type": "object",
              "properties": {
                "brandName": { "type": "string", "title": "Brand Name" },
                "heading": { "type": "string", "title": "Heading" },
                "body": { "type": "string", "title": "Body", "format": "textarea" },
                "ctaText": { "type": "string", "title": "CTA Text" },
                "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
                "copyrightText": { "type": "string", "title": "Copyright Text" },
                "cards": {
                  "type": "array",
                  "title": "Footer Cards",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string", "title": "Title" },
                      "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
                      "ctaText": { "type": "string", "title": "CTA Text" },
                      "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
                      "imageUrl": { "type": "string", "title": "Image URL" }
                    },
                    "required": ["title", "subtitle"]
                  }
                }
              }
            }'::jsonb
        ELSE '{ "type": "object", "properties": {} }'::jsonb
    END AS "schema_jsonb",
    '{}'::jsonb AS "default_styles_jsonb",
    CASE fm."slug"
        WHEN 'hero' THEN 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80'
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

UPDATE "page_templates"
SET
    "name" = 'Fusion Growth',
    "description" = 'A long-form storefront template for books, bundles, and authority-led product launches with editorial proof blocks and repeated CTAs.',
    "preview_image_url" = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v13",
        "defaultContent": {
          "brandName": "Acquisition Press",
          "menu": [
            { "label": "Home", "href": "#hero" },
            { "label": "Shop", "href": "#offers" },
            { "label": "Workshop", "href": "#about" }
          ]
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f7f1e7",
            "text": "#1f160f",
            "primary": "#1f160f",
            "secondary": "#f4ecdf",
            "accent": "#9a592b",
            "font": "Roboto, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v13",
        "defaultContent": {
          "eyebrow": "World-record business education",
          "title": "Build a storefront page that feels like a best-selling product launch.",
          "subtitle": "A clean editorial layout for books, flagship offers, and stacked bundles, with the trust markers and repeated calls to action that make a product page feel proven.",
          "primaryCtaText": "Get The Book",
          "primaryCtaLink": "#offers",
          "secondaryCtaText": "See Reviews",
          "secondaryCtaLink": "#reviews",
          "ratingText": "Rated 4.9 / 5 on major marketplaces",
          "proofText": "Sold over 800,000+ copies worldwide",
          "productLabel": "Featured Release",
          "productTitle": "Evergreen Demand Playbook",
          "productSubtitle": "Hardcover Edition",
          "productImageUrl": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
          "productAccentImageUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80",
          "badges": [
            { "label": "Rated 4.9/5 by readers" },
            { "label": "Sold in 80+ countries" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v13",
        "defaultContent": {
          "eyebrow": "What readers are saying",
          "title": "Dense proof blocks that feel editorial, not decorative.",
          "subtitle": "This section is designed as a review wall: strong headings, longer copy, and compact author metadata that reads cleanly on mobile.",
          "ctaText": "Discover The Books",
          "ctaLink": "#offers",
          "testimonials": [
            { "quote": "This reads like a premium product page instead of a generic marketing theme. The trust is immediate.", "author": "Liam Hart", "role": "Verified Customer" },
            { "quote": "The repeated CTAs and review density make the page feel proven without becoming cluttered.", "author": "Nina Cole", "role": "Verified Customer" },
            { "quote": "Exactly the kind of long-form storefront rhythm you want for a flagship book or founder offer.", "author": "Marcus Vale", "role": "Verified Customer" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v13",
        "defaultContent": {
          "eyebrow": "Why readers trust this methodology",
          "title": "Built like an authority storefront, not a generic landing page.",
          "body": "This section mirrors the editorial proof block used by top business education storefronts: a grounded founder image, concise origin story, and a stack of measurable wins that make the offer feel lived-in before the reader scrolls into the product grid.",
          "imageUrl": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80",
          "stats": [
            { "value": "$46M+", "label": "Recent exit value" },
            { "value": "5M+", "label": "Audience reached" },
            { "value": "16", "label": "Industries tested" },
            { "value": "20k+", "label": "Daily lead capacity" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v13",
        "defaultContent": {
          "highlights": [
            { "label": "Sold over 800,000+ copies worldwide" },
            { "label": "No. 1 best-selling series" },
            { "label": "Rated 4.9 / 5 by readers" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v13",
        "defaultContent": {
          "eyebrow": "Choose your edition",
          "title": "A storefront grid built for flagship products and bundle offers.",
          "subtitle": "Use three clean buying paths with strong badges, cover imagery, and repeated call-to-action buttons.",
          "items": [
            {
              "badge": "New Release",
              "title": "Demand Blueprint",
              "subtitle": "Hardcover Edition",
              "price": "$29.99",
              "ctaText": "Get The Book",
              "ctaLink": "#top",
              "imageUrl": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80"
            },
            {
              "badge": "Best Value",
              "title": "Demand Blueprint",
              "subtitle": "3 Book Bundle",
              "price": "$89.97",
              "ctaText": "Get The Bundle",
              "ctaLink": "#top",
              "imageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80"
            },
            {
              "badge": "Team Pack",
              "title": "Demand Blueprint",
              "subtitle": "10 Book Bundle",
              "price": "$299.90",
              "ctaText": "Buy For Teams",
              "ctaLink": "#top",
              "imageUrl": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v13",
        "defaultContent": {
          "eyebrow": "Inside the book",
          "title": "A numbered teaching block that reads like a premium table of contents.",
          "subtitle": "This section mirrors the educational breakdown on the reference storefront: short numbered modules, concise explanations, and a clear CTA after the curriculum.",
          "ctaText": "Discover The Book",
          "ctaLink": "#offers",
          "items": [
            { "title": "Start here", "description": "Introduce the promise and frame what the reader gets from the first chapter." },
            { "title": "Learn how demand works", "description": "Break a complicated system into plain language and memorable frameworks." },
            { "title": "See the buying paths", "description": "Show the practical levers a reader can apply without redesigning their whole offer." },
            { "title": "Build the repeatable system", "description": "Move from isolated tactics into a process the team can operate every week." },
            { "title": "Implementation plan", "description": "Close with a clean action plan that gives the storefront a practical finish." }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "team/v13",
        "defaultContent": {
          "eyebrow": "Who this template is for",
          "title": "Three audience cards that mirror the buyer-segment block on the reference page.",
          "subtitle": "This section works well near the bottom of the page, after reviews and curriculum, to help different buyer types recognize themselves.",
          "cards": [
            { "title": "For operators", "headline": "Fast-track the buying story", "description": "Use the page to package a flagship offer into a clear, visual buying flow with repeated proof." },
            { "title": "For founders", "headline": "Turn one product into a shelf", "description": "Present a hero offer, bundles, and companion products without losing the premium editorial tone." },
            { "title": "For marketers", "headline": "Deploy a mobile-safe storefront", "description": "Keep the long-form sales rhythm intact on smaller screens with stacked cards and compact CTAs." }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v13",
        "defaultContent": {
          "brandName": "Acquisition Press",
          "heading": "A footer that closes like a premium catalog page.",
          "body": "Use an editorial brand summary plus a pair of series cards to end the storefront with one more credibility signal and one more buying path.",
          "ctaText": "Read The Series",
          "ctaLink": "#offers",
          "copyrightText": "Copyright 2026 Acquisition Press",
          "cards": [
            {
              "title": "Offer Architecture",
              "subtitle": "Structure a product so the buying decision feels obvious.",
              "ctaText": "Buy The Book",
              "ctaLink": "#offers",
              "imageUrl": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=80"
            },
            {
              "title": "Demand Systems",
              "subtitle": "Turn cold traffic into qualified buyers with clear proof and repeated CTAs.",
              "ctaText": "Discover The Series",
              "ctaLink": "#hero",
              "imageUrl": "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80"
            }
          ]
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-fusion-growth';
