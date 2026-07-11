-- Add one final template so the seeded template catalog reaches 12.
-- This migration is idempotent via ON CONFLICT.

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
    'template-2026-spectrum-prime',
    'Spectrum Prime',
    'Balanced all-purpose template with modern hierarchy, responsive sections, and consistent CTA styling.',
    'https://placehold.co/1200x800/e2e8f0/1e293b?text=Spectrum+Prime',
    $tpl$[
      {
        "themeComponentKey": "header/v3",
        "defaultContent": {
          "businessName": "Spectrum Prime",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Team", "href": "#team" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "Book Now",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f8fafc",
            "text": "#0f172a",
            "primary": "#dc2626",
            "secondary": "#e2e8f0",
            "accent": "#ea580c",
            "font": "\"Inter\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "A Complete Booking Website In One High-Performing Template",
          "subtitle": "Use a balanced layout system with clear proof and conversion blocks.",
          "ctaText": "Get Started",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Designed For Consistent Growth",
          "body": "This template keeps visuals fresh while preserving predictable booking outcomes."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Core Services",
          "subtitle": "Live synced from your CMS service catalog.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v3",
        "defaultContent": {
          "title": "Our Team",
          "subtitle": "Specialists focused on quality and delivery."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "Client Reviews",
          "subtitle": "Real feedback from recent projects."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v3",
        "defaultContent": {
          "title": "Pricing",
          "subtitle": "Transparent options for different stages."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v3",
        "defaultContent": {
          "title": "FAQs"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book Your Session",
          "ctaText": "Submit Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v3",
        "defaultContent": {
          "title": "Contact Us",
          "email": "hello@spectrumprime.example",
          "phone": "+1 (800) 720-1006",
          "ctaText": "Send Message",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v3",
        "defaultContent": {
          "businessName": "Spectrum Prime",
          "text": "Balanced design language for reliable booking conversion.",
          "copyrightText": "© 2026 Spectrum Prime"
        },
        "defaultStyles": {}
      }
    ]$tpl$::jsonb,
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
