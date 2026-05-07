-- Add blog permissions and map them to default system roles.

INSERT INTO "permissions" ("id", "key", "name", "description", "module", "created_at")
VALUES
    ('permission-blogs-view', 'blogs.view', 'View Blogs', 'View blog posts', 'blogs', CURRENT_TIMESTAMP),
    ('permission-blogs-create', 'blogs.create', 'Create Blogs', 'Create new blog posts', 'blogs', CURRENT_TIMESTAMP),
    ('permission-blogs-update', 'blogs.update', 'Update Blogs', 'Update existing blog posts', 'blogs', CURRENT_TIMESTAMP),
    ('permission-blogs-delete', 'blogs.delete', 'Delete Blogs', 'Deactivate or delete blog posts', 'blogs', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "module" = EXCLUDED."module";

WITH target_permissions AS (
    SELECT "id", "key"
    FROM "permissions"
    WHERE "key" IN ('blogs.view', 'blogs.create', 'blogs.update', 'blogs.delete')
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
        AND target_permissions."key" IN ('blogs.view', 'blogs.create', 'blogs.update', 'blogs.delete')
    )
    OR (
        target_roles."name" IN ('Staff', 'Read Only')
        AND target_permissions."key" = 'blogs.view'
    )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
