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
        WHEN 'header' THEN 'theme-header-v6'
        WHEN 'hero' THEN 'theme-hero-v6'
        WHEN 'services' THEN 'theme-services-v6'
        WHEN 'testimonials' THEN 'theme-testimonials-v6'
        WHEN 'faq' THEN 'theme-faq-v6'
        WHEN 'footer' THEN 'theme-footer-v6'
    END AS "id",
    fm."id" AS "feature_id",
    CASE fm."slug"
        WHEN 'header' THEN 'Velocity VSL Header'
        WHEN 'hero' THEN 'Velocity VSL Hero'
        WHEN 'services' THEN 'Velocity VSL Offer Stack'
        WHEN 'testimonials' THEN 'Velocity VSL Proof'
        WHEN 'faq' THEN 'Velocity VSL FAQ'
        WHEN 'footer' THEN 'Velocity VSL Footer'
    END AS "name",
    fm."slug" AS "slug",
    6 AS "version",
    fm."slug" || '/v6' AS "component_key",
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
                "ctaText": { "type": "string", "title": "CTA Text" },
                "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" }
              }
            }'::jsonb
        WHEN 'hero' THEN
            '{
              "type": "object",
              "properties": {
                "eyebrow": { "type": "string", "title": "Eyebrow" },
                "title": { "type": "string", "title": "Headline" },
                "subtitle": { "type": "string", "title": "Subheadline", "format": "textarea" },
                "videoUrl": { "type": "string", "title": "Video URL", "format": "url" },
                "videoPosterUrl": { "type": "string", "title": "Video Poster", "format": "image-url" },
                "primaryCtaText": { "type": "string", "title": "Primary CTA Text" },
                "primaryCtaLink": { "type": "string", "title": "Primary CTA Link", "format": "page-link" },
                "secondaryCtaText": { "type": "string", "title": "Secondary CTA Text" },
                "secondaryCtaLink": { "type": "string", "title": "Secondary CTA Link", "format": "page-link" },
                "guaranteeText": { "type": "string", "title": "Support Statement", "format": "textarea" },
                "bullets": {
                  "type": "array",
                  "title": "Bullets",
                  "items": {
                    "type": "object",
                    "properties": {
                      "text": { "type": "string", "title": "Bullet Text", "format": "textarea" }
                    },
                    "required": ["text"]
                  }
                },
                "proofStats": {
                  "type": "array",
                  "title": "Proof Stats",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "title": "Label" },
                      "value": { "type": "string", "title": "Value" }
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
                "bottomCtaText": { "type": "string", "title": "Bottom CTA Text" },
                "bottomCtaLink": { "type": "string", "title": "Bottom CTA Link", "format": "page-link" },
                "items": {
                  "type": "array",
                  "title": "Offer Items",
                  "items": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string", "title": "Title" },
                      "description": { "type": "string", "title": "Description", "format": "textarea" },
                      "result": { "type": "string", "title": "Result Tag" }
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
                "ctaText": { "type": "string", "title": "CTA Text" },
                "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
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
            }'::jsonb
        ELSE '{ "type": "object", "properties": {} }'::jsonb
    END AS "schema_jsonb",
    '{}'::jsonb AS "default_styles_jsonb",
    CASE fm."slug"
        WHEN 'hero' THEN 'https://placehold.co/1200x800/111827/ffffff?text=Velocity+VSL'
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
    'template-2026-velocity-vsl',
    'Velocity VSL',
    'A video-led marketing sales letter template with a bold promise, offer breakdown, proof stack, objection handling, and direct CTA flow.',
    'https://placehold.co/1200x800/111827/ffffff?text=Velocity+VSL',
    $json$[
      {
        "themeComponentKey": "header/v6",
        "defaultContent": {
          "projectName": "Velocity VSL",
          "logoBadge": "V",
          "menu": [
            { "label": "Offer", "href": "#hero" },
            { "label": "Inside", "href": "#features" },
            { "label": "Proof", "href": "#proof" },
            { "label": "Questions", "href": "#questions" }
          ],
          "ctaText": "Watch The Training",
          "ctaLink": "#video"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v6",
        "defaultContent": {
          "eyebrow": "Marketing Video Sales Letter",
          "title": "Turn a single sales page into a focused conversion system with one video, one promise, and one next step.",
          "subtitle": "This template is built for video-led funnel pages that need strong hierarchy, fast trust-building, and clear calls to action without distracting navigation overload.",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "videoPosterUrl": "https://placehold.co/1280x720/111827/ffffff?text=Video+Sales+Letter",
          "primaryCtaText": "Get Instant Access",
          "primaryCtaLink": "#features",
          "secondaryCtaText": "See What Is Included",
          "secondaryCtaLink": "#proof",
          "guaranteeText": "Use this layout to lead with your promise, validate it with proof, and move visitors toward a direct response action.",
          "bullets": [
            { "text": "Discover the exact offer structure that makes your message feel obvious and urgent." },
            { "text": "See how to use one focused page to explain the promise, handle objections, and drive action." },
            { "text": "Get a builder-friendly funnel layout you can customize without touching code." }
          ],
          "proofStats": [
            { "label": "Focused CTA blocks", "value": "3" },
            { "label": "Conversion stages", "value": "5" },
            { "label": "Mobile-ready layout", "value": "100%" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v6",
        "defaultContent": {
          "title": "What this funnel page helps you do",
          "subtitle": "A VSL page works best when every section reinforces the same promise and drives toward the same conversion event.",
          "bottomCtaText": "See The Proof",
          "bottomCtaLink": "#proof",
          "items": [
            {
              "title": "Clarify the core promise",
              "description": "Lead with a single big result so the visitor understands exactly why they should keep watching.",
              "result": "Sharper positioning"
            },
            {
              "title": "Break down what they get",
              "description": "Use structured offer blocks to make the deliverables feel tangible, organized, and high value.",
              "result": "Higher perceived value"
            },
            {
              "title": "Handle objections in sequence",
              "description": "Move from promise to proof to explanation, reducing friction before the final CTA appears.",
              "result": "Less hesitation"
            },
            {
              "title": "Give them a direct next step",
              "description": "Keep the CTA singular and visible so the page always points toward the response you want.",
              "result": "More action"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v6",
        "defaultContent": {
          "title": "Proof that supports the promise",
          "subtitle": "Use testimonials after the main offer explanation to reinforce belief before the final CTA.",
          "testimonials": [
            {
              "quote": "The page flow made the offer feel much easier to understand, and the CTA placement felt natural instead of forced.",
              "author": "Jordan Hale",
              "role": "Growth consultant"
            },
            {
              "quote": "We finally had a template that combined video, proof, and objections without turning the page into a cluttered mess.",
              "author": "Mina Foster",
              "role": "Course creator"
            },
            {
              "quote": "It reads like a structured conversation, which is exactly what we needed for a direct-response funnel page.",
              "author": "Caleb Reid",
              "role": "Offer strategist"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v6",
        "defaultContent": {
          "title": "Handle the last objections before the CTA",
          "subtitle": "Use the FAQ block to answer the questions visitors ask right before they decide whether to act.",
          "faqs": [
            {
              "q": "Can I replace the sample video with my own hosted file?",
              "a": "Yes. The hero schema stores the video URL and poster as editable fields, so you can swap them directly from the builder."
            },
            {
              "q": "Is this layout only for one kind of business?",
              "a": "No. It is structured for direct-response pages in general, especially when you want to lead with a video and one clear action."
            },
            {
              "q": "Can the proof and offer sections be customized later?",
              "a": "Yes. The services and testimonials sections both store their entries as section content arrays, so the layout stays reusable."
            },
            {
              "q": "Will this work with the existing publish and preview pipeline?",
              "a": "Yes. This template follows the standard theme registry and page template flow used by the current architecture."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v6",
        "defaultContent": {
          "businessName": "Velocity VSL",
          "text": "A direct-response marketing video sales letter template built for clear messaging, strong proof, and a focused call to action.",
          "ctaText": "Go Back To The Offer",
          "ctaLink": "#hero",
          "copyrightText": "Copyright 2026 Velocity VSL. All rights reserved.",
          "links": [
            { "label": "Watch", "href": "#video" },
            { "label": "Offer", "href": "#features" },
            { "label": "Proof", "href": "#proof" },
            { "label": "Questions", "href": "#questions" }
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
