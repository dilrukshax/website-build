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
