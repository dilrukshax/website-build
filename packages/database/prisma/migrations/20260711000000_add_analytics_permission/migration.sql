-- Add analytics permission and map it to default system roles.

INSERT INTO "permissions" ("id", "key", "name", "description", "module", "created_at")
VALUES
    ('permission-analytics-view', 'analytics.view', 'View Analytics', 'View website traffic analytics', 'analytics', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "module" = EXCLUDED."module";

WITH target_permissions AS (
    SELECT "id", "key"
    FROM "permissions"
    WHERE "key" IN ('analytics.view')
),
target_roles AS (
    SELECT "id", "name"
    FROM "roles"
    WHERE "is_system_role" = true
      AND "name" IN ('Owner', 'Admin', 'Staff', 'Read Only')
)
INSERT INTO "role_permissions" ("id", "role_id", "permission_id")
SELECT
    'role-permission-' || md5(target_roles."id" || ':' || target_permissions."id"),
    target_roles."id",
    target_permissions."id"
FROM target_roles
CROSS JOIN target_permissions
WHERE
    target_roles."name" IN ('Owner', 'Admin', 'Staff', 'Read Only')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
