WITH feature_map AS (
    SELECT "id", "slug"
    FROM "features"
    WHERE "slug" IN ('header', 'hero', 'testimonials', 'about', 'product', 'services', 'team', 'contact', 'footer')
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
    'theme-' || fm."slug" || '-v14',
    fm."id",
    CASE fm."slug"
        WHEN 'header' THEN 'Harmozi VSL Header'
        WHEN 'hero' THEN 'Harmozi VSL Hero'
        WHEN 'testimonials' THEN 'Harmozi VSL Testimonials'
        WHEN 'about' THEN 'Harmozi VSL About'
        WHEN 'product' THEN 'Harmozi VSL Product Grid'
        WHEN 'services' THEN 'Harmozi VSL Playbooks'
        WHEN 'team' THEN 'Harmozi VSL Audience Cards'
        WHEN 'contact' THEN 'Harmozi VSL Newsletter'
        WHEN 'footer' THEN 'Harmozi VSL Footer'
    END,
    fm."slug",
    14,
    fm."slug" || '/v14',
    100,
    CASE fm."slug"
        WHEN 'header' THEN '{
          "type": "object",
          "properties": {
            "logoImageUrl": { "type": "string", "title": "Logo Image URL" },
            "logoLink": { "type": "string", "title": "Logo Link", "format": "page-link" },
            "currencyLabel": { "type": "string", "title": "Currency Label" },
            "cartCount": { "type": "string", "title": "Cart Count" },
            "menu": {
              "type": "array",
              "title": "Navigation",
              "items": {
                "type": "object",
                "properties": {
                  "label": { "type": "string", "title": "Label" },
                  "href": { "type": "string", "title": "Link", "format": "page-link" }
                },
                "required": ["label", "href"]
              }
            },
            "socialLinks": {
              "type": "array",
              "title": "Mobile Social Links",
              "items": {
                "type": "object",
                "properties": {
                  "label": { "type": "string", "title": "Label" },
                  "href": { "type": "string", "title": "Link" },
                  "iconUrl": { "type": "string", "title": "Icon URL" }
                },
                "required": ["label", "href", "iconUrl"]
              }
            }
          }
        }'::jsonb
        WHEN 'hero' THEN '{
          "type": "object",
          "properties": {
            "badgePrefix": { "type": "string", "title": "Badge Prefix" },
            "badgeText": { "type": "string", "title": "Badge Text" },
            "title": { "type": "string", "title": "Headline" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "ratingText": { "type": "string", "title": "Rating Text" },
            "primaryCtaText": { "type": "string", "title": "Primary CTA Text" },
            "primaryCtaLink": { "type": "string", "title": "Primary CTA Link", "format": "page-link" },
            "secondaryCtaText": { "type": "string", "title": "Secondary CTA Text" },
            "secondaryCtaLink": { "type": "string", "title": "Secondary CTA Link", "format": "page-link" },
            "proofText": { "type": "string", "title": "Proof Text" },
            "avatarImageUrl": { "type": "string", "title": "Proof Avatar URL" },
            "heroImageUrl": { "type": "string", "title": "Hero Image URL" }
          }
        }'::jsonb
        WHEN 'testimonials' THEN '{
          "type": "object",
          "properties": {
            "variant": { "type": "string", "title": "Variant" },
            "eyebrow": { "type": "string", "title": "Eyebrow" },
            "title": { "type": "string", "title": "Title" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "ctaText": { "type": "string", "title": "CTA Text" },
            "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
            "testimonials": {
              "type": "array",
              "title": "Testimonials",
              "items": {
                "type": "object",
                "properties": {
                  "imageUrl": { "type": "string", "title": "Image URL" },
                  "title": { "type": "string", "title": "Review Title" },
                  "quote": { "type": "string", "title": "Quote", "format": "textarea" },
                  "author": { "type": "string", "title": "Author" },
                  "role": { "type": "string", "title": "Role" }
                },
                "required": ["quote", "author"]
              }
            }
          }
        }'::jsonb
        WHEN 'about' THEN '{
          "type": "object",
          "properties": {
            "variant": { "type": "string", "title": "Variant" },
            "eyebrow": { "type": "string", "title": "Eyebrow" },
            "title": { "type": "string", "title": "Title" },
            "body": { "type": "string", "title": "Body", "format": "textarea" },
            "imageUrl": { "type": "string", "title": "Image URL" },
            "ctaText": { "type": "string", "title": "CTA Text" },
            "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
            "proofText": { "type": "string", "title": "Proof Text" },
            "avatarsImageUrl": { "type": "string", "title": "Proof Image URL" },
            "bullets": {
              "type": "array",
              "title": "Bullets",
              "items": {
                "type": "object",
                "properties": {
                  "title": { "type": "string", "title": "Title" },
                  "description": { "type": "string", "title": "Description", "format": "textarea" }
                },
                "required": ["title", "description"]
              }
            }
          }
        }'::jsonb
        WHEN 'product' THEN '{
          "type": "object",
          "properties": {
            "variant": { "type": "string", "title": "Variant" },
            "eyebrow": { "type": "string", "title": "Eyebrow" },
            "title": { "type": "string", "title": "Title" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "items": {
              "type": "array",
              "title": "Cards",
              "items": {
                "type": "object",
                "properties": {
                  "badge": { "type": "string", "title": "Badge" },
                  "imageUrl": { "type": "string", "title": "Image URL" },
                  "ratingText": { "type": "string", "title": "Rating Text" },
                  "title": { "type": "string", "title": "Title" },
                  "description": { "type": "string", "title": "Description", "format": "textarea" },
                  "price": { "type": "string", "title": "Price" },
                  "ctaText": { "type": "string", "title": "CTA Text" },
                  "ctaLink": { "type": "string", "title": "CTA Link", "format": "page-link" },
                  "featured": { "type": "boolean", "title": "Featured" }
                },
                "required": ["title", "description", "ctaText", "ctaLink"]
              }
            }
          }
        }'::jsonb
        WHEN 'services' THEN '{
          "type": "object",
          "properties": {
            "title": { "type": "string", "title": "Title" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "items": {
              "type": "array",
              "title": "Playbook Cards",
              "items": {
                "type": "object",
                "properties": {
                  "number": { "type": "string", "title": "Number" },
                  "title": { "type": "string", "title": "Title" },
                  "description": { "type": "string", "title": "Description", "format": "textarea" }
                },
                "required": ["title", "description"]
              }
            }
          }
        }'::jsonb
        WHEN 'team' THEN '{
          "type": "object",
          "properties": {
            "title": { "type": "string", "title": "Title" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "cards": {
              "type": "array",
              "title": "Audience Cards",
              "items": {
                "type": "object",
                "properties": {
                  "imageUrl": { "type": "string", "title": "Icon URL" },
                  "title": { "type": "string", "title": "Title" },
                  "description": { "type": "string", "title": "Description", "format": "textarea" }
                },
                "required": ["title", "description"]
              }
            }
          }
        }'::jsonb
        WHEN 'contact' THEN '{
          "type": "object",
          "properties": {
            "title": { "type": "string", "title": "Title" },
            "subtitle": { "type": "string", "title": "Subtitle", "format": "textarea" },
            "emailPlaceholder": { "type": "string", "title": "Email Placeholder" },
            "buttonText": { "type": "string", "title": "Button Text" },
            "disclaimer": { "type": "string", "title": "Disclaimer", "format": "textarea" }
          }
        }'::jsonb
        WHEN 'footer' THEN '{
          "type": "object",
          "properties": {
            "logoImageUrl": { "type": "string", "title": "Logo Image URL" },
            "helpText": { "type": "string", "title": "Help Text" },
            "helpEmail": { "type": "string", "title": "Help Email" },
            "address": { "type": "string", "title": "Address", "format": "textarea" },
            "disclaimer": { "type": "string", "title": "Disclaimer", "format": "textarea" },
            "ownership": { "type": "string", "title": "Ownership Notice", "format": "textarea" },
            "copyrightText": { "type": "string", "title": "Copyright Text" }
          }
        }'::jsonb
        ELSE '{ "type": "object", "properties": {} }'::jsonb
    END,
    '{}'::jsonb,
    CASE WHEN fm."slug" = 'hero'
        THEN 'https://shop.acquisition.com/cdn/shop/files/2d-mm_1000x137e.png?v=1755445841'
        ELSE NULL
    END,
    true,
    NOW(),
    NOW()
