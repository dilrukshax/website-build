import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

type CleanupArgs = {
    execute: boolean;
    keepEmails: string[];
    help: boolean;
};

type CleanupPlan = {
    keepUsers: Array<{ id: string; email: string; isSuperAdmin: boolean }>;
    purgeUsers: Array<{ id: string; email: string }>;
    purgeTenantIds: string[];
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): CleanupArgs {
    const keepEmails: string[] = [];
    let execute = false;
    let help = false;

    for (const arg of argv) {
        if (arg === '--') {
            continue;
        }

        if (arg === '--execute') {
            execute = true;
            continue;
        }

        if (arg === '--help' || arg === '-h') {
            help = true;
            continue;
        }

        if (arg.startsWith('--keep-email=')) {
            const email = arg.slice('--keep-email='.length).trim().toLowerCase();
            if (email) keepEmails.push(email);
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return { execute, keepEmails, help };
}

function parseCsv(value: string | undefined): string[] {
    if (!value) return [];

    return value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
}

function parseEnvLine(line: string): { key: string; value: string } | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    const index = trimmed.indexOf('=');
    if (index < 1) return null;

    const key = trimmed.slice(0, index).trim();
    if (!key) return null;

    let value = trimmed.slice(index + 1).trim();

    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1);
    } else {
        const commentIndex = value.indexOf(' #');
        if (commentIndex >= 0) value = value.slice(0, commentIndex).trim();
    }

    return { key, value };
}

function loadEnvFile(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const parsed = parseEnvLine(line);
        if (!parsed) continue;
        if (process.env[parsed.key] === undefined) {
            process.env[parsed.key] = parsed.value;
        }
    }

    return true;
}

function loadDatabaseEnv(): string[] {
    const candidates = [
        path.resolve(process.cwd(), 'packages/database/.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '..', '.env'),
        path.resolve(__dirname, '..', '..', '..', '.env'),
    ];

    const loaded: string[] = [];
    for (const candidate of candidates) {
        if (loadEnvFile(candidate)) {
            loaded.push(candidate);
        }
    }

    return loaded;
}

async function buildCleanupPlan(keepEmails: string[]): Promise<CleanupPlan> {
    const keepUsers = await prisma.user.findMany({
        where: keepEmails.length
            ? {
                OR: [
                    { isSuperAdmin: true },
                    { email: { in: keepEmails } },
                ],
            }
            : { isSuperAdmin: true },
        select: {
            id: true,
            email: true,
            isSuperAdmin: true,
        },
    });

    if (keepUsers.length === 0) {
        throw new Error(
            'No admin users found to preserve. Set DB_CLEANUP_KEEP_EMAILS or pass --keep-email.',
        );
    }

    const keepUserIds = keepUsers.map((user) => user.id);
    const purgeUsers = await prisma.user.findMany({
        where: { id: { notIn: keepUserIds } },
        select: {
            id: true,
            email: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    const purgeUserIds = purgeUsers.map((user) => user.id);
    const purgeTenants = purgeUserIds.length
        ? await prisma.tenant.findMany({
            where: { ownerId: { in: purgeUserIds } },
            select: { id: true },
        })
        : [];

    return {
        keepUsers,
        purgeUsers,
        purgeTenantIds: purgeTenants.map((tenant) => tenant.id),
    };
}

async function executeCleanup(plan: CleanupPlan): Promise<void> {
    const purgeUserIds = plan.purgeUsers.map((user) => user.id);
    const purgeTenantIds = plan.purgeTenantIds;

    await prisma.$transaction(async (tx) => {
        if (purgeTenantIds.length > 0) {
            await tx.tenant.deleteMany({
                where: { id: { in: purgeTenantIds } },
            });
        }

        if (purgeUserIds.length === 0) return;

        await tx.referralFraudLog.deleteMany({
            where: {
                OR: [
                    { referrerId: { in: purgeUserIds } },
                    { refereeId: { in: purgeUserIds } },
                ],
            },
        });

        await tx.referralRewardEvent.deleteMany({
            where: {
                OR: [
                    { referrerId: { in: purgeUserIds } },
                    { refereeId: { in: purgeUserIds } },
                ],
            },
        });

        await tx.referralClaim.deleteMany({
            where: {
                OR: [
                    { referrerId: { in: purgeUserIds } },
                    { refereeId: { in: purgeUserIds } },
                ],
            },
        });

        await tx.referralFraudProof.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.referralPointsLedger.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.referralRedemption.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.referralPointsWallet.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.referralProfile.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.accountDevice.deleteMany({
            where: { accountId: { in: purgeUserIds } },
        });

        await tx.user.deleteMany({
            where: { id: { in: purgeUserIds } },
        });
    });
}

function printUsage(): void {
    console.log('Cleanup non-admin user data while preserving admin and system template data.');
    console.log('');
    console.log('Usage:');
    console.log('  pnpm --filter @project-aurora/database run db:cleanup-users [--execute] [--keep-email=email]');
    console.log('');
    console.log('Options:');
    console.log('  --execute                Apply destructive changes (default is dry-run).');
    console.log('  --keep-email=<email>     Keep this user in addition to super-admin users.');
    console.log('');
    console.log('Environment:');
    console.log('  DB_CLEANUP_KEEP_EMAILS   Comma-separated extra emails to preserve.');
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        return;
    }

    const loadedEnvFiles = loadDatabaseEnv();
    if (!process.env.DATABASE_URL) {
        throw new Error(
            `DATABASE_URL is missing. Checked env files: ${
                loadedEnvFiles.length ? loadedEnvFiles.join(', ') : 'none'
            }`,
        );
    }

    const keepEmails = Array.from(
        new Set([
            'admin@buildmyonlineweb.site',
            ...parseCsv(process.env.DB_CLEANUP_KEEP_EMAILS),
            ...args.keepEmails,
        ]),
    );

    const plan = await buildCleanupPlan(keepEmails);

    console.log('Database cleanup plan (user-related data):');
    console.log(`- Preserved admin users: ${plan.keepUsers.length}`);
    console.log(`- Users to delete: ${plan.purgeUsers.length}`);
    console.log(`- Tenant trees to delete: ${plan.purgeTenantIds.length}`);
    console.log(`- Env files loaded: ${loadedEnvFiles.length ? loadedEnvFiles.join(', ') : 'none'}`);
    console.log(`- Preserve email list: ${keepEmails.join(', ')}`);

    if (!args.execute) {
        console.log('');
        console.log('Dry run complete. Re-run with --execute to delete data.');
        return;
    }

    await executeCleanup(plan);

    const remainingUsers = await prisma.user.count();
    const remainingTenants = await prisma.tenant.count();

    console.log('');
    console.log('Cleanup finished.');
    console.log(`- Remaining users: ${remainingUsers}`);
    console.log(`- Remaining tenants: ${remainingTenants}`);
}

main()
    .catch((error) => {
        console.error('Cleanup failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
