-- Seed core website-builder feature and theme catalog.
-- This ensures template apply/add-section flows have active themes to resolve.

INSERT INTO "features" ("id", "name", "slug", "description")
VALUES
    ('feature-header', 'Header', 'header', 'Website header with navigation'),
    ('feature-hero', 'Hero', 'hero', 'Hero banner section'),
    ('feature-about', 'About', 'about', 'About us section'),
    ('feature-services', 'Services', 'services', 'Services listing section'),
    ('feature-gallery', 'Gallery', 'gallery', 'Image gallery section'),
    ('feature-testimonials', 'Testimonials', 'testimonials', 'Customer testimonials section'),
    ('feature-contact', 'Contact', 'contact', 'Contact information and inquiry form'),
    ('feature-footer', 'Footer', 'footer', 'Website footer section'),
    ('feature-booking-widget', 'Booking Widget', 'booking-widget', 'Online booking widget'),
    ('feature-pricing', 'Pricing', 'pricing', 'Pricing plans and tiers'),
    ('feature-faq', 'FAQ', 'faq', 'Frequently asked questions section'),
    ('feature-team', 'Team', 'team', 'Team members section')
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

WITH target_features AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN (
        'header', 'hero', 'about', 'services', 'gallery', 'testimonials',
        'contact', 'footer', 'booking-widget', 'pricing', 'faq', 'team'
    )
),
target_versions AS (
    SELECT generate_series(1, 4)::int AS "version"
),
theme_rows AS (
    SELECT
        tf."id" AS "feature_id",
        tf."slug" AS "feature_slug",
        tv."version" AS "version",
        tf."slug" || '/v' || tv."version" AS "component_key"
    FROM target_features tf
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
    'theme-' || tr."feature_slug" || '-v' || tr."version" AS "id",
    tr."feature_id",
    initcap(replace(tr."feature_slug", '-', ' ')) || ' v' || tr."version" AS "name",
    tr."feature_slug" AS "slug",
    tr."version" AS "version",
    tr."component_key" AS "component_key",
    100 AS "access_rank",
    CASE tr."feature_slug"
        WHEN 'header' THEN
            '{
              "type": "object",
              "properties": {
                "businessName": { "type": "string", "title": "Business Name" },
                "logoUrl": { "type": "string", "title": "Logo URL", "format": "image-url" },
                "ctaText": { "type": "string", "title": "Button Text" },
                "ctaLink": { "type": "string", "title": "Button Link", "format": "page-link" },
                "menu": {
                  "type": "array",
                  "title": "Navigation",
                  "items": {
                    "type": "object",
                    "properties": {
                      "label": { "type": "string", "title": "Label" },
                      "href": { "type": "string", "title": "Link", "format": "page-link" }
                    }
                  }
                }
              }
            }'::jsonb
        WHEN 'hero' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Headline" },
                "subtitle": { "type": "string", "title": "Subheadline", "format": "textarea" },
                "ctaText": { "type": "string", "title": "Button Text" },
                "ctaLink": { "type": "string", "title": "Button Link", "format": "page-link" },
                "imageUrl": { "type": "string", "title": "Image URL", "format": "image-url" }
              }
            }'::jsonb
        WHEN 'about' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Title" },
                "body": { "type": "string", "title": "Body", "format": "textarea" },
                "imageUrl": { "type": "string", "title": "Image URL", "format": "image-url" }
              }
            }'::jsonb
        WHEN 'services' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "showAllServices": { "type": "boolean", "title": "Show All Services" },
                "featuredCount": { "type": "number", "title": "Featured Count" },
                "showSelectButton": { "type": "boolean", "title": "Show Select Button" },
                "selectButtonText": { "type": "string", "title": "Select Button Text" }
              }
            }'::jsonb
        WHEN 'gallery' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "images": {
                  "type": "array",
                  "title": "Images",
                  "items": { "type": "string", "title": "Image URL", "format": "image-url" }
                }
              }
            }'::jsonb
        WHEN 'testimonials' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "testimonials": {
                  "type": "array",
                  "title": "Testimonials",
                  "items": {
                    "type": "object",
                    "properties": {
                      "quote": { "type": "string", "title": "Quote", "format": "textarea" },
                      "author": { "type": "string", "title": "Author" },
                      "role": { "type": "string", "title": "Role" }
                    }
                  }
                }
              }
            }'::jsonb
        WHEN 'contact' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "email": { "type": "string", "title": "Email" },
                "phone": { "type": "string", "title": "Phone" },
                "address": { "type": "string", "title": "Address" },
                "mapEmbedUrl": { "type": "string", "title": "Map Embed URL" },
                "ctaText": { "type": "string", "title": "Button Text" },
                "showForm": { "type": "boolean", "title": "Show Inquiry Form" }
              }
            }'::jsonb
        WHEN 'footer' THEN
            '{
              "type": "object",
              "properties": {
                "businessName": { "type": "string", "title": "Business Name" },
                "text": { "type": "string", "title": "Description", "format": "textarea" },
                "copyrightText": { "type": "string", "title": "Copyright Text" }
              }
            }'::jsonb
        WHEN 'booking-widget' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "helperText": { "type": "string", "title": "Helper Text" },
                "ctaText": { "type": "string", "title": "Button Text" },
                "showServices": { "type": "boolean", "title": "Show Services" },
                "showDatePicker": { "type": "boolean", "title": "Show Date Picker" }
              }
            }'::jsonb
        WHEN 'pricing' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "plans": {
                  "type": "array",
                  "title": "Plans",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string", "title": "Plan Name" },
                      "price": { "type": "string", "title": "Price" },
                      "cta": { "type": "string", "title": "Button Text" }
                    }
                  }
                }
              }
            }'::jsonb
        WHEN 'faq' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "faqs": {
                  "type": "array",
                  "title": "FAQ Items",
                  "items": {
                    "type": "object",
                    "properties": {
                      "q": { "type": "string", "title": "Question" },
                      "a": { "type": "string", "title": "Answer", "format": "textarea" }
                    }
                  }
                }
              }
            }'::jsonb
        WHEN 'team' THEN
            '{
              "type": "object",
              "properties": {
                "title": { "type": "string", "title": "Section Title" },
                "subtitle": { "type": "string", "title": "Subtitle" },
                "teamMembers": {
                  "type": "array",
                  "title": "Team Members",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string", "title": "Name" },
                      "role": { "type": "string", "title": "Role" },
                      "image": { "type": "string", "title": "Photo URL", "format": "image-url" }
                    }
                  }
                }
              }
            }'::jsonb
        ELSE '{ "type": "object", "properties": {} }'::jsonb
    END AS "schema_jsonb",
    CASE tr."feature_slug"
        WHEN 'services' THEN '{ "showPrice": true, "showDuration": true }'::jsonb
        WHEN 'contact' THEN '{ "showMap": false }'::jsonb
        ELSE '{}'::jsonb
    END AS "default_styles_jsonb",
    NULL AS "preview_image_url",
    true AS "is_active",
    NOW() AS "created_at",
    NOW() AS "updated_at"
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
