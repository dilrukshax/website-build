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
