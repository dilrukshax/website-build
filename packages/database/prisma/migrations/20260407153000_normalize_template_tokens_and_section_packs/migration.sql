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
