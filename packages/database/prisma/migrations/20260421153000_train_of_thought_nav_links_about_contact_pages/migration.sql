-- Align Train of Thought default navigation with dedicated /about and /contact pages.
-- This keeps header/footer links valid after builder orchestration moves About/Contact
-- sections off Home and onto standalone pages.

UPDATE "page_templates"
SET
  "sections_jsonb" = (
    SELECT jsonb_agg(
      CASE
        WHEN section->>'themeComponentKey' = 'header/v15' THEN
          jsonb_set(
            section,
            '{defaultContent,menu}',
            '[
              {"label":"Home","href":"/"},
              {"label":"About","href":"/about"},
              {"label":"Blog","href":"/blog"},
              {"label":"Contact","href":"/contact"}
            ]'::jsonb,
            true
          )
        WHEN section->>'themeComponentKey' = 'footer/v15' THEN
          jsonb_set(
            section,
            '{defaultContent,links}',
            '[
              {"label":"Home","href":"/"},
              {"label":"Blog","href":"/blog"},
              {"label":"About","href":"/about"},
              {"label":"Contact","href":"/contact"}
            ]'::jsonb,
            true
          )
        ELSE section
      END
    )
    FROM jsonb_array_elements("sections_jsonb") AS section
  ),
  "updated_at" = NOW()
WHERE "id" = 'template-2026-editorial-pulse';
