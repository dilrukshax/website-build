-- Align user_tenants.is_owner with canonical tenants.owner_id
-- so owner privilege checks remain consistent for legacy rows.

UPDATE "user_tenants" AS ut
SET "is_owner" = true
FROM "tenants" AS t
WHERE ut."tenant_id" = t."id"
  AND ut."user_id" = t."owner_id"
  AND ut."is_owner" = false;

UPDATE "user_tenants" AS ut
SET "is_owner" = false
FROM "tenants" AS t
WHERE ut."tenant_id" = t."id"
  AND ut."user_id" <> t."owner_id"
  AND ut."is_owner" = true;
