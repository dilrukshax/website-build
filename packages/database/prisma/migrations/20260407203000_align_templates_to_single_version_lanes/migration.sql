-- Align all seeded templates to single version lanes (v1..v12).
-- This keeps each template internally version-consistent across its section keys.

WITH template_lane_map AS (
    SELECT *
    FROM (VALUES
        ('template-2026-clean-appointments', 1),
        ('template-2026-neon-grid-lab', 2),
        ('template-2026-motion-studio', 3),
        ('template-2026-elegant-concierge', 4),
        ('template-2026-signal-horizon', 5),
        ('template-2026-acquisition-shop', 6),
        ('template-2026-prism-grid-conversion', 7),
        ('template-2026-salesforce-pipeline', 8),
        ('template-2026-velocity-vsl', 9),
        ('template-2026-aurora-atelier', 10),
        ('template-2026-fusion-growth', 11),
        ('template-2026-spectrum-prime', 12)
    ) AS m(template_id, lane_version)
),
rewired_templates AS (
    SELECT
        pt."id",
        (
            SELECT jsonb_agg(
                CASE
                    WHEN section.value ? 'themeComponentKey'
                         AND (section.value ->> 'themeComponentKey') ~ '^[a-z0-9-]+/v[0-9]+$'
                    THEN jsonb_set(
                        section.value,
                        '{themeComponentKey}',
                        to_jsonb(
                            regexp_replace(
                                section.value ->> 'themeComponentKey',
                                '/v[0-9]+$',
                                '/v' || map.lane_version::text
                            )
                        ),
                        false
                    )
                    ELSE section.value
                END
                ORDER BY section.ordinality
            )
            FROM jsonb_array_elements(pt."sections_jsonb") WITH ORDINALITY AS section(value, ordinality)
        ) AS lane_sections
    FROM "page_templates" pt
    JOIN template_lane_map map
      ON map.template_id = pt."id"
)
UPDATE "page_templates" pt
SET
    "sections_jsonb" = rewired.lane_sections,
    "updated_at" = NOW()
FROM rewired_templates rewired
WHERE pt."id" = rewired."id";
