-- Add two blog-focused page templates that use concrete blog section versions.

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
    'Service-led blog template with featured editorial cards and direct booking conversion blocks.',
    'https://placehold.co/1200x800/f8fafc/0f172a?text=Blog+Authority+Hub',
    $tpl_blog2$[
      {
        "themeComponentKey": "header/v2",
        "defaultContent": {
          "businessName": "Authority Hub",
          "menu": [
            { "label": "Services", "href": "#services" },
            { "label": "Blog", "href": "#blog" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "Book Consultation",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f8fafc",
            "text": "#0f172a",
            "primary": "#ef4444",
            "secondary": "#fee2e2",
            "accent": "#14b8a6",
            "font": "Space Grotesk, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v2",
        "defaultContent": {
          "title": "Publish Trusted Insights That Convert",
          "subtitle": "Blend educational blog content with service CTAs in one clean page flow.",
          "ctaText": "See Available Slots",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v2",
        "defaultContent": {
          "title": "Editorial + Service Strategy",
          "body": "Turn every article into a credibility asset that supports buyer decisions and booking intent."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "blog/v2",
        "defaultContent": {
          "title": "Latest Articles",
          "subtitle": "Auto-synced from your CMS blog module.",
          "showAllPosts": false,
          "featuredCount": 4,
          "ctaText": "Browse All Posts",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "showExcerpt": true,
          "showFeaturedImage": true,
          "showPublishDate": true,
          "showReadMore": true,
          "readMoreText": "Read Article"
        }
      },
      {
        "themeComponentKey": "services/v2",
        "defaultContent": {
          "title": "Core Services",
          "subtitle": "All service cards are pulled from your live CMS data.",
          "showSelectButton": true,
          "selectButtonText": "Select Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "testimonials/v2",
        "defaultContent": {
          "title": "Client Outcomes",
          "subtitle": "Recent feedback from customers using this framework."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v2",
        "defaultContent": {
          "title": "Related Products",
          "subtitle": "Optional upsell blocks connected to your catalog.",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": {
          "showPrice": true
        }
      },
      {
        "themeComponentKey": "pricing/v2",
        "defaultContent": {
          "title": "Service Packages",
          "subtitle": "Keep pricing transparent for higher trust and faster qualification."
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
        "themeComponentKey": "booking-widget/v2",
        "defaultContent": {
          "title": "Book Your Session",
          "ctaText": "Confirm Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v2",
        "defaultContent": {
          "title": "Need a Custom Plan?",
          "email": "hello@authorityhub.example",
          "phone": "+1 (800) 320-2026",
          "ctaText": "Send Message"
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v2",
        "defaultContent": {
          "businessName": "Blog Authority Hub",
          "text": "Editorial-first website template for service teams that publish and convert.",
          "copyrightText": "© 2026 Blog Authority Hub"
        },
        "defaultStyles": {}
      }
    ]$tpl_blog2$::jsonb,
    false,
    true,
    NOW(),
    NOW()
),
(
    'template-2026-editorial-conversion-desk',
    'Editorial Conversion Desk',
    'Narrative-focused blog template with stacked article cards, trust sections, and booking handoff.',
    'https://placehold.co/1200x800/fff7ed/7c2d12?text=Editorial+Conversion+Desk',
    $tpl_blog3$[
      {
        "themeComponentKey": "header/v3",
        "defaultContent": {
          "businessName": "Editorial Desk",
          "menu": [
            { "label": "Blog", "href": "#blog" },
            { "label": "Services", "href": "#services" },
            { "label": "FAQ", "href": "#faq" }
          ],
          "ctaText": "Start Consultation",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#fff7ed",
            "text": "#1f2937",
            "primary": "#f97316",
            "secondary": "#ffedd5",
            "accent": "#ef4444",
            "font": "Outfit, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v3",
        "defaultContent": {
          "title": "Stories That Earn Attention and Action",
          "subtitle": "Use your blog as the trust layer that prepares visitors for service selection.",
          "ctaText": "Book Strategy Call",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "blog/v3",
        "defaultContent": {
          "title": "From the Editorial Desk",
          "subtitle": "Live posts from your CMS blog catalog.",
          "showAllPosts": true,
          "featuredCount": 3,
          "ctaText": "Visit Blog Index",
          "ctaLink": "/blog"
        },
        "defaultStyles": {
          "showExcerpt": true,
          "showFeaturedImage": true,
          "showPublishDate": true,
          "showReadMore": true,
          "readMoreText": "Read Full Story"
        }
      },
      {
        "themeComponentKey": "about/v3",
        "defaultContent": {
          "title": "Built for Reliable Publishing",
          "body": "A practical section flow that helps teams ship weekly content without sacrificing conversion clarity."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v3",
        "defaultContent": {
          "title": "Execution Services",
          "subtitle": "Connect your educational content directly to offer selection.",
          "showSelectButton": true,
          "selectButtonText": "Use This Service"
        },
        "defaultStyles": {
          "showPrice": true,
          "showDuration": true
        }
      },
      {
        "themeComponentKey": "team/v3",
        "defaultContent": {
          "title": "Editorial + Delivery Team",
          "subtitle": "Writers, strategists, and operators focused on measurable outcomes."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v3",
        "defaultContent": {
          "title": "What Clients Report",
          "subtitle": "Recent outcomes from teams applying this publish-and-convert system."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v3",
        "defaultContent": {
          "title": "Packages",
          "subtitle": "Choose the scope that fits your publishing and conversion goals."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v3",
        "defaultContent": {
          "title": "Before You Book"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v3",
        "defaultContent": {
          "title": "Book an Editorial Strategy Session",
          "ctaText": "Request Slot",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v3",
        "defaultContent": {
          "title": "Talk To The Team",
          "email": "hello@editorialdesk.example",
          "phone": "+1 (800) 410-2026",
          "ctaText": "Send Inquiry"
        },
        "defaultStyles": {
          "showMap": false
        }
      },
      {
        "themeComponentKey": "footer/v3",
        "defaultContent": {
          "businessName": "Editorial Conversion Desk",
          "text": "A publish-ready theme for blog-led service conversion websites.",
          "copyrightText": "© 2026 Editorial Conversion Desk"
        },
        "defaultStyles": {}
      }
    ]$tpl_blog3$::jsonb,
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