import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@prisma/client';
import { logger } from '@project-aurora/core';

// ============================================================
// Tenant + Instance context storage
// Flows through the entire async request lifecycle automatically.
// Set once in tenant/instance middleware; read in every Prisma query.
// ============================================================

interface TenantContextData {
    tenantId: string;
    instanceId?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();

/**
 * setTenantContext — call this in tenant middleware before the request handler.
 * All Prisma queries made during the same async context will be scoped to this tenantId
 * (and optionally instanceId for instance-scoped models).
 */
export function setTenantContext(
    tenantId: string,
    fn: () => Promise<void>,
    instanceId?: string,
): Promise<void> {
    return new Promise((resolve, reject) => {
        tenantContext.run({ tenantId, instanceId }, () => {
            fn().then(resolve).catch(reject);
        });
    });
}

/**
 * Executes work outside tenant context.
 * Useful for internal/global maintenance tasks (e.g. rebuilding global routing indexes).
 */
export function runWithoutTenantContext<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        tenantContext.run(undefined as unknown as TenantContextData, () => {
            fn().then(resolve).catch(reject);
        });
    });
}

// ============================================================
// Models that are exempt from tenant scoping
// (Tenant lookup itself cannot be tenant-scoped)
// ============================================================
const TENANT_EXEMPT_MODELS = new Set([
    'Tenant',
    'User',
    'Permission',
    'PasswordResetToken',
    'RefreshToken',
    'UserTenant',
    'RolePermission',
    'Industry',
    'Feature',
    'IndustryFeature',
    'Theme',
    'PageTemplate',
    'CustomDomainAccountHistory',
    'DeviceFingerprint',
    'AccountDevice',
    'ReferralProfile',
    'ReferralClaim',
    'ReferralFraudProof',
    'ReferralFraudLog',
    'ReferralRewardEvent',
    'ReferralPointsWallet',
    'ReferralPointsLedger',
    'EnterpriseRewardApproval',
    'PlanCatalog',
    'PlanReferralMultiplier',
    'ReferralRewardRule',
]);

// ============================================================
// Models that are scoped at the instance level
// (These have both tenantId and instanceId)
// ============================================================
const INSTANCE_SCOPED_MODELS = new Set([
    'Customer',
    'Service',
    'Product',
    'BlogPost',
    'Booking',
    'Inquiry',
    'FeatureToggle',
    'MediaAsset',
    'Page',
    'PageSection',
    'PublishRecord',
]);

// ============================================================
// Prisma Client with tenant-scope + instance-scope middleware
// ============================================================

function createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['warn', 'error'],
    });

    // Tenant + Instance isolation middleware — applied to every query
    client.$use(async (params, next) => {
        const ctx = tenantContext.getStore();
        const model = params.model as string | undefined;

        // Skip tenant scoping for exempt models
        if (!model || TENANT_EXEMPT_MODELS.has(model)) {
            return next(params);
        }

        const tenantId = ctx?.tenantId;
        const instanceId = ctx?.instanceId;
        const isInstanceScoped = INSTANCE_SCOPED_MODELS.has(model);

        // Enforce tenant scoping on read operations
        if (
            params.action === 'findMany' ||
            params.action === 'findFirst' ||
            params.action === 'count' ||
            params.action === 'aggregate'
        ) {
            if (!tenantId) {
                logger.warn(`Tenant context missing for ${model}.${params.action} — query proceeding without scope`);
            } else {
                params.args = params.args ?? {};
                params.args.where = { ...params.args.where, tenantId };

                // Also scope by instanceId for instance-scoped models
                if (isInstanceScoped && instanceId) {
                    params.args.where = { ...params.args.where, instanceId };
                }
            }
        }

        // Enforce tenant scoping on write operations
        if (params.action === 'create' || params.action === 'createMany') {
            if (tenantId) {
                if (params.action === 'create') {
                    params.args.data = { ...params.args.data, tenantId };

                    // Also inject instanceId for instance-scoped models
                    if (isInstanceScoped && instanceId) {
                        params.args.data = { ...params.args.data, instanceId };
                    }
                }
            }
        }

        // Prevent cross-tenant updates/deletes — always inject tenantId in where clause
        if (
            params.action === 'update' ||
            params.action === 'updateMany' ||
            params.action === 'delete' ||
            params.action === 'deleteMany'
        ) {
            if (tenantId) {
                params.args = params.args ?? {};
                params.args.where = { ...params.args.where, tenantId };

                // Also scope by instanceId for instance-scoped models
                if (isInstanceScoped && instanceId) {
                    params.args.where = { ...params.args.where, instanceId };
                }
            }
        }

        return next(params);
    });

    return client;
}

// ============================================================
// Singleton pattern — one Prisma client per process
// ============================================================

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db;
}
