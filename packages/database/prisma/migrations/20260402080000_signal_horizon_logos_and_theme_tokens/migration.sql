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
