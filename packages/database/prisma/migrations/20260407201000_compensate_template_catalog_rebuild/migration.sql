-- Compensation migration: revert the template catalog data rewrite from 20260407190000.
-- Strategy: reapply the pre-rebuild canonical migration chain for template/theme catalog payloads.
-- This keeps migration history intact while restoring expected template data semantics.

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260331113000_add_five_templates/migration.sql
-- Add five distinct page templates for the website builder catalog.
-- Each template includes services, booking, and inquiry/contact sections.

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
    'template-2026-motion-studio',
    'Motion Studio',
    'High-energy animated layout for modern brands with playful motion and a fast booking flow.',
    'https://placehold.co/1200x800/0f172a/38bdf8?text=Motion+Studio',
    $tpl1$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Motion Studio",
          "menu": [
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Book",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "Move Fast. Book Faster.",
          "subtitle": "A bold animated website experience designed to turn visitors into confirmed appointments.",
          "ctaText": "Start Booking",
          "ctaLink": "#booking-widget",
          "imageUrl": "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=1600"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Built for Action",
          "body": "From discovery to confirmation, every section is optimized for conversion with vibrant visuals and clear calls to action."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Popular Services",
          "subtitle": "Live services sync automatically from your CMS catalog.",
          "showSelectButton": true,
          "selectButtonText": "Choose Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "gallery/v3",
        "defaultContent": {
          "title": "Recent Highlights",
          "subtitle": "A quick visual reel of your best work."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "Client Energy",
          "subtitle": "Real experiences from clients who booked online."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book in 60 Seconds",
          "helperText": "Select a service, pick a date, and confirm instantly.",
          "ctaText": "Confirm Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v3",
        "defaultContent": {
          "title": "Need a Custom Request?",
          "subtitle": "Send us your inquiry and we will reply quickly.",
          "email": "hello@motionstudio.example",
          "phone": "+1 (800) 310-2026",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v3",
        "defaultContent": {
          "title": "Quick Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Motion Studio",
          "text": "Animated brand experiences that still convert cleanly on mobile.",
          "copyrightText": "© 2026 Motion Studio. All rights reserved."
        },
        "defaultStyles": {}
      }
    ]$tpl1$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-neon-grid-lab',
    'Neon Grid Lab',
    'Cyber-modern template with glassmorphism, strong contrast, and conversion-focused booking modules.',
    'https://placehold.co/1200x800/020617/22d3ee?text=Neon+Grid+Lab',
    $tpl2$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Neon Grid",
          "menu": [
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Start",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "Precision Booking for Digital Teams",
          "subtitle": "Launch a futuristic brand site that captures leads and turns them into scheduled sessions.",
          "ctaText": "Open Slots",
          "ctaLink": "#booking-widget",
          "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1600"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Engineered for Scale",
          "body": "Every section is tuned for speed, conversion, and high-clarity messaging on both mobile and desktop."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Service Modules",
          "subtitle": "Configure and publish your offerings without code.",
          "spotlightTitle": "Automation Ready",
          "showSelectButton": true,
          "selectButtonText": "Reserve Slot"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v2",
        "defaultContent": {
          "title": "Specialist Operators",
          "subtitle": "A reliable team powering fast delivery."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v2",
        "defaultContent": {
          "title": "Verified Results",
          "subtitle": "Feedback from teams using the platform in production."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v2",
        "defaultContent": {
          "title": "Access Tiers",
          "subtitle": "Flexible plans for solo operators and growing teams."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v2",
        "defaultContent": {
          "title": "Execute Booking",
          "helperText": "Select a service and lock the time instantly.",
          "ctaText": "Submit Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v2",
        "defaultContent": {
          "title": "Open a Secure Inquiry",
          "subtitle": "Need a custom scope? Send your requirements.",
          "email": "support@neongrid.example",
          "phone": "+1 (800) 410-2048",
          "ctaText": "Transmit"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v2",
        "defaultContent": {
          "title": "Knowledge Base"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Neon Grid",
          "text": "Futuristic brand systems with practical booking outcomes.",
          "copyrightText": "© 2026 Neon Grid. All rights reserved."
        },
        "defaultStyles": {}
      }
    ]$tpl2$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-elegant-concierge',
    'Elegant Concierge',
    'Luxury-forward storytelling template with premium presentation, booking conversion, and private inquiry flow.',
    'https://placehold.co/1200x800/111827/fbbf24?text=Elegant+Concierge',
    $tpl3$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Atelier",
          "menu": [
            { "label": "Collections", "href": "#services" }
          ],
          "ctaText": "Reserve",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v4",
        "defaultContent": {
          "title": "Private Experiences, Perfectly Curated",
          "subtitle": "A premium digital presence for high-touch service brands that rely on trust and presentation.",
          "ctaText": "Request Availability",
          "ctaLink": "#booking-widget",
          "imageUrl": "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&q=80&w=1600"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v4",
        "defaultContent": {
          "title": "Crafted with Intent",
          "body": "This template balances visual elegance and practical booking UX so visitors can move from admiration to confirmed appointments."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Signature Services",
          "subtitle": "Premium offerings presented with clarity and detail.",
          "showSelectButton": true,
          "selectButtonText": "Select Experience"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "gallery/v4",
        "defaultContent": {
          "title": "Curated Moments",
          "subtitle": "A visual collection that reinforces trust and quality."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v4",
        "defaultContent": {
          "title": "Client Reflections",
          "subtitle": "Endorsements from guests and returning clients."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v4",
        "defaultContent": {
          "title": "Memberships & Packages",
          "subtitle": "Transparent plans designed for long-term relationships."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v4",
        "defaultContent": {
          "title": "Reserve Your Experience",
          "helperText": "Choose your service and preferred time window.",
          "ctaText": "Submit Reservation",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v4",
        "defaultContent": {
          "title": "Private Inquiries",
          "subtitle": "For bespoke requests, send us your preferred details.",
          "email": "concierge@atelier.example",
          "phone": "+1 (800) 510-2099",
          "ctaText": "Send Request"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v4",
        "defaultContent": {
          "title": "Guest Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Atelier",
          "text": "Private service design with measurable booking performance.",
          "copyrightText": "© 2026 Atelier Concierge. All rights reserved."
        },
        "defaultStyles": {}
      }
    ]$tpl3$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-clean-appointments',
    'Clean Appointments',
    'Clear and friendly conversion template with straightforward sections for services, booking, and inquiries.',
    'https://placehold.co/1200x800/f8fafc/0f172a?text=Clean+Appointments',
    $tpl4$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "BrightCare",
          "menu": [
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Book",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v1",
        "defaultContent": {
          "title": "Simple Booking for Busy Teams",
          "subtitle": "A clean layout that highlights your services and helps visitors book without confusion.",
          "ctaText": "Book Appointment",
          "ctaLink": "#booking-widget",
          "imageUrl": "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=1600"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v1",
        "defaultContent": {
          "title": "Why Clients Choose Us",
          "body": "Consistent quality, transparent pricing, and a booking process that works smoothly on every device."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v1",
        "defaultContent": {
          "title": "Core Services",
          "subtitle": "Published directly from your CMS service catalog.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v1",
        "defaultContent": {
          "title": "Meet the Team",
          "subtitle": "Friendly experts ready to help."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v1",
        "defaultContent": {
          "title": "What Clients Say",
          "subtitle": "Recent feedback from booked appointments."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v1",
        "defaultContent": {
          "title": "Frequently Asked Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v1",
        "defaultContent": {
          "title": "Book Your Spot",
          "helperText": "Choose your service and preferred date to continue.",
          "ctaText": "Confirm Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v1",
        "defaultContent": {
          "title": "Send an Inquiry",
          "subtitle": "Ask a question and our team will get back shortly.",
          "email": "hello@brightcare.example",
          "phone": "+1 (800) 611-2300",
          "ctaText": "Send Message",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "BrightCare",
          "text": "Clean digital booking journeys for modern service businesses.",
          "copyrightText": "© 2026 BrightCare. All rights reserved."
        },
        "defaultStyles": {}
      }
    ]$tpl4$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-fusion-growth',
    'Fusion Growth',
    'A mixed-style conversion template combining energetic hero sections with premium service and inquiry blocks.',
    'https://placehold.co/1200x800/111827/f97316?text=Fusion+Growth',
    $tpl5$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Fusion One",
          "menu": [
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Inquire",
          "ctaLink": "#contact"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "Convert More Visitors Into Confirmed Clients",
          "subtitle": "Blend striking visuals with practical booking UX in a single mobile-first page flow.",
          "ctaText": "View Availability",
          "ctaLink": "#booking-widget",
          "imageUrl": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Story + Performance",
          "body": "Fusion Growth is designed for businesses that need stronger storytelling without sacrificing measurable booking outcomes."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Primary Offers",
          "subtitle": "Showcase your services with confidence and clear booking paths.",
          "showSelectButton": true,
          "selectButtonText": "Book This"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "gallery/v2",
        "defaultContent": {
          "title": "Work Preview",
          "subtitle": "Visual proof that builds confidence before booking."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "Trusted by Clients",
          "subtitle": "Social proof from real customer journeys."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v1",
        "defaultContent": {
          "title": "Transparent Plans",
          "subtitle": "Simple options with clear value."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v1",
        "defaultContent": {
          "title": "Book an Appointment",
          "helperText": "Choose a service and reserve your slot.",
          "ctaText": "Book Now",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v3",
        "defaultContent": {
          "title": "Project Inquiries",
          "subtitle": "Tell us about your goals and timeline.",
          "email": "growth@fusionone.example",
          "phone": "+1 (800) 707-2801",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v2",
        "defaultContent": {
          "title": "Common Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Fusion One",
          "text": "Distinct design directions with strong booking conversion patterns.",
          "copyrightText": "© 2026 Fusion One. All rights reserved."
        },
        "defaultStyles": {}
      }
    ]$tpl5$::jsonb,
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

-- END REAPPLY: packages/database/prisma/migrations/20260331113000_add_five_templates/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260401103000_add_signal_horizon_free_theme/migration.sql
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

-- END REAPPLY: packages/database/prisma/migrations/20260401103000_add_signal_horizon_free_theme/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260402080001_add_logos_feature_and_theme/migration.sql
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

-- END REAPPLY: packages/database/prisma/migrations/20260402080001_add_logos_feature_and_theme/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260402080000_signal_horizon_logos_and_theme_tokens/migration.sql
-- Update Signal Horizon template:
-- 1. Inject dark themeTokens into the header section's defaultStyles
--    so the builder-preview page can pick them up and render correctly.
-- 2. Add a logos/v5 "As Featured In" section between hero and services.

UPDATE "page_templates"
SET
    "sections_jsonb" = $sections$[
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
        "defaultStyles": {
          "themeTokens": {
            "background": "#0b1121",
            "text": "#ffffff",
            "primary": "#eab308",
            "secondary": "#151f38",
            "accent": "#ef4444",
            "font": "\"Inter\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Proven Funnel Frameworks",
          "title": "Launch Your Course or High-Ticket Offer in 7 Days — Done For You.",
          "subtitle": "We build your entire backend while you focus on what you do best. Stop wasting time on tech headaches and let our experts wire up the ecosystem.",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "videoPosterUrl": "https://placehold.co/1200x720/151f38/ffffff?text=Product+Walkthrough",
          "primaryCtaText": "Book Your Launch Now",
          "primaryCtaLink": "#features",
          "secondaryCtaText": "See How It Works",
          "secondaryCtaLink": "#video",
          "proofItems": [
            { "label": "Active Clients", "value": "18+" },
            { "label": "Revenue Generated", "value": "$1M+" },
            { "label": "Active Flows", "value": "179+" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Trusted by Teams at",
          "logos": [
            { "name": "Stripe" },
            { "name": "Shopify" },
            { "name": "HubSpot" },
            { "name": "Notion" },
            { "name": "Linear" },
            { "name": "Vercel" },
            { "name": "Figma" },
            { "name": "Intercom" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v5",
        "defaultContent": {
          "title": "Get a Complete Funnel Ecosystem, Without Lifting a Finger",
          "subtitle": "We build out every element needed to scale your digital products, so you can just launch.",
          "bottomCtaText": "Book Your Setup Call",
          "bottomCtaLink": "#booking-widget",
          "items": [
            {
              "eyebrow": "System",
              "title": "Lead Capture, Segmentation & Nurturing Workflows",
              "description": "Custom forms natively segment and score leads based on input, connecting directly to CRM."
            },
            {
              "eyebrow": "Design",
              "title": "Sales pages with RTL Integration",
              "description": "Fast-loading page templates with built-in analytics, tracking and conversion metrics."
            },
            {
              "eyebrow": "Pricing",
              "title": "Low/ticket to Mid-Ticket Offer Setup",
              "description": "Full flow defined for seamless upsells and cross-sells straight to profitability."
            },
            {
              "eyebrow": "Acquisition",
              "title": "High-Ticket Booking & Application Funnel",
              "description": "Qualify and book directly on calendar. Only serious buyers enter your pipeline."
            },
            {
              "eyebrow": "Retention",
              "title": "Email automation sequences (Onboarding/Cart)",
              "description": "Campaigns automatically trigger abandoned cart recovery or client onboarding series."
            },
            {
              "eyebrow": "Delivery",
              "title": "Fully branded Member/Community Portal",
              "description": "Everything built and hosted inside beautifully designed spaces for customers."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v5",
        "defaultContent": {
          "title": "What people are saying",
          "subtitle": "Real results from founders, operators, and creators who went live with our ecosystem.",
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
    ]$sections$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-signal-horizon';

-- END REAPPLY: packages/database/prisma/migrations/20260402080000_signal_horizon_logos_and_theme_tokens/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260406190000_add_product_feature_section_themes/migration.sql
-- Add product feature and section theme catalog entries (v1-v6).
-- Also backfill existing templates that include services so they include a matching product section.

INSERT INTO "features" ("id", "name", "slug", "description", "created_at")
VALUES (
    'feature-product',
    'Products',
    'product',
    'Product catalog section with catalog-driven pricing, images, and descriptions.',
    NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description";

WITH product_feature AS (
    SELECT "id"
    FROM "features"
    WHERE "slug" = 'product'
),
target_versions AS (
    SELECT generate_series(1, 6)::int AS "version"
),
theme_rows AS (
    SELECT
        'theme-product-v' || tv."version" AS "id",
        pf."id" AS "feature_id",
        'Product Catalog v' || tv."version" AS "name",
        'product' AS "slug",
        tv."version" AS "version",
        'product/v' || tv."version" AS "component_key"
    FROM product_feature pf
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
    tr."id",
    tr."feature_id",
    tr."name",
    tr."slug",
    tr."version",
    tr."component_key",
    100,
    '{
      "type": "object",
      "properties": {
        "title": { "type": "string", "title": "Section Title" },
        "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
        "showAllProducts": { "type": "boolean", "title": "Show All Products" },
        "featuredCount": { "type": "number", "title": "Featured Count" },
        "ctaText": { "type": "string", "title": "Button Text" },
        "ctaLink": { "type": "string", "title": "Button Link", "format": "page-link" },
        "productsList": {
          "type": "array",
          "title": "Fallback Products",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string", "title": "Title" },
              "name": { "type": "string", "title": "Name" },
              "desc": { "type": "string", "title": "Description", "format": "textarea" },
              "description": { "type": "string", "title": "Description", "format": "textarea" },
              "imageUrl": { "type": "string", "title": "Image URL", "format": "image-url" },
              "price": { "type": "number", "title": "Price" },
              "currency": { "type": "string", "title": "Currency" },
              "badge": { "type": "string", "title": "Badge" }
            }
          }
        }
      }
    }'::jsonb,
    '{ "showPrice": true }'::jsonb,
    NULL,
    true,
    NOW(),
    NOW()
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

WITH templates_to_update AS (
    SELECT
        pt."id",
        pt."sections_jsonb"
    FROM "page_templates" pt
    WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(pt."sections_jsonb") AS element
        WHERE (element ->> 'themeComponentKey') LIKE 'services/v%'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(pt."sections_jsonb") AS element
        WHERE (element ->> 'themeComponentKey') LIKE 'product/v%'
    )
),
rebuilt_templates AS (
    SELECT
        t."id",
        (
            SELECT jsonb_agg(merged."section" ORDER BY merged."sort_key")
            FROM (
                SELECT
                    element."value" AS "section",
                    element."ordinality" * 2 AS "sort_key"
                FROM jsonb_array_elements(t."sections_jsonb") WITH ORDINALITY AS element("value", "ordinality")

                UNION ALL

                SELECT
                    jsonb_build_object(
                        'themeComponentKey',
                        CASE
                            WHEN svc."service_version" BETWEEN 1 AND 6 THEN 'product/v' || svc."service_version"::text
                            ELSE 'product/v1'
                        END,
                        'defaultContent',
                        jsonb_build_object(
                            'title', 'Featured Products',
                            'subtitle', 'Products sync automatically from your CMS product catalog.',
                            'showAllProducts', true,
                            'featuredCount', 6
                        ),
                        'defaultStyles',
                        jsonb_build_object('showPrice', true)
                    ) AS "section",
                    svc."service_order" * 2 + 1 AS "sort_key"
                FROM (
                    SELECT
                        element."ordinality" AS "service_order",
                        COALESCE(substring(element."value" ->> 'themeComponentKey' FROM 'services/v([0-9]+)')::int, 1) AS "service_version"
                    FROM jsonb_array_elements(t."sections_jsonb") WITH ORDINALITY AS element("value", "ordinality")
                    WHERE (element."value" ->> 'themeComponentKey') LIKE 'services/v%'
                    ORDER BY element."ordinality"
                    LIMIT 1
                ) AS svc
            ) AS merged
        ) AS "new_sections_jsonb"
    FROM templates_to_update t
)
UPDATE "page_templates" pt
SET
    "sections_jsonb" = rebuilt."new_sections_jsonb",
    "updated_at" = NOW()
FROM rebuilt_templates rebuilt
WHERE pt."id" = rebuilt."id";

-- END REAPPLY: packages/database/prisma/migrations/20260406190000_add_product_feature_section_themes/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260407120000_add_five_new_page_templates/migration.sql
-- Add five additional page templates so the catalog reaches 11 templates
-- before the final backfill migration adds the 12th template.

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
    'template-2026-acquisition-shop',
    'Acquisition Shop',
    'Acquisition-style storefront template with a bold hero, product+service blocks, and conversion-focused booking flow.',
    'https://placehold.co/1200x800/0b1121/f59e0b?text=Acquisition+Shop',
    $tpl1$[
      {
        "themeComponentKey": "header/v5",
        "defaultContent": {
          "projectName": "Acquisition Shop",
          "menu": [
            { "label": "Products", "href": "#product" },
            { "label": "Services", "href": "#services" },
            { "label": "Book", "href": "#booking-widget" }
          ],
          "ctaText": "Start Order",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#0b1121",
            "text": "#ffffff",
            "primary": "#f59e0b",
            "secondary": "#18233f",
            "accent": "#22d3ee",
            "font": "\"Outfit\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Conversion Storefront",
          "title": "Turn Product Traffic Into Qualified Bookings",
          "subtitle": "Showcase products and premium services in one clear sales flow.",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "videoPosterUrl": "https://placehold.co/1200x720/111827/f8fafc?text=Acquisition+Shop",
          "primaryCtaText": "Book a Demo",
          "primaryCtaLink": "#booking-widget",
          "secondaryCtaText": "Browse Products",
          "secondaryCtaLink": "#product"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Trusted by",
          "logos": [
            { "name": "Stripe" },
            { "name": "Shopify" },
            { "name": "HubSpot" },
            { "name": "Notion" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v6",
        "defaultContent": {
          "title": "Top Products",
          "subtitle": "Auto-synced from your CMS catalog.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v5",
        "defaultContent": {
          "title": "Revenue Modules",
          "subtitle": "Deploy done-for-you services with clear booking actions."
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v4",
        "defaultContent": {
          "title": "Growth Team",
          "subtitle": "Operators behind acquisition, fulfillment, and retention."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v5",
        "defaultContent": {
          "title": "What Customers Report",
          "subtitle": "Recent outcomes from stores using this funnel."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v4",
        "defaultContent": {
          "title": "Packages",
          "subtitle": "Clear pricing tiers to improve decision speed."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v5",
        "defaultContent": {
          "title": "Questions, Answered"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v4",
        "defaultContent": {
          "title": "Book a Strategy Session",
          "ctaText": "Submit Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v4",
        "defaultContent": {
          "title": "Talk With Sales",
          "email": "sales@acquisitionshop.example",
          "phone": "+1 (800) 720-1001",
          "ctaText": "Send Inquiry",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v5",
        "defaultContent": {
          "businessName": "Acquisition Shop",
          "text": "Product-led conversion pages for modern commerce teams.",
          "copyrightText": "© 2026 Acquisition Shop"
        },
        "defaultStyles": {}
      }
    ]$tpl1$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-prism-grid-conversion',
    'Prism Grid Conversion',
    'Modern conversion template with stacked narrative sections and high-clarity dark mode visual language.',
    'https://placehold.co/1200x800/0f172a/f97316?text=Prism+Grid+Conversion',
    $tpl2$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Prism Grid Conversion",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Pricing", "href": "#pricing" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "Book",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#0f172a",
            "text": "#ffffff",
            "primary": "#f97316",
            "secondary": "#1e293b",
            "accent": "#38bdf8",
            "font": "\"Inter\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "A Clear Funnel For High-Intent Visitors",
          "subtitle": "Guide visitors through proof, pricing, and direct booking in one flow.",
          "ctaText": "See Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Built for Consistency",
          "body": "Balanced sections, readable type scale, and mobile-ready spacing across the page."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Offer Stack",
          "subtitle": "All services are synced directly from CMS.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v2",
        "defaultContent": {
          "title": "Execution Team",
          "subtitle": "Design, operations, and client success in one unit."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v2",
        "defaultContent": {
          "title": "Verified Wins",
          "subtitle": "Proof from teams using this conversion stack."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v2",
        "defaultContent": {
          "title": "Choose a Plan",
          "subtitle": "Simple tiering for launch and scale."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v2",
        "defaultContent": {
          "title": "FAQ"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v2",
        "defaultContent": {
          "title": "Reserve Your Slot",
          "ctaText": "Book Now",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v2",
        "defaultContent": {
          "title": "Send Requirements",
          "email": "support@prismgrid.example",
          "phone": "+1 (800) 720-1002",
          "ctaText": "Submit",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v2",
        "defaultContent": {
          "businessName": "Prism Grid Conversion",
          "text": "Modern conversion architecture for booking-first brands.",
          "copyrightText": "© 2026 Prism Grid Conversion"
        },
        "defaultStyles": {}
      }
    ]$tpl2$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-salesforce-pipeline',
    'Salesforce Pipeline',
    'Enterprise-inspired landing template with guided hero path, proof sections, and dependable booking conversion.',
    'https://placehold.co/1200x800/e2e8f0/0f172a?text=Salesforce+Pipeline',
    $tpl3$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Salesforce Pipeline",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Team", "href": "#team" },
            { "label": "FAQ", "href": "#faq" }
          ],
          "ctaText": "Schedule",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#ffffff",
            "text": "#0f172a",
            "primary": "#0ea5e9",
            "secondary": "#e2e8f0",
            "accent": "#16a34a",
            "font": "\"Inter\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v1",
        "defaultContent": {
          "title": "Guide Every Lead Into The Right Service",
          "subtitle": "A simple and trustworthy layout built for B2B conversion clarity.",
          "ctaText": "Book Consultation",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v1",
        "defaultContent": {
          "title": "Enterprise-Ready Messaging",
          "body": "Use straightforward language and clear next steps to reduce funnel drop-off."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v1",
        "defaultContent": {
          "title": "Services",
          "subtitle": "Pulled from your live CMS catalog.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v1",
        "defaultContent": {
          "title": "Advisory Team",
          "subtitle": "Consultants and operators driving delivery quality."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v1",
        "defaultContent": {
          "title": "Client Feedback",
          "subtitle": "What buyers report after implementation."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v1",
        "defaultContent": {
          "title": "Plans",
          "subtitle": "Transparent options for each growth phase."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v1",
        "defaultContent": {
          "title": "Frequently Asked Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v1",
        "defaultContent": {
          "title": "Schedule A Call",
          "ctaText": "Submit",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v1",
        "defaultContent": {
          "title": "Contact Sales",
          "email": "sales@salesforcepipeline.example",
          "phone": "+1 (800) 720-1003",
          "ctaText": "Send Message",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Salesforce Pipeline",
          "text": "High-clarity enterprise layout for predictable pipeline growth.",
          "copyrightText": "© 2026 Salesforce Pipeline"
        },
        "defaultStyles": {}
      }
    ]$tpl3$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-velocity-vsl',
    'Velocity VSL',
    'Video-led sales letter template with strong proof structure and direct booking CTA flow.',
    'https://placehold.co/1200x800/101828/f8fafc?text=Velocity+VSL',
    $tpl4$[
      {
        "themeComponentKey": "header/v5",
        "defaultContent": {
          "projectName": "Velocity VSL",
          "menu": [
            { "label": "Watch", "href": "#hero" },
            { "label": "Modules", "href": "#services" },
            { "label": "Book", "href": "#booking-widget" }
          ],
          "ctaText": "Book Call",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#111827",
            "text": "#ffffff",
            "primary": "#f97316",
            "secondary": "#1f2937",
            "accent": "#22d3ee",
            "font": "\"Outfit\", sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Video Sales Funnel",
          "title": "A Video-First Landing Page That Moves Visitors To Action",
          "subtitle": "Use story, proof, and one-click booking flow in a single page.",
          "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
          "videoPosterUrl": "https://placehold.co/1200x720/111827/f8fafc?text=Velocity+VSL",
          "primaryCtaText": "Book Strategy Call",
          "primaryCtaLink": "#booking-widget",
          "secondaryCtaText": "See Offer",
          "secondaryCtaLink": "#services"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Narrative-Driven Conversion",
          "body": "This template prioritizes a persuasive video narrative while preserving clean booking UX."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v5",
        "defaultContent": {
          "title": "Offer Breakdown",
          "subtitle": "Core modules that convert viewers into buyers."
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v3",
        "defaultContent": {
          "title": "Performance Team",
          "subtitle": "Experts in VSL scripting, design, and conversion ops."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v5",
        "defaultContent": {
          "title": "Proof Section",
          "subtitle": "Outcomes from teams using this page structure."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v3",
        "defaultContent": {
          "title": "Investment",
          "subtitle": "Simple options to start fast."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v5",
        "defaultContent": {
          "title": "Common Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book Your Call",
          "ctaText": "Confirm Slot",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v3",
        "defaultContent": {
          "title": "Need Custom Scope?",
          "email": "team@velocityvsl.example",
          "phone": "+1 (800) 720-1004",
          "ctaText": "Send Inquiry",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v5",
        "defaultContent": {
          "businessName": "Velocity VSL",
          "text": "Video-first sales architecture with booking-ready conversion flow.",
          "copyrightText": "© 2026 Velocity VSL"
        },
        "defaultStyles": {}
      }
    ]$tpl4$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-aurora-atelier',
    'Aurora Atelier',
    'Elegant service template balancing editorial aesthetics with consistent booking conversion patterns.',
    'https://placehold.co/1200x800/111827/fbbf24?text=Aurora+Atelier',
    $tpl5$[
      {
        "themeComponentKey": "header/v4",
        "defaultContent": {
          "businessName": "Aurora Atelier",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Gallery", "href": "#gallery" },
            { "label": "Book", "href": "#booking-widget" }
          ],
          "ctaText": "Reserve",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#ffffff",
            "text": "#111827",
            "primary": "#ca8a04",
            "secondary": "#f5f5f4",
            "accent": "#b91c1c",
            "font": "\"Playfair Display\", serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v4",
        "defaultContent": {
          "title": "Private Experiences, Beautifully Presented",
          "subtitle": "A premium template for high-trust service brands that convert elegantly.",
          "ctaText": "Request Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v4",
        "defaultContent": {
          "title": "Crafted For Premium Positioning",
          "body": "Use sophisticated visual hierarchy while keeping conversion steps clear and fast."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Signature Services",
          "subtitle": "Showcase high-value services with strong clarity.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "gallery/v4",
        "defaultContent": {
          "title": "Curated Highlights",
          "subtitle": "Visual proof of quality and consistency."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "team/v4",
        "defaultContent": {
          "title": "Senior Team",
          "subtitle": "Concierge-level execution across the full journey."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v4",
        "defaultContent": {
          "title": "Client Reflections",
          "subtitle": "Stories from returning clients and partners."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v4",
        "defaultContent": {
          "title": "Packages",
          "subtitle": "Transparent options for one-time and recurring engagements."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v4",
        "defaultContent": {
          "title": "Guest Questions"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v4",
        "defaultContent": {
          "title": "Reserve Your Session",
          "ctaText": "Submit Reservation",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v4",
        "defaultContent": {
          "title": "Private Inquiries",
          "email": "concierge@auroraatelier.example",
          "phone": "+1 (800) 720-1005",
          "ctaText": "Send Request",
          "showForm": true
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v4",
        "defaultContent": {
          "businessName": "Aurora Atelier",
          "text": "Elegant design language backed by practical booking outcomes.",
          "copyrightText": "© 2026 Aurora Atelier"
        },
        "defaultStyles": {}
      }
    ]$tpl5$::jsonb,
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

-- END REAPPLY: packages/database/prisma/migrations/20260407120000_add_five_new_page_templates/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260407133000_seed_theme_pack_versions_and_backfill_templates/migration.sql
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
            "primary": "#2563eb",
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

-- END REAPPLY: packages/database/prisma/migrations/20260407133000_seed_theme_pack_versions_and_backfill_templates/migration.sql

-- BEGIN REAPPLY: packages/database/prisma/migrations/20260407153000_normalize_template_tokens_and_section_packs/migration.sql
-- Normalize template packs and token payloads for visual consistency.
-- Goals:
-- 1) Ensure templates carry explicit themeTokens for preview/apply font+palette consistency.
-- 2) Align mixed header/footer version keys with each template's main visual pack.
-- 3) Remove high-risk mixed-version combinations that caused white-on-white text in some templates.

-- Motion Studio: align header/footer to v3 and seed explicit v3-oriented tokens.
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                "sections_jsonb",
                '{0,themeComponentKey}',
                '"header/v3"'::jsonb,
                false
            ),
            '{10,themeComponentKey}',
            '"footer/v3"'::jsonb,
            false
        ),
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#f8fbff",
          "text": "#0f172a",
          "primary": "#0ea5e9",
          "secondary": "#e0f2fe",
          "accent": "#22d3ee",
          "font": "\"Outfit\", sans-serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-motion-studio';

-- Neon Grid Lab: align header/footer to v2 and seed explicit dark v2 tokens.
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                "sections_jsonb",
                '{0,themeComponentKey}',
                '"header/v2"'::jsonb,
                false
            ),
            '{11,themeComponentKey}',
            '"footer/v2"'::jsonb,
            false
        ),
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#111827",
          "text": "#f9fafb",
          "primary": "#3b82f6",
          "secondary": "#1f2937",
          "accent": "#10b981",
          "font": "\"Roboto\", sans-serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-neon-grid-lab';

-- Elegant Concierge: align header/footer to v4 and seed explicit luxury v4 tokens.
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                "sections_jsonb",
                '{0,themeComponentKey}',
                '"header/v4"'::jsonb,
                false
            ),
            '{11,themeComponentKey}',
            '"footer/v4"'::jsonb,
            false
        ),
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#ffffff",
          "text": "#2a2a2a",
          "primary": "#d4af37",
          "secondary": "#fdfbf7",
          "accent": "#a8862d",
          "font": "\"Playfair Display\", serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-elegant-concierge';

-- Clean Appointments: keep v1 pack, add explicit v1-oriented tokens.
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        "sections_jsonb",
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#ffffff",
          "text": "#0f172a",
          "primary": "#2563eb",
          "secondary": "#e2e8f0",
          "accent": "#f59e0b",
          "font": "\"Inter\", sans-serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-clean-appointments';

-- Fusion Growth: normalize full section pack to v3 family and seed v3 tokens.
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            "sections_jsonb",
                                            '{0,themeComponentKey}',
                                            '"header/v3"'::jsonb,
                                            false
                                        ),
                                        '{1,themeComponentKey}',
                                        '"hero/v3"'::jsonb,
                                        false
                                    ),
                                    '{3,themeComponentKey}',
                                    '"services/v3"'::jsonb,
                                    false
                                ),
                                '{4,themeComponentKey}',
                                '"product/v3"'::jsonb,
                                false
                            ),
                            '{5,themeComponentKey}',
                            '"gallery/v3"'::jsonb,
                            false
                        ),
                        '{7,themeComponentKey}',
                        '"pricing/v3"'::jsonb,
                        false
                    ),
                    '{8,themeComponentKey}',
                    '"booking-widget/v3"'::jsonb,
                    false
                ),
                '{10,themeComponentKey}',
                '"faq/v3"'::jsonb,
                false
            ),
            '{11,themeComponentKey}',
            '"footer/v3"'::jsonb,
            false
        ),
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#faf5ff",
          "text": "#312e81",
          "primary": "#3b82f6",
          "secondary": "#ede9fe",
          "accent": "#f97316",
          "font": "\"Outfit\", sans-serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-fusion-growth';

-- Velocity VSL: normalize to a full v2 pack (distinct dark conversion style).
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                "sections_jsonb",
                                                '{0,themeComponentKey}',
                                                '"header/v2"'::jsonb,
                                                false
                                            ),
                                            '{1,themeComponentKey}',
                                            '"hero/v2"'::jsonb,
                                            false
                                        ),
                                        '{2,themeComponentKey}',
                                        '"about/v2"'::jsonb,
                                        false
                                    ),
                                    '{3,themeComponentKey}',
                                    '"services/v2"'::jsonb,
                                    false
                                ),
                                '{4,themeComponentKey}',
                                '"team/v2"'::jsonb,
                                false
                            ),
                            '{5,themeComponentKey}',
                            '"testimonials/v2"'::jsonb,
                            false
                        ),
                        '{6,themeComponentKey}',
                        '"pricing/v2"'::jsonb,
                        false
                    ),
                    '{7,themeComponentKey}',
                    '"faq/v2"'::jsonb,
                    false
                ),
                '{8,themeComponentKey}',
                '"booking-widget/v2"'::jsonb,
                false
            ),
            '{9,themeComponentKey}',
            '"contact/v2"'::jsonb,
            false
        ),
        '{10,themeComponentKey}',
        '"footer/v2"'::jsonb,
        false
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-velocity-vsl';

UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        "sections_jsonb",
        '{0,defaultStyles,themeTokens}',
        '{
          "background": "#020617",
          "text": "#f8fafc",
          "primary": "#f97316",
          "secondary": "#1e293b",
          "accent": "#38bdf8",
          "font": "\"Outfit\", sans-serif"
        }'::jsonb,
        true
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-velocity-vsl';

-- Acquisition Shop: normalize to a full v4 pack (premium commerce layout).
UPDATE "page_templates"
SET
    "sections_jsonb" = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            jsonb_set(
                                                jsonb_set(
                                                    "sections_jsonb",
                                                    '{0,themeComponentKey}',
                                                    '"header/v4"'::jsonb,
                                                    false
                                                ),
                                                '{1,themeComponentKey}',
                                                '"hero/v4"'::jsonb,
                                                false
                                            ),
                                            '{2,themeComponentKey}',
                                            '"about/v4"'::jsonb,
                                            false
                                        ),
                                        '{3,themeComponentKey}',
                                        '"product/v4"'::jsonb,
                                        false
                                    ),
                                    '{4,themeComponentKey}',
                                    '"services/v4"'::jsonb,
                                    false
                                ),
                                '{6,themeComponentKey}',
                                '"testimonials/v4"'::jsonb,
                                false
                            ),
                            '{8,themeComponentKey}',
                            '"faq/v4"'::jsonb,
                            false
                        ),
                        '{11,themeComponentKey}',
                        '"footer/v4"'::jsonb,
                        false
                    ),
                    '{2,defaultContent}',
                    '{
                      "title": "Built for High-Intent Buyers",
                      "body": "A focused storefront structure for premium products, high-clarity service positioning, and predictable conversion outcomes."
                    }'::jsonb,
                    true
                ),
                '{0,defaultStyles,themeTokens}',
                '{
                  "background": "#fffbf5",
                  "text": "#2a2116",
                  "primary": "#b7791f",
                  "secondary": "#f6ead8",
                  "accent": "#d97706",
                  "font": "\"Playfair Display\", serif"
                }'::jsonb,
                true
            ),
            '{5,themeComponentKey}',
            '"team/v4"'::jsonb,
            false
        ),
        '{7,themeComponentKey}',
        '"pricing/v4"'::jsonb,
        false
    ),
    "updated_at" = NOW()
WHERE "id" = 'template-2026-acquisition-shop';

-- END REAPPLY: packages/database/prisma/migrations/20260407153000_normalize_template_tokens_and_section_packs/migration.sql