FROM feature_map fm
ON CONFLICT ("slug", "version") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "component_key" = EXCLUDED."component_key",
    "schema_jsonb" = EXCLUDED."schema_jsonb",
    "default_styles_jsonb" = EXCLUDED."default_styles_jsonb",
    "preview_image_url" = EXCLUDED."preview_image_url",
    "is_active" = EXCLUDED."is_active",
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
    'template-2026-harmozi-vsl',
    'Harmozi VSL',
    'Storefront-style VSL lane rebuilt from the Acquisition shop long-form book sales page.',
    'https://shop.acquisition.com/cdn/shop/files/2d-mm_1000x137e.png?v=1755445841',
    $json$[
      {
        "themeComponentKey": "header/v14",
        "defaultContent": {
          "logoImageUrl": "https://shop.acquisition.com/cdn/shop/files/Acquisition.com-Logo-Primary-Horizontal-Sambucus_4eb1e.png?v=1686710888&width=1738",
          "logoLink": "#hero",
          "currencyLabel": "USD",
          "cartCount": "0",
          "menu": [
            { "label": "Home", "href": "#hero" },
            { "label": "Shop", "href": "#offers" },
            { "label": "Scaling Workshop", "href": "#about-acquisition" }
          ],
          "socialLinks": [
            { "label": "Instagram", "href": "https://www.instagram.com/acquisitioncom/", "iconUrl": "https://shop.acquisition.com/cdn/shop/files/Instagram_100x1008146.svg?v=1696662132" },
            { "label": "Twitter", "href": "https://x.com/acquisitioncom", "iconUrl": "https://shop.acquisition.com/cdn/shop/files/Twitter_100x1003e9d.svg?v=1696662247" },
            { "label": "YouTube", "href": "https://www.youtube.com/@Acquisitioncom", "iconUrl": "https://shop.acquisition.com/cdn/shop/files/Youtube_100x100a444.svg?v=1696662208" }
          ]
        },
        "defaultStyles": {
          "themeTokens": {
            "background": "#f7f5f1",
            "text": "#151515",
            "primary": "#ef4444",
            "secondary": "#f4f4f4",
            "accent": "#ff8d3b",
            "font": "Poppins, sans-serif"
          }
        }
      },
      {
        "themeComponentKey": "hero/v14",
        "defaultContent": {
          "badgePrefix": "World Record:",
          "badgeText": "$100M Money Models",
          "title": "World-Record Breaking - $100M Money Models",
          "ratingText": "RATED 4.9/5 ON AMAZON",
          "primaryCtaText": "Get $100M Money Models",
          "primaryCtaLink": "#offers",
          "proofText": "Sold over 800,000+ Copies worldwide",
          "avatarImageUrl": "https://shop.acquisition.com/cdn/shop/files/AVATARSh_1000x0740.png?v=1695848115",
          "heroImageUrl": "https://shop.acquisition.com/cdn/shop/files/2d-mm_1000x137e.png?v=1755445841"
        },
        "defaultStyles": {
          "sectionBackgroundColor": "#12141f",
          "sectionTextColor": "#ffffff",
          "primaryButtonBackgroundColor": "#ffffff",
          "primaryButtonTextColor": "#151515"
        }
      },
      {
        "themeComponentKey": "testimonials/v14",
        "defaultContent": {
          "variant": "cards",
          "eyebrow": "loved by leading entrepreneurs in the space",
          "title": "WHAT ENTREPRENEURS Say about $100m LEADS",
          "subtitle": "See what they say",
          "testimonials": [
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/81rIBlL_TWL_400x400a25b.jpg?v=1696404122",
              "quote": "\"Alex's book is an absolute masterclass in how to get leads. He explains each concept in an easy to understand, concise manner that is straight to the point with executable action steps in each section.\"",
              "author": "Lance Watson",
              "role": "Verified Customer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/71Y0cfz1aXL_400x4007996.jpg?v=1696404200",
              "quote": "\"One of the most actionable books I've read in years. Every chapter turned into a real play I could use immediately.\"",
              "author": "Brandon Hall",
              "role": "Verified Customer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/61DSwfxxFgL_400x4007677.jpg?v=1696404269",
              "quote": "\"If you run a business and need more demand, this is the book. It simplifies lead generation without dumbing it down.\"",
              "author": "Olivia Brooks",
              "role": "Verified Customer"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v14",
        "defaultContent": {
          "variant": "promo",
          "eyebrow": "Announcing $100M Leads",
          "title": "Read these 273-pages if you want 2x, 5x or 100x your leads within the next 12 months",
          "body": "Use the tactics in this book and you'll force leads to find you. Before you can blink, you'll have complete strangers attracted to you and wanting to buy from you. Using the $100M Leads method, it's easier than ever to make a fortune because having lots of leads makes it easy to get rich and stay rich.",
          "imageUrl": "https://shop.acquisition.com/cdn/shop/t/15/assets/Placeholder-Imagehd2a9.jpg?v=49460024173020463491762187179",
          "ctaText": "DISCOVER $100m leads",
          "ctaLink": "#offers"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v14",
        "defaultContent": {
          "variant": "packs",
          "eyebrow": "2023 NEW RELEASE: $100m leads",
          "title": "LEArn how to GET STRANGERS to BUY YOUR STUFF",
          "items": [
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/SINGLE_B_1000xf256.png?v=1710433603",
              "ratingText": "rated 4.9/5 by 1,078 ratings",
              "title": "$100M Leads Hardcover Edition (Single)",
              "description": "$29.99",
              "price": "$29.99",
              "ctaText": "GET THE BOOK",
              "ctaLink": "#top"
            },
            {
              "badge": "BEST VALUE",
              "featured": true,
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/3-pack-leads_1000x8d22.png?v=1748373197",
              "ratingText": "rated 4.9/5 by 1,078 ratings",
              "title": "$100M Leads Hardcover 3 Pack",
              "description": "$89.97",
              "price": "$89.97",
              "ctaText": "GET THE BOOK",
              "ctaLink": "#top"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/10_PACK_B_1000x_1_1_1000xfb32.png?v=1748372980",
              "ratingText": "rated 4.9/5 by 1,078 ratings",
              "title": "$100M Leads Hardcover 10 Pack",
              "description": "$299.90",
              "price": "$299.90",
              "ctaText": "GET THE BOOK",
              "ctaLink": "#top"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "services/v14",
        "defaultContent": {
          "title": "What $100m leads will teach you",
          "subtitle": "Alex Hormozi reveals his proven strategies for customer acquisition. His companies use these exact methods to generate 20,000+ new leads per day across sixteen different industries.",
          "items": [
            {
              "number": "1",
              "title": "Start here",
              "description": "$100M Leads sits atop the foundation of the first book and answers the next business problem: who do I sell it to? Leads. Lots of leads."
            },
            {
              "number": "2",
              "title": "Find buyers faster",
              "description": "Learn the acquisition plays that make the right people notice you sooner, with less waste and more signal."
            },
            {
              "number": "3",
              "title": "Scale what works",
              "description": "Use repeatable lead systems that compound across channels instead of depending on random one-off wins."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "testimonials/v14",
        "defaultContent": {
          "variant": "grid",
          "eyebrow": "AMAZON BEST SELLER",
          "title": "We helped 1000's of entrepreneurs SET UP THEIR $100m lead MACHINE",
          "testimonials": [
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/71WGVzqhx1L_1000x44d8.jpg?v=1696404611",
              "title": "Easy to digest material by a down to earth writer",
              "quote": "This is probably the most important review I have ever left because of how much true value these books have given me.",
              "author": "Tyler Pfaffenbach",
              "role": "Verified Buyer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/610V5MAqugL_1000x321a.jpg?v=1696404775",
              "title": "Solid fundamentals simplified",
              "quote": "Alex has mastered the topic in such a way he can simplify it so much better than most gurus or teachers out there.",
              "author": "Teo Zi Jie",
              "role": "Verified Buyer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/71a5DEUiEQL_1000x75dc.jpg?v=1696404697",
              "title": "A game-changer for entrepreneurs",
              "quote": "Hormozi's advice isn't just theory; it's real-world strategies that work. Clear structure, relatable stories, and practical strategies.",
              "author": "Nikita Kliuyeu",
              "role": "Verified Buyer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/71a082kgU1L_1000x36c0.jpg?v=1696404968",
              "title": "Incredible action oriented frameworks",
              "quote": "Every method is laid out step by step in easy to follow framework. I'll be implementing everything from this book for years to come.",
              "author": "Chris Pieta",
              "role": "Verified Buyer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/71n-ZmEe4dL_1000x338f.jpg?v=1696405043",
              "title": "Best investment in my knowledge to date",
              "quote": "This book has provided more actionable down-to-the-point value than any paid course I've taken or info I've consumed.",
              "author": "Veronika K",
              "role": "Verified Buyer"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/61M5jlelH5L_1000x82e4.jpg?v=1696405162",
              "title": "The most practical step by step you can hope for",
              "quote": "Practical, immediately useful, and written in a way that keeps you moving. It turns big concepts into executable plays.",
              "author": "A. Walker",
              "role": "Verified Buyer"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "team/v14",
        "defaultContent": {
          "title": "PERFECT FOR business owners, New entrepreneurs & marketeers",
          "subtitle": "$100m Leads is the perfect choice whether you already have a business, but are looking to increase the amount of leads you get. If you start from scratch, this book will be your exact roadmap to your first paying customers.",
          "cards": [
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/Building_office_1000xafa0.svg?v=1696405227",
              "title": "For business owners",
              "description": "Fast-track success with proven playbooks to skyrocket your leads, fix the lead problem now, and improve sales without changing what you sell."
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/Search_money_dollar_1000x2780.svg?v=1696405256",
              "title": "For new entrepreneurs",
              "description": "Learn from zero, follow the blueprint, and start growing your leads today without huge budgets or major changes."
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/Speaker_megaphone_3_1000x2556.svg?v=1696405290",
              "title": "For marketers",
              "description": "Add diverse, industry-agnostic tactics to your toolkit and adapt proven techniques across sectors for ultimate versatility."
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "about/v14",
        "defaultContent": {
          "variant": "brand",
          "eyebrow": "About Acquisition.com",
          "title": "About Acquisition.com",
          "body": "At Acquisition.com, our mission is to make real business education available to everyone. For anyone interested in business, we provide books, free courses, and content to help them scale. For business owners who want more, we have an in-person scaling workshop in Las Vegas. And for the right founders who share our values, we help them grow and sell their business.",
          "imageUrl": "https://shop.acquisition.com/cdn/shop/files/cropped-AlexandLeilatransparent_1000x4b57.png?v=1701629214",
          "ctaText": "get started! READ THE BOOKS",
          "ctaLink": "#series",
          "proofText": "Sold over 800,000+ copies worldwide | No.1 Bestseller",
          "avatarsImageUrl": "https://shop.acquisition.com/cdn/shop/files/AVATARSh_1000x0740.png?v=1695848115"
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "product/v14",
        "defaultContent": {
          "variant": "series",
          "title": "THE $100m series LEARN TO Create offers & generate leads",
          "items": [
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/Book03-Imageh_1000x0740.png?v=1695848115",
              "title": "$100M Offers: Make Offers So Good People Feel Stupid Saying No",
              "description": "I took home more in a year than the CEOs of McDonalds, IKEA, Ford, Motorola, and Yahoo combined using the $100M Offer method.",
              "ctaText": "BUY THE BOOK",
              "ctaLink": "#top"
            },
            {
              "badge": "MOST POPULAR!",
              "featured": true,
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/Book02-Imageh_1000x0740.png?v=1695848115",
              "title": "$100M Leads: Get Strangers To Want To Buy Your Stuff",
              "description": "Get the exact playbooks and frameworks used to 2x, 10x, or 100x your leads without changing what you sell.",
              "ctaText": "BUY THE BOOK ONLINE!",
              "ctaLink": "#top"
            },
            {
              "imageUrl": "https://shop.acquisition.com/cdn/shop/files/MMv2_717890a5-e311-476b-ab5a-fe28ad478916_1000xce00.png?v=1747340620",
              "title": "World-Record Breaking $100M Money Models",
              "description": "The third book in the series: $100M Money Models Book.",
              "ctaText": "Get $100M Money Models",
              "ctaLink": "#top"
            }
          ]
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "contact/v14",
        "defaultContent": {
          "title": "keep updated with new free value pieces and book releases",
          "subtitle": "Sign up to our monthly newsletter for free gifts, extra worksheets from the books, etc.",
          "emailPlaceholder": "Enter your email",
          "buttonText": "Sign up",
          "disclaimer": "By providing your information today, you are giving consent for us or our partners to contact you by mail, phone, text, or email using automated technology to the data provided."
        },
        "defaultStyles": {}
      },
      {
        "themeComponentKey": "footer/v14",
        "defaultContent": {
          "logoImageUrl": "https://shop.acquisition.com/cdn/shop/files/Acquisition.com-Logo-Primary-Horizontal-Sambucus_4_300x300e4bf.png?v=1686710888",
          "helpText": "Questions? We're here to help! Simply reach out to our team.",
          "helpEmail": "support@acquisition.com",
          "address": "Acquisition.com, LLC, 2960 West Sahara Avenue, Las Vegas, Nevada 89102.",
          "disclaimer": "Alex and Leila Hormozi's results are not typical and are not a guarantee of your success. Alex and Leila are experienced business owners and investors, and your results will vary depending on education, effort, application, experience, and background.",
          "ownership": "The information contained within this website is the property of Acquisition.com. Any use of the images, content, or ideas expressed herein without the express written consent of Acquisition.com is prohibited.",
          "copyrightText": "Copyright 2026 Acquisition.com"
        },
        "defaultStyles": {}
      }
    ]$json$::jsonb,
    false,
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "preview_image_url" = EXCLUDED."preview_image_url",
    "sections_jsonb" = EXCLUDED."sections_jsonb",
    "is_premium" = EXCLUDED."is_premium",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = NOW();
