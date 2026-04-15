-- Make all theme and template access available on every plan,
-- including free, and remove premium template separation.

ALTER TABLE "plan_catalogs"
ALTER COLUMN "allow_premium_templates" SET DEFAULT true;

ALTER TABLE "plan_catalogs"
ALTER COLUMN "allow_staff_accounts" SET DEFAULT true;

UPDATE "plan_catalogs"
SET
  "max_accessible_themes" = NULL,
  "allow_premium_templates" = true,
  "allow_staff_accounts" = true;

UPDATE "page_templates"
SET "is_premium" = false
WHERE "is_premium" = true;
