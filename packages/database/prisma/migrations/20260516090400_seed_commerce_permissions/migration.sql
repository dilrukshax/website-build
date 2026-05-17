-- Add e-commerce / dropshipping permissions and map them to default system roles.
-- See docs/ecommerce-dropshipping-automation-system-design.md §17.

INSERT INTO "permissions" ("id", "key", "name", "description", "module", "created_at")
VALUES
    ('permission-store-settings', 'store.settings', 'Manage Store Settings', 'Edit commerce store profile and policies', 'store', CURRENT_TIMESTAMP),
    ('permission-suppliers-view', 'suppliers.view', 'View Suppliers', 'View supplier connections', 'suppliers', CURRENT_TIMESTAMP),
    ('permission-suppliers-manage', 'suppliers.manage', 'Manage Suppliers', 'Connect and configure suppliers', 'suppliers', CURRENT_TIMESTAMP),
    ('permission-imports-view', 'imports.view', 'View Imports', 'View supplier product imports', 'imports', CURRENT_TIMESTAMP),
    ('permission-imports-manage', 'imports.manage', 'Manage Imports', 'Import, review and publish supplier products', 'imports', CURRENT_TIMESTAMP),
    ('permission-orders-view', 'orders.view', 'View Orders', 'View customer orders', 'orders', CURRENT_TIMESTAMP),
    ('permission-orders-manage', 'orders.manage', 'Manage Orders', 'Edit orders, notes and holds', 'orders', CURRENT_TIMESTAMP),
    ('permission-orders-approve', 'orders.approve', 'Approve Supplier Purchase', 'Approve the supplier purchase gate', 'orders', CURRENT_TIMESTAMP),
    ('permission-orders-fulfill', 'orders.fulfill', 'Fulfill Orders', 'Place supplier orders and manage shipments', 'orders', CURRENT_TIMESTAMP),
    ('permission-refunds-create', 'refunds.create', 'Create Refunds', 'Issue refunds against orders', 'refunds', CURRENT_TIMESTAMP),
    ('permission-pricing-manage', 'pricing.manage', 'Manage Pricing', 'Configure pricing and margin rules', 'pricing', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "module" = EXCLUDED."module";

WITH target_permissions AS (
    SELECT "id", "key"
    FROM "permissions"
    WHERE "key" IN (
        'store.settings', 'suppliers.view', 'suppliers.manage', 'imports.view', 'imports.manage',
        'orders.view', 'orders.manage', 'orders.approve', 'orders.fulfill', 'refunds.create', 'pricing.manage'
    )
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
    )
    OR (
        target_roles."name" = 'Staff'
        AND target_permissions."key" IN ('suppliers.view', 'imports.view', 'imports.manage', 'orders.view', 'orders.manage')
    )
    OR (
        target_roles."name" = 'Read Only'
        AND target_permissions."key" IN ('suppliers.view', 'imports.view', 'orders.view')
    )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
