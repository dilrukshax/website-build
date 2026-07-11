import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

/**
 * Minimal zero-dependency .env loader.
 * Loads variables from candidate .env files without overriding values
 * already present in the process environment (real env wins).
 */
function loadEnvFiles(): void {
    const candidates = [
        path.resolve(__dirname, '../../../apps/website-builder-api/.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(process.cwd(), '.env'),
    ];

    for (const filePath of candidates) {
        if (!fs.existsSync(filePath)) {
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        for (const rawLine of content.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) {
                continue;
            }

            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) {
                continue;
            }

            const key = line.slice(0, eqIndex).trim();
            if (!key || process.env[key] !== undefined) {
                continue;
            }

            let value = line.slice(eqIndex + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            process.env[key] = value;
        }
    }
}

loadEnvFiles();

const prisma = new PrismaClient();

/**
 * Minimal baseline seed data for a fresh database.
 * Intentionally excludes demo/sample/catalog data (themes/templates/teams/etc.).
 */
const PERMISSIONS = [
    // Bookings
    { key: 'bookings.view', name: 'View Bookings', description: 'View booking list and details', module: 'bookings' },
    { key: 'bookings.create', name: 'Create Bookings', description: 'Create new bookings', module: 'bookings' },
    { key: 'bookings.update', name: 'Update Bookings', description: 'Update existing bookings', module: 'bookings' },
    { key: 'bookings.delete', name: 'Delete Bookings', description: 'Cancel or delete bookings', module: 'bookings' },
    { key: 'bookings.confirm', name: 'Confirm Bookings', description: 'Confirm pending bookings', module: 'bookings' },
    { key: 'bookings.complete', name: 'Complete Bookings', description: 'Mark bookings as completed', module: 'bookings' },

    // Services
    { key: 'services.view', name: 'View Services', description: 'View service catalogue', module: 'services' },
    { key: 'services.create', name: 'Create Services', description: 'Create new services', module: 'services' },
    { key: 'services.update', name: 'Update Services', description: 'Update existing services', module: 'services' },
    { key: 'services.delete', name: 'Delete Services', description: 'Deactivate or delete services', module: 'services' },

    // Products
    { key: 'products.view', name: 'View Products', description: 'View product catalogue', module: 'products' },
    { key: 'products.create', name: 'Create Products', description: 'Create new products', module: 'products' },
    { key: 'products.update', name: 'Update Products', description: 'Update existing products', module: 'products' },
    { key: 'products.delete', name: 'Delete Products', description: 'Deactivate or delete products', module: 'products' },

    // Blogs
    { key: 'blogs.view', name: 'View Blogs', description: 'View blog posts', module: 'blogs' },
    { key: 'blogs.create', name: 'Create Blogs', description: 'Create new blog posts', module: 'blogs' },
    { key: 'blogs.update', name: 'Update Blogs', description: 'Update existing blog posts', module: 'blogs' },
    { key: 'blogs.delete', name: 'Delete Blogs', description: 'Deactivate or delete blog posts', module: 'blogs' },

    // Customers
    { key: 'customers.view', name: 'View Customers', description: 'View customer list and details', module: 'customers' },
    { key: 'customers.create', name: 'Create Customers', description: 'Create new customers', module: 'customers' },
    { key: 'customers.update', name: 'Update Customers', description: 'Update customer details', module: 'customers' },
    { key: 'customers.delete', name: 'Delete Customers', description: 'Delete customers', module: 'customers' },
    { key: 'customers.search', name: 'Search Customers', description: 'Search customer database', module: 'customers' },

    // Inquiries
    { key: 'inquiries.view', name: 'View Inquiries', description: 'View inquiry list and details', module: 'inquiries' },
    { key: 'inquiries.update', name: 'Update Inquiries', description: 'Update inquiry details', module: 'inquiries' },
    { key: 'inquiries.delete', name: 'Delete Inquiries', description: 'Delete inquiries', module: 'inquiries' },
    { key: 'inquiries.update_status', name: 'Update Inquiry Status', description: 'Change inquiry status', module: 'inquiries' },

    // Settings
    { key: 'settings.view', name: 'View Settings', description: 'View tenant settings', module: 'settings' },
    { key: 'settings.update', name: 'Update Settings', description: 'Modify tenant settings', module: 'settings' },

    // Staff
    { key: 'staff.view', name: 'View Staff', description: 'View staff list and details', module: 'staff' },
    { key: 'staff.create', name: 'Create Staff', description: 'Invite or create staff users', module: 'staff' },
    { key: 'staff.update', name: 'Update Staff', description: 'Update staff roles and details', module: 'staff' },
    { key: 'staff.delete', name: 'Delete Staff', description: 'Remove staff from tenant', module: 'staff' },

    // Roles
    { key: 'roles.view', name: 'View Roles', description: 'View role list and details', module: 'roles' },
    { key: 'roles.create', name: 'Create Roles', description: 'Create custom roles', module: 'roles' },
    { key: 'roles.update', name: 'Update Roles', description: 'Update role permissions', module: 'roles' },
    { key: 'roles.delete', name: 'Delete Roles', description: 'Delete custom roles', module: 'roles' },

    // Website Builder
    { key: 'website.view', name: 'View Website Builder', description: 'Access website builder', module: 'website' },
    { key: 'website.edit', name: 'Edit Website', description: 'Edit website pages and sections', module: 'website' },
    { key: 'website.publish', name: 'Publish Website', description: 'Publish website to live', module: 'website' },
    { key: 'website.settings', name: 'Manage Website Settings', description: 'Manage website design settings', module: 'website' },
];

const ADMIN_EXCLUDED = ['staff.delete', 'roles.delete'];

const ADMIN_PERMISSION_KEYS = PERMISSIONS
    .map((permission) => permission.key)
    .filter((key) => !ADMIN_EXCLUDED.includes(key));

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@buildmyonlineweb.site';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD?.trim() || 'Admin@123';
const SEED_ADMIN_FULL_NAME = process.env.SEED_ADMIN_FULL_NAME?.trim() || 'System Admin';
const SEED_ADMIN_TENANT_NAME = process.env.SEED_ADMIN_TENANT_NAME?.trim() || 'Default Organization';

async function seedBootstrapAdmin() {
    const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

    const adminUser = await prisma.user.upsert({
        where: { email: SEED_ADMIN_EMAIL },
        update: {
            fullName: SEED_ADMIN_FULL_NAME,
            passwordHash,
            isSuperAdmin: true,
            status: 'active',
        },
        create: {
            email: SEED_ADMIN_EMAIL,
            fullName: SEED_ADMIN_FULL_NAME,
            passwordHash,
            isSuperAdmin: true,
            status: 'active',
        },
    });

    let tenant = await prisma.tenant.findFirst({
        where: {
            ownerId: adminUser.id,
            businessName: SEED_ADMIN_TENANT_NAME,
        },
    });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                businessName: SEED_ADMIN_TENANT_NAME,
                ownerId: adminUser.id,
            },
        });
    }

    const adminRole = await prisma.role.upsert({
        where: {
            tenantId_name: {
                tenantId: tenant.id,
                name: 'Admin',
            },
        },
        update: {
            description: 'Administrative access with limited destructive actions',
            isSystemRole: true,
        },
        create: {
            tenantId: tenant.id,
            name: 'Admin',
            description: 'Administrative access with limited destructive actions',
            isSystemRole: true,
        },
    });

    const adminPermissions = await prisma.permission.findMany({
        where: {
            key: {
                in: ADMIN_PERMISSION_KEYS,
            },
        },
        select: { id: true },
    });

    await prisma.rolePermission.deleteMany({
        where: { roleId: adminRole.id },
    });

    if (adminPermissions.length > 0) {
        await prisma.rolePermission.createMany({
            data: adminPermissions.map((permission) => ({
                roleId: adminRole.id,
                permissionId: permission.id,
            })),
            skipDuplicates: true,
        });
    }

    await prisma.userTenant.upsert({
        where: {
            userId_tenantId: {
                userId: adminUser.id,
                tenantId: tenant.id,
            },
        },
        update: {
            roleId: adminRole.id,
            isOwner: true,
            status: 'active',
        },
        create: {
            userId: adminUser.id,
            tenantId: tenant.id,
            roleId: adminRole.id,
            isOwner: true,
            status: 'active',
        },
    });

    console.log(`Admin user ready: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
    console.log(`Admin role assigned in tenant: ${SEED_ADMIN_TENANT_NAME}`);
}

async function main() {
    console.log('Seeding minimal baseline data...');

    for (const permission of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key: permission.key },
            update: {
                name: permission.name,
                description: permission.description,
                module: permission.module,
            },
            create: permission,
        });
    }

    console.log(`Seeded ${PERMISSIONS.length} permissions.`);
    await seedBootstrapAdmin();
    console.log('Seed completed successfully.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
