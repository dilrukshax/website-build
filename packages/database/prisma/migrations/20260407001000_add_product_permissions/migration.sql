-- Add product permissions and map them to default system roles.

INSERT INTO "permissions" ("id", "key", "name", "description", "module", "created_at")
VALUES
    ('permission-products-view', 'products.view', 'View Products', 'View product catalogue', 'products', CURRENT_TIMESTAMP),
    ('permission-products-create', 'products.create', 'Create Products', 'Create new products', 'products', CURRENT_TIMESTAMP),
    ('permission-products-update', 'products.update', 'Update Products', 'Update existing products', 'products', CURRENT_TIMESTAMP),
    ('permission-products-delete', 'products.delete', 'Delete Products', 'Deactivate or delete products', 'products', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "module" = EXCLUDED."module";

WITH target_permissions AS (
    SELECT "id", "key"
    FROM "permissions"
    WHERE "key" IN ('products.view', 'products.create', 'products.update', 'products.delete')
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
    (
        target_roles."name" IN ('Owner', 'Admin')
        AND target_permissions."key" IN ('products.view', 'products.create', 'products.update', 'products.delete')
    )
    OR (
        target_roles."name" IN ('Staff', 'Read Only')
        AND target_permissions."key" = 'products.view'
    )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
