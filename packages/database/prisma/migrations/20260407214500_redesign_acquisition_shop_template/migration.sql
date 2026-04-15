UPDATE "page_templates"
SET
    "sections_jsonb" = $json$[
      {
        "themeComponentKey": "header/v6",
        "defaultContent": {
          "businessName": "Acquisition Shop",
          "menu": [
            { "label": "Process", "href": "#hero" },
            { "label": "Services", "href": "#services" },
            { "label": "Products", "href": "#products" },
            { "label": "Results", "href": "#reviews" },
            { "label": "Pricing", "href": "#pricing" },
            { "label": "Contact", "href": "#contact" }
          ],
          "ctaText": "Book Growth Call",
          "ctaLink": "#booking-widget"
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f6f1e7",
            "text": "#191d24",
            "primary": "#ff6a3d",
            "secondary": "#ffe9c9",
            "accent": "#1da99b",
            "font": "Space Grotesk, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v6",
        "defaultContent": {
          "eyebrow": "Acquisition Shop",
          "title": "Build a conversion system your team can operate every week.",
          "subtitle": "From offer framing to booked calls, this template turns traffic into revenue conversations without adding funnel chaos.",
          "primaryCtaText": "Book Strategy Call",
          "primaryCtaLink": "#booking-widget",
          "secondaryCtaText": "View Revenue Modules",
          "secondaryCtaLink": "#services",
          "proofItems": [
            { "label": "Avg. Launch Window", "value": "14 Days" },
            { "label": "Landing Conversion", "value": "5.1%" },
            { "label": "Booked Calls", "value": "340+" }
          ],
          "imageUrl": "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=1400"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "logos/v6",
        "defaultContent": {
          "eyebrow": "Trusted by revenue-led teams",
          "logos": [
            { "name": "Stripe" },
            { "name": "Shopify" },
            { "name": "HubSpot" },
            { "name": "Notion" },
            { "name": "Klaviyo" },
            { "name": "Slack" }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v6",
        "defaultContent": {
          "title": "Offer Stack",
          "subtitle": "Productized Revenue Assets",
          "showAllProducts": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true }
      },
      {
        "themeComponentKey": "services/v6",
        "defaultContent": {
          "title": "Revenue Modules Built for Execution",
          "subtitle": "Acquisition Workflow",
          "showSelectButton": true,
          "selectButtonText": "Use This Module",
          "showAllServices": true,
          "featuredCount": 6
        },
        "defaultStyles": { "showPrice": true, "showDuration": true }
      },
      {
        "themeComponentKey": "team/v6",
        "defaultContent": {
          "title": "Operators Behind the Pipeline",
          "subtitle": "A compact team structure built for weekly shipping",
          "teamMembers": [
            {
              "name": "Avery Brooks",
              "role": "Acquisition Lead",
              "image": "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=900",
              "bio": "Owns offer strategy, positioning, and funnel direction."
            },
            {
              "name": "Nora Vale",
              "role": "Creative Director",
              "image": "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&q=80&w=900",
              "bio": "Translates positioning into high-performing page systems."
            },
            {
              "name": "Ethan Cole",
              "role": "Automation Lead",
              "image": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=900",
              "bio": "Connects booking events to segmented follow-up flows."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v6",
        "defaultContent": {
          "title": "Proof From Recent Deployments",
          "subtitle": "Client Outcomes",
          "testimonials": [
            {
              "quote": "We moved from random campaigns to a repeatable system and doubled qualified calls in six weeks.",
              "author": "Mina Patel",
              "role": "Founder, DTC Beauty Brand"
            },
            {
              "quote": "The offer stack and booking flow gave our sales team cleaner intent and fewer no-shows.",
              "author": "Joshua Reed",
              "role": "Head of Revenue, B2B Services"
            },
            {
              "quote": "Every section now supports one goal: get the right prospect into the right conversation.",
              "author": "Celine Martin",
              "role": "Growth Director"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "pricing/v6",
        "defaultContent": {
          "title": "Choose the Growth Velocity",
          "subtitle": "Pricing Architecture",
          "plans": [
            {
              "name": "Starter",
              "price": "$49",
              "period": "/mo",
              "features": ["Core booking flow", "Offer messaging blocks", "Basic analytics"]
            },
            {
              "name": "Growth",
              "price": "$129",
              "period": "/mo",
              "highlighted": true,
              "features": ["Everything in Starter", "Conversion modules", "Automation handoff"]
            },
            {
              "name": "Scale",
              "price": "$249",
              "period": "/mo",
              "features": ["Everything in Growth", "Priority support", "Experiment cadence"]
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "faq/v6",
        "defaultContent": {
          "title": "Common Questions Before Launch",
          "subtitle": "Decision Support",
          "faqs": [
            {
              "question": "How quickly can this go live?",
              "answer": "Most teams launch in 10-14 days once core content and offer details are ready."
            },
            {
              "question": "Can we edit this without breaking design quality?",
              "answer": "Yes. Every section is CMS-editable with safe defaults and responsive behavior."
            },
            {
              "question": "Does this support services and products together?",
              "answer": "Yes. The lane is designed to combine product proof and service conversion in one flow."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "booking-widget/v6",
        "defaultContent": {
          "title": "Book a Revenue Mapping Call",
          "subtitle": "Next Step",
          "ctaText": "Confirm Booking",
          "showServices": true,
          "showDatePicker": true
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v6",
        "defaultContent": {
          "title": "Talk to the Growth Team",
          "subtitle": "Contact",
          "email": "growth@acquisitionshop.example",
          "phone": "+1 (800) 720-1001",
          "ctaText": "Send Request"
        },
        "defaultStyles": { "showMap": false }
      },
      {
        "themeComponentKey": "footer/v6",
        "defaultContent": {
          "businessName": "Acquisition Shop",
          "text": "Acquisition systems for teams that want clear execution and measurable pipeline growth.",
          "copyrightText": "© 2026 Acquisition Shop",
          "columns": [
            {
              "title": "Services",
              "links": [
                { "label": "Revenue Modules", "href": "#services" },
                { "label": "Pricing", "href": "#pricing" }
              ]
            },
            {
              "title": "Company",
              "links": [
                { "label": "Results", "href": "#reviews" },
                { "label": "Contact", "href": "#contact" }
              ]
            }
          ]
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'template-2026-acquisition-shop';
