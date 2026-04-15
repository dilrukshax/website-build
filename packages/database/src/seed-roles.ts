import { PrismaClient } from '@prisma/client';

// Permission keys grouped by the default role they belong to
const ALL_PERMISSION_KEYS = [
    'bookings.view', 'bookings.create', 'bookings.update', 'bookings.delete', 'bookings.confirm', 'bookings.complete',
    'services.view', 'services.create', 'services.update', 'services.delete',
    'products.view', 'products.create', 'products.update', 'products.delete',
    'customers.view', 'customers.create', 'customers.update', 'customers.delete', 'customers.search',
    'inquiries.view', 'inquiries.update', 'inquiries.delete', 'inquiries.update_status',
    'settings.view', 'settings.update',
    'staff.view', 'staff.create', 'staff.update', 'staff.delete',
    'roles.view', 'roles.create', 'roles.update', 'roles.delete',
    'website.view', 'website.edit', 'website.publish', 'website.settings',
];

const ADMIN_EXCLUDED = ['staff.delete', 'roles.delete'];

const STAFF_PERMISSIONS = [
    'bookings.view', 'bookings.create', 'bookings.update', 'bookings.delete', 'bookings.confirm', 'bookings.complete',
    'services.view',
    'products.view',
    'customers.view', 'customers.create', 'customers.update', 'customers.search',
    'inquiries.view', 'inquiries.update', 'inquiries.update_status',
    'settings.view',
    'website.view', 'website.edit',
];

const READONLY_PERMISSIONS = [
    'bookings.view',
    'services.view',
    'products.view',
    'customers.view',
    'inquiries.view',
    'settings.view',
    'staff.view',
    'roles.view',
    'website.view',
];

interface DefaultRole {
    name: string;
    description: string;
    permissionKeys: string[];
}

const DEFAULT_ROLES: DefaultRole[] = [
    {
        name: 'Owner',
        description: 'Full access to all features and settings',
        permissionKeys: ALL_PERMISSION_KEYS,
    },
    {
        name: 'Admin',
        description: 'Administrative access with limited destructive actions',
        permissionKeys: ALL_PERMISSION_KEYS.filter(k => !ADMIN_EXCLUDED.includes(k)),
    },
    {
        name: 'Staff',
        description: 'Day-to-day operational access',
        permissionKeys: STAFF_PERMISSIONS,
    },
    {
        name: 'Read Only',
        description: 'View-only access to all modules',
        permissionKeys: READONLY_PERMISSIONS,
    },
];

/**
 * Seeds the four default system roles for a tenant and assigns appropriate permissions.
 * Returns the created roles keyed by name.
 */
export async function seedDefaultRoles(
    tenantId: string,
    prisma?: PrismaClient,
): Promise<Record<string, { id: string; name: string }>> {
    // Use provided client or create a new one (for use inside transactions)
    const db = prisma ?? new PrismaClient();

    try {
        // Fetch all permissions
        const allPermissions = await db.permission.findMany();
        const permissionsByKey = new Map(allPermissions.map(p => [p.key, p]));

        const createdRoles: Record<string, { id: string; name: string }> = {};

        for (const roleDef of DEFAULT_ROLES) {
            // Create the role
            const role = await db.role.create({
                data: {
                    tenantId,
                    name: roleDef.name,
                    description: roleDef.description,
                    isSystemRole: true,
                },
            });

            // Attach permissions
            const rolePermissions = roleDef.permissionKeys
                .map(key => permissionsByKey.get(key))
                .filter((p): p is NonNullable<typeof p> => p != null)
                .map(p => ({
                    roleId: role.id,
                    permissionId: p.id,
                }));

            if (rolePermissions.length > 0) {
                await db.rolePermission.createMany({ data: rolePermissions });
            }

            createdRoles[roleDef.name] = { id: role.id, name: role.name };
        }

        return createdRoles;
    } finally {
        // Only disconnect if we created the client ourselves
        if (!prisma) {
            await db.$disconnect();
        }
    }
}
