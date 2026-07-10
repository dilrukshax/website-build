-- Rebuild all 12 seeded templates so each has exactly 12 sections.
-- Goals:
-- 1) Keep existing template IDs stable.
-- 2) Ensure each template has 12 sections (including footer).
-- 3) Increase template differentiation by using distinct section compositions/orders.

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v3",
        "defaultContent": {
          "businessName": "Motion Studio",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Products", "href": "#product" }
          ],
          "ctaText": "Book",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f8fbff",
            "text": "#0f172a",
            "primary": "#0ea5e9",
            "secondary": "#e0f2fe",
            "accent": "#22d3ee",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "Move Fast. Book Faster.",
          "subtitle": "High-energy layout built to convert traffic into confirmed bookings.",
          "ctaText": "Start Booking",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Built for Action",
          "body": "Clear storytelling paired with direct booking paths."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Popular Services",
          "subtitle": "Live synced from CMS.",
          "showSelectButton": true,
          "selectButtonText": "Choose Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v3",
        "defaultContent": {
          "title": "Featured Products",
          "subtitle": "Catalog products in the same conversion flow.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "gallery/v3",
        "defaultContent": {
          "title": "Recent Highlights",
          "subtitle": "Visual proof that supports trust before booking."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "Client Energy",
          "subtitle": "Recent customer outcomes and proof."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v3",
        "defaultContent": {
          "title": "Simple Plans",
          "subtitle": "Clear options to speed up decisions."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v3",
        "defaultContent": { "title": "Quick Questions" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book in 60 Seconds",
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
          "email": "hello@motionstudio.example",
          "phone": "+1 (800) 310-2026",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v3",
        "defaultContent": {
          "businessName": "Motion Studio",
          "text": "Animated brand experiences with measurable booking outcomes.",
          "copyrightText": "© 2026 Motion Studio"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-motion-studio';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Neon Grid Lab",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Team", "href": "#team" }
          ],
          "ctaText": "Start",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#0b1020",
            "text": "#f8fafc",
            "primary": "#3b82f6",
            "secondary": "#1f2937",
            "accent": "#10b981",
            "font": "Roboto, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "Precision Booking for Digital Teams",
          "subtitle": "Cyber-modern layout with high clarity and fast conversion flow.",
          "ctaText": "Open Slots",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Engineered for Scale",
          "body": "Predictable section flow for fast decision making."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Service Modules",
          "subtitle": "Operational services with one-click selection.",
          "showSelectButton": true,
          "selectButtonText": "Reserve Slot"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v2",
        "defaultContent": {
          "title": "Product Lines",
          "subtitle": "Attach product revenue to service funnels.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "team/v2",
        "defaultContent": {
          "title": "Specialist Operators",
          "subtitle": "A reliable team behind execution."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v2",
        "defaultContent": {
          "title": "Verified Results",
          "subtitle": "Real feedback from active customers."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v2",
        "defaultContent": {
          "title": "Access Tiers",
          "subtitle": "Flexible pricing for growth stages."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v2",
        "defaultContent": { "title": "Knowledge Base" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v2",
        "defaultContent": {
          "title": "Execute Booking",
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
          "email": "support@neongrid.example",
          "phone": "+1 (800) 410-2048",
          "ctaText": "Transmit"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v2",
        "defaultContent": {
          "businessName": "Neon Grid Lab",
          "text": "Futuristic UI with practical booking outcomes.",
          "copyrightText": "© 2026 Neon Grid Lab"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-neon-grid-lab';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v4",
        "defaultContent": {
          "businessName": "Elegant Concierge",
          "menu": [
            { "label": "Gallery", "href": "#gallery" },
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Reserve",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#ffffff",
            "text": "#2a2a2a",
            "primary": "#d4af37",
            "secondary": "#fdfbf7",
            "accent": "#a8862d",
            "font": "Playfair Display, serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v4",
        "defaultContent": {
          "title": "Private Experiences, Perfectly Curated",
          "subtitle": "Luxury-first page flow with strong booking intent.",
          "ctaText": "Request Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v4",
        "defaultContent": {
          "title": "Crafted with Intent",
          "body": "Editorial presentation with conversion-safe structure."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "gallery/v4",
        "defaultContent": {
          "title": "Curated Moments",
          "subtitle": "Visual social proof for high-trust offers."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Signature Services",
          "subtitle": "Premium services with clear selection path.",
          "showSelectButton": true,
          "selectButtonText": "Select Experience"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v4",
        "defaultContent": {
          "title": "Premium Products",
          "subtitle": "Complementary products for concierge clients.",
          "showAllProducts": true,
          "featuredCount": 4
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "testimonials/v4",
        "defaultContent": {
          "title": "Client Reflections",
          "subtitle": "Endorsements from returning guests."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v4",
        "defaultContent": {
          "title": "Memberships & Packages",
          "subtitle": "Transparent tiers for premium support."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v4",
        "defaultContent": { "title": "Guest Questions" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v4",
        "defaultContent": {
          "title": "Reserve Your Experience",
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
          "email": "concierge@atelier.example",
          "phone": "+1 (800) 510-2099",
          "ctaText": "Send Request"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v4",
        "defaultContent": {
          "businessName": "Elegant Concierge",
          "text": "Luxury design language with measurable booking performance.",
          "copyrightText": "© 2026 Elegant Concierge"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-elegant-concierge';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Clean Appointments",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Pricing", "href": "#pricing" }
          ],
          "ctaText": "Book",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#ffffff",
            "text": "#0f172a",
            "primary": "#2563eb",
            "secondary": "#e2e8f0",
            "accent": "#f59e0b",
            "font": "Inter, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v1",
        "defaultContent": {
          "title": "Simple Booking for Busy Teams",
          "subtitle": "Friendly, clear, and frictionless booking UX.",
          "ctaText": "Book Appointment",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v1",
        "defaultContent": {
          "title": "Why Clients Choose Us",
          "body": "Consistent quality with transparent process."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v1",
        "defaultContent": {
          "title": "Core Services",
          "subtitle": "Service list synced from CMS.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v1",
        "defaultContent": {
          "title": "Products",
          "subtitle": "Cross-sell products in the same journey.",
          "showAllProducts": true,
          "featuredCount": 4
        },
        "defaultStyles": { "showPrice": true }
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
        "themeComponentKey": "pricing/v1",
        "defaultContent": {
          "title": "Simple Pricing",
          "subtitle": "No hidden fees, no confusion."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v1",
        "defaultContent": { "title": "Frequently Asked Questions" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v1",
        "defaultContent": {
          "title": "Book Your Spot",
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
          "email": "hello@cleanappointments.example",
          "phone": "+1 (800) 611-2300",
          "ctaText": "Send Message"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v1",
        "defaultContent": {
          "businessName": "Clean Appointments",
          "text": "Clean digital booking journeys for modern businesses.",
          "copyrightText": "© 2026 Clean Appointments"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-clean-appointments';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v3",
        "defaultContent": {
          "businessName": "Fusion Growth",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Proof", "href": "#testimonials" }
          ],
          "ctaText": "Inquire",
          "ctaLink": "#contact"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#faf5ff",
            "text": "#312e81",
            "primary": "#3b82f6",
            "secondary": "#ede9fe",
            "accent": "#f97316",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "Story + Performance",
          "subtitle": "A growth page that balances narrative and conversion.",
          "ctaText": "View Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Trusted by",
          "logos": [
            { "name": "Notion" },
            { "name": "HubSpot" },
            { "name": "Stripe" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Primary Offers",
          "subtitle": "Clear offer stack with booking-first actions.",
          "showSelectButton": true,
          "selectButtonText": "Book This"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v3",
        "defaultContent": {
          "title": "Product Add-ons",
          "subtitle": "Increase order value with bundled products.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "team/v3",
        "defaultContent": {
          "title": "Growth Team",
          "subtitle": "Operators in strategy, delivery, and retention."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "Trusted by Clients",
          "subtitle": "Proof from real customer journeys."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v3",
        "defaultContent": {
          "title": "Transparent Plans",
          "subtitle": "Simple options with clear value."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v3",
        "defaultContent": { "title": "Common Questions" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book an Appointment",
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
          "email": "growth@fusionone.example",
          "phone": "+1 (800) 707-2801",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v3",
        "defaultContent": {
          "businessName": "Fusion Growth",
          "text": "Distinct visual direction with predictable conversion patterns.",
          "copyrightText": "© 2026 Fusion Growth"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-fusion-growth';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v5",
        "defaultContent": {
          "projectName": "Signal Horizon",
          "menu": [
            { "label": "Overview", "href": "#hero" },
            { "label": "Features", "href": "#services" },
            { "label": "Book", "href": "#booking-widget" }
          ],
          "ctaText": "Get Started",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#0b1121",
            "text": "#ffffff",
            "primary": "#22d3ee",
            "secondary": "#1e293b",
            "accent": "#ef4444",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Flexible growth workspace",
          "title": "Launch a sharper digital presence",
          "subtitle": "Video-first hero with clear action path.",
          "primaryCtaText": "Start Free",
          "primaryCtaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Trusted by",
          "logos": [
            { "name": "Stripe" },
            { "name": "Notion" },
            { "name": "Shopify" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v5",
        "defaultContent": {
          "title": "Built to explain value feature by feature",
          "subtitle": "High-contrast feature cards with clear hierarchy."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v5",
        "defaultContent": {
          "title": "Product Showcase",
          "subtitle": "Dark-mode product cards with direct conversion intent.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "about/v4",
        "defaultContent": {
          "title": "Positioning",
          "body": "Use this block to frame your product narrative before proof and booking."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v5",
        "defaultContent": {
          "title": "What people are saying",
          "subtitle": "A review wall that keeps proof visible and scannable."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v4",
        "defaultContent": {
          "title": "Plans",
          "subtitle": "Simple plans to support free-to-paid conversion."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v5",
        "defaultContent": { "title": "Questions, answered clearly" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v4",
        "defaultContent": {
          "title": "Book Your Session",
          "ctaText": "Confirm Slot",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v4",
        "defaultContent": {
          "title": "Talk to the Team",
          "email": "hello@signalhorizon.example",
          "phone": "+1 (800) 720-1000",
          "ctaText": "Send Request"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v5",
        "defaultContent": {
          "businessName": "Signal Horizon",
          "text": "High-contrast marketing theme with conversion-ready structure.",
          "copyrightText": "© 2026 Signal Horizon"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-signal-horizon';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v4",
        "defaultContent": {
          "businessName": "Acquisition Shop",
          "menu": [
            { "label": "Products", "href": "#product" },
            { "label": "Services", "href": "#services" }
          ],
          "ctaText": "Start Order",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#fffbf5",
            "text": "#2a2116",
            "primary": "#b7791f",
            "secondary": "#f6ead8",
            "accent": "#d97706",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v4",
        "defaultContent": {
          "title": "Turn Product Traffic Into Qualified Bookings",
          "subtitle": "Commerce-first flow with clear product and service lanes.",
          "ctaText": "Book a Demo",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Used by",
          "logos": [
            { "name": "Stripe" },
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
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Revenue Modules",
          "subtitle": "Deployment services to increase revenue velocity.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "team/v4",
        "defaultContent": {
          "title": "Growth Team",
          "subtitle": "Operators behind acquisition and retention."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v4",
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
          "subtitle": "Clear plans designed for scale."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v4",
        "defaultContent": { "title": "Questions, Answered" },
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
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v4",
        "defaultContent": {
          "businessName": "Acquisition Shop",
          "text": "Product-led conversion pages for modern commerce teams.",
          "copyrightText": "© 2026 Acquisition Shop"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-acquisition-shop';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Prism Grid Conversion",
          "menu": [
            { "label": "Gallery", "href": "#gallery" },
            { "label": "Services", "href": "#services" }
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
            "font": "Inter, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "A Clear Funnel For High-Intent Visitors",
          "subtitle": "Guide traffic through proof, detail, and action.",
          "ctaText": "See Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Built for Consistency",
          "body": "Balanced sections and strong readability across devices."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "gallery/v2",
        "defaultContent": {
          "title": "Visual Case Samples",
          "subtitle": "Quick snapshots of recent outcomes."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Offer Stack",
          "subtitle": "Operational services with clear conversion cues.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v2",
        "defaultContent": {
          "title": "Products",
          "subtitle": "Attach product revenue to your funnel.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "team/v2",
        "defaultContent": {
          "title": "Execution Team",
          "subtitle": "Cross-functional specialists behind delivery."
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
        "themeComponentKey": "faq/v2",
        "defaultContent": { "title": "FAQ" },
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
          "ctaText": "Submit"
        },
        "defaultStyles": { "showMap": false }
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
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-prism-grid-conversion';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v1",
        "defaultContent": {
          "businessName": "Salesforce Pipeline",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Pricing", "href": "#pricing" }
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
            "font": "Inter, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v1",
        "defaultContent": {
          "title": "Guide Every Lead Into The Right Service",
          "subtitle": "Enterprise-ready clarity with low-friction actions.",
          "ctaText": "Book Consultation",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Platform partners",
          "logos": [
            { "name": "Salesforce" },
            { "name": "HubSpot" },
            { "name": "Slack" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v1",
        "defaultContent": {
          "title": "Enterprise-Ready Messaging",
          "body": "Straightforward language and transparent next steps."
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
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v1",
        "defaultContent": {
          "title": "Products",
          "subtitle": "Relevant products aligned to service outcomes.",
          "showAllProducts": true,
          "featuredCount": 4
        },
        "defaultStyles": { "showPrice": true }
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
        "defaultContent": { "title": "Frequently Asked Questions" },
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
          "ctaText": "Send Message"
        },
        "defaultStyles": { "showMap": false }
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
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-salesforce-pipeline';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Velocity VSL",
          "menu": [
            { "label": "Watch", "href": "#hero" },
            { "label": "Offer", "href": "#services" }
          ],
          "ctaText": "Book Call",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#020617",
            "text": "#f8fafc",
            "primary": "#f97316",
            "secondary": "#1e293b",
            "accent": "#38bdf8",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v5",
        "defaultContent": {
          "eyebrow": "Video Sales Funnel",
          "title": "A Video-First Landing Page That Moves Visitors To Action",
          "subtitle": "Use story, proof, and direct booking flow in one page.",
          "primaryCtaText": "Book Strategy Call",
          "primaryCtaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Narrative-Driven Conversion",
          "body": "Persuasive storytelling while preserving clear booking UX."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Offer Breakdown",
          "subtitle": "Core modules that convert viewers into buyers.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v2",
        "defaultContent": {
          "title": "Product Stack",
          "subtitle": "Attach products directly to the VSL flow.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "testimonials/v2",
        "defaultContent": {
          "title": "Proof Section",
          "subtitle": "Outcomes from teams using this page structure."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v2",
        "defaultContent": {
          "title": "Investment",
          "subtitle": "Simple options to start fast."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v2",
        "defaultContent": { "title": "Common Questions" },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "As seen with",
          "logos": [
            { "name": "YouTube" },
            { "name": "Meta" },
            { "name": "Google" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v2",
        "defaultContent": {
          "title": "Book Your Call",
          "ctaText": "Confirm Slot",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v2",
        "defaultContent": {
          "title": "Need Custom Scope?",
          "email": "team@velocityvsl.example",
          "phone": "+1 (800) 720-1004",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v2",
        "defaultContent": {
          "businessName": "Velocity VSL",
          "text": "Video-first sales architecture with booking-ready conversion.",
          "copyrightText": "© 2026 Velocity VSL"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-velocity-vsl';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v4",
        "defaultContent": {
          "businessName": "Aurora Atelier",
          "menu": [
            { "label": "Gallery", "href": "#gallery" },
            { "label": "Services", "href": "#services" }
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
            "font": "Playfair Display, serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v4",
        "defaultContent": {
          "title": "Private Experiences, Beautifully Presented",
          "subtitle": "Premium visual language with direct booking flow.",
          "ctaText": "Request Availability",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v4",
        "defaultContent": {
          "title": "Crafted For Premium Positioning",
          "body": "Sophisticated hierarchy with practical conversion steps."
        },
        "defaultStyles": {}
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
        "themeComponentKey": "services/v4",
        "defaultContent": {
          "title": "Signature Services",
          "subtitle": "High-value services with clarity.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "team/v4",
        "defaultContent": {
          "title": "Senior Team",
          "subtitle": "Concierge-level execution across the journey."
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
        "themeComponentKey": "product/v4",
        "defaultContent": {
          "title": "Boutique Products",
          "subtitle": "Curated products matched to premium services.",
          "showAllProducts": true,
          "featuredCount": 4
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "faq/v4",
        "defaultContent": { "title": "Guest Questions" },
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
          "ctaText": "Send Request"
        },
        "defaultStyles": { "showMap": false }
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
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-aurora-atelier';

UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v3",
        "defaultContent": {
          "businessName": "Spectrum Prime",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Products", "href": "#product" }
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
            "font": "Inter, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "A Complete Booking Website In One Template",
          "subtitle": "Balanced layout with proof, pricing, and direct conversion.",
          "ctaText": "Get Started",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Designed For Consistent Growth",
          "body": "Fresh visuals with predictable booking behavior."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Core Services",
          "subtitle": "Live synced from your CMS catalog.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "product/v3",
        "defaultContent": {
          "title": "Products",
          "subtitle": "Attach catalog products to service conversion paths.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "logos/v5",
        "defaultContent": {
          "eyebrow": "Backed by",
          "logos": [
            { "name": "Notion" },
            { "name": "Figma" },
            { "name": "Stripe" }
          ]
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
        "defaultContent": { "title": "FAQs" },
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
          "ctaText": "Send Message"
        },
        "defaultStyles": { "showMap": false }
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
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-spectrum-prime';
