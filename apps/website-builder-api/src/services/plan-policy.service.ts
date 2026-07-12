import { db } from '@project-aurora/database';
import { ERROR_CODES } from '@project-aurora/core';
import { AppError } from '../middleware/error';
import { UsageService } from './usage.service';

export type CanonicalPlanTier = 'free' | 'starter' | 'freelance' | 'enterprise';
export type CanonicalBillingInterval = 'monthly' | 'annual';

interface PlanCatalogDefaults {
    monthlyPriceCents: number;
    annualPriceCents: number;
    maxInstances: number | null;
    maxCustomDomains: number | null;
    maxPagesPerInstance: number | null;
    maxAccessibleThemes: number | null;
    allowPremiumTemplates: boolean;
    maxBookingsPerDay: number | null;
    maxActiveServices: number | null;
    allowStaffAccounts: boolean;
    allowAddonBundle: boolean;
    addonMonthlyPriceCents: number | null;
    addonAnnualPriceCents: number | null;
}

export const DEFAULT_PLAN_CATALOG: Record<CanonicalPlanTier, PlanCatalogDefaults> = {
    free: {
        monthlyPriceCents: 0,
        annualPriceCents: 0,
        maxInstances: 1,
        maxCustomDomains: 1,
        maxPagesPerInstance: 5,
        maxAccessibleThemes: null,
        allowPremiumTemplates: true,
        maxBookingsPerDay: 10,
        maxActiveServices: 5,
        allowStaffAccounts: true,
        allowAddonBundle: false,
        addonMonthlyPriceCents: null,
        addonAnnualPriceCents: null,
    },
    starter: {
        monthlyPriceCents: 600,
        annualPriceCents: 7000,
        maxInstances: 1,
        maxCustomDomains: 1,
        maxPagesPerInstance: 25,
        maxAccessibleThemes: null,
        allowPremiumTemplates: true,
        maxBookingsPerDay: null,
        maxActiveServices: null,
        allowStaffAccounts: true,
        allowAddonBundle: true,
        addonMonthlyPriceCents: 300,
        addonAnnualPriceCents: 2400,
    },
    freelance: {
        monthlyPriceCents: 2900,
        annualPriceCents: 29000,
        maxInstances: 10,
        maxCustomDomains: 10,
        maxPagesPerInstance: 25,
        maxAccessibleThemes: null,
        allowPremiumTemplates: true,
        maxBookingsPerDay: null,
        maxActiveServices: null,
        allowStaffAccounts: true,
        allowAddonBundle: true,
        addonMonthlyPriceCents: 300,
        addonAnnualPriceCents: 2400,
    },
    enterprise: {
        monthlyPriceCents: 19900,
        annualPriceCents: 199000,
        maxInstances: 100,
        maxCustomDomains: 100,
        maxPagesPerInstance: null,
        maxAccessibleThemes: null,
        allowPremiumTemplates: true,
        maxBookingsPerDay: null,
        maxActiveServices: null,
        allowStaffAccounts: true,
        allowAddonBundle: true,
        addonMonthlyPriceCents: 300,
        addonAnnualPriceCents: 2400,
    },
};

export interface EffectivePlanLimits {
    plan: CanonicalPlanTier;
    billingInterval: CanonicalBillingInterval;
    addonBundles: number;
    maxInstances: number | null;
    maxCustomDomains: number | null;
    maxPagesPerInstance: number | null;
    maxAccessibleThemes: number | null;
    allowPremiumTemplates: boolean;
    maxBookingsPerDay: number | null;
    maxActiveServices: number | null;
    allowStaffAccounts: boolean;
    allowAddonBundle: boolean;
    addonPriceCents: number | null;
}

let ensureCatalogPromise: Promise<void> | null = null;

async function ensurePricingCatalogSeeded(): Promise<void> {
    if (!ensureCatalogPromise) {
        ensureCatalogPromise = (async () => {
            const count = await db.planCatalog.count();
            if (count > 0) {
                return;
            }

            await db.$transaction(async (tx) => {
                for (const [plan, config] of Object.entries(DEFAULT_PLAN_CATALOG) as Array<[CanonicalPlanTier, PlanCatalogDefaults]>) {
                    await tx.planCatalog.create({
                        data: {
                            plan,
                            monthlyPriceCents: config.monthlyPriceCents,
                            annualPriceCents: config.annualPriceCents,
                            maxInstances: config.maxInstances,
                            maxCustomDomains: config.maxCustomDomains,
                            maxPagesPerInstance: config.maxPagesPerInstance,
                            maxAccessibleThemes: config.maxAccessibleThemes,
                            allowPremiumTemplates: config.allowPremiumTemplates,
                            maxBookingsPerDay: config.maxBookingsPerDay,
                            maxActiveServices: config.maxActiveServices,
                            allowStaffAccounts: config.allowStaffAccounts,
                            allowAddonBundle: config.allowAddonBundle,
                            addonMonthlyPriceCents: config.addonMonthlyPriceCents,
                            addonAnnualPriceCents: config.addonAnnualPriceCents,
                        },
                    });
                }
            });
        })();
    }

    await ensureCatalogPromise;
}

function capWithAddons(base: number | null, addonBundles: number): number | null {
    if (base === null) {
        return null;
    }
    return base + Math.max(0, addonBundles);
}

function assertWithinLimit(limit: number | null, nextValue: number, message: string): void {
    if (limit !== null && nextValue > limit) {
        throw new AppError('PLAN_LIMIT_REACHED', message, 403);
    }
}

const planLimitCache = new Map<
    string,
    {
        expiresAt: number;
        value: EffectivePlanLimits;
    }
>();

export class PlanPolicyService {
    static invalidateCache(tenantId: string): void {
        planLimitCache.delete(tenantId);
    }

    static invalidateAllCache(): void {
        planLimitCache.clear();
    }

    static async getEffectiveLimits(tenantId: string): Promise<EffectivePlanLimits> {
        const now = Date.now();
        const cached = planLimitCache.get(tenantId);
        if (cached && cached.expiresAt > now) {
            return cached.value;
        }

        await ensurePricingCatalogSeeded();

        const tenant = await db.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                plan: true,
                billingInterval: true,
                addonBundles: true,
            },
        });

        if (!tenant) {
            throw new AppError(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant not found', 404);
        }

        const catalog = await db.planCatalog.findUnique({ where: { plan: tenant.plan } });
        if (!catalog) {
            throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Plan catalog missing for ${tenant.plan}`, 500);
        }

        const addonBundles = Math.max(0, tenant.addonBundles);

        const result: EffectivePlanLimits = {
            plan: tenant.plan as CanonicalPlanTier,
            billingInterval: tenant.billingInterval as CanonicalBillingInterval,
            addonBundles,
            maxInstances: catalog.allowAddonBundle ? capWithAddons(catalog.maxInstances, addonBundles) : catalog.maxInstances,
            maxCustomDomains: catalog.allowAddonBundle ? capWithAddons(catalog.maxCustomDomains, addonBundles) : catalog.maxCustomDomains,
            maxPagesPerInstance: catalog.maxPagesPerInstance,
            maxAccessibleThemes: catalog.maxAccessibleThemes,
            allowPremiumTemplates: catalog.allowPremiumTemplates,
            maxBookingsPerDay: catalog.maxBookingsPerDay,
            maxActiveServices: catalog.maxActiveServices,
            allowStaffAccounts: catalog.allowStaffAccounts,
            allowAddonBundle: catalog.allowAddonBundle,
            addonPriceCents: tenant.billingInterval === 'annual'
                ? catalog.addonAnnualPriceCents
                : catalog.addonMonthlyPriceCents,
        };

        planLimitCache.set(tenantId, {
            expiresAt: now + 30_000, // 30 seconds cache
            value: result,
        });

        return result;
    }

    static async getUsageSummary(tenantId: string, instanceId?: string) {
        const limits = await this.getEffectiveLimits(tenantId);
        const tenantUsage = await UsageService.getTenantUsage(tenantId);

        if (!instanceId) {
            return {
                limits,
                tenantUsage,
                instanceUsage: null,
            };
        }

        const instance = await db.instance.findFirst({
            where: { id: instanceId, tenantId },
            select: { timezone: true },
        });

        const instanceUsage = await UsageService.getInstanceUsage({
            tenantId,
            instanceId,
            timezone: instance?.timezone || 'UTC',
            bookingDate: new Date(),
        });

        return {
            limits,
            tenantUsage,
            instanceUsage,
        };
    }

    static async assertCanCreateInstance(tenantId: string): Promise<void> {
        const [limits, usage] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            UsageService.getTenantUsage(tenantId),
        ]);

        assertWithinLimit(
            limits.maxInstances,
            usage.instances + 1,
            'Your current plan has reached the website instance limit. Upgrade your plan to create more websites.',
        );
    }

    static async assertCanAttachCustomDomain(tenantId: string, instanceId: string): Promise<void> {
        const [limits, usage, instance] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            UsageService.getTenantUsage(tenantId),
            db.instance.findFirst({
                where: { id: instanceId, tenantId },
                select: { customDomain: true },
            }),
        ]);

        if (!instance) {
            throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
        }

        if (instance.customDomain) {
            return;
        }

        assertWithinLimit(
            limits.maxCustomDomains,
            usage.customDomains + 1,
            'Your current plan has reached the custom domain limit. Upgrade your plan or add domain bundles.',
        );
    }

    static async assertCanCreatePage(tenantId: string, instanceId: string): Promise<void> {
        const [limits, usage] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            UsageService.getInstanceUsage({ tenantId, instanceId, bookingDate: new Date(), timezone: 'UTC' }),
        ]);

        assertWithinLimit(
            limits.maxPagesPerInstance,
            usage.pages + 1,
            'Your current plan has reached the page limit for this website. Upgrade your plan to add more pages.',
        );
    }

    static async assertCanUseTheme(tenantId: string, themeId: string): Promise<void> {
        const [limits, theme] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            db.theme.findUnique({
                where: { id: themeId },
                select: { accessRank: true, isActive: true },
            }),
        ]);

        if (!theme || !theme.isActive) {
            throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found', 404);
        }

        if (limits.maxAccessibleThemes !== null && theme.accessRank > limits.maxAccessibleThemes) {
            throw new AppError(
                'PLAN_LIMIT_REACHED',
                'This section is not available on your current plan.',
                403,
            );
        }
    }

    static async assertCanUseTemplate(tenantId: string, templateId: string): Promise<void> {
        const [limits, template] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            db.pageTemplate.findUnique({
                where: { id: templateId },
                select: { isPremium: true, isActive: true },
            }),
        ]);

        if (!template || !template.isActive) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Template not found', 404);
        }

        if (template.isPremium && !limits.allowPremiumTemplates) {
            throw new AppError(
                'PLAN_LIMIT_REACHED',
                'This template is not available on your current plan.',
                403,
            );
        }
    }

    static async assertCanCreateBooking(tenantId: string, instanceId: string, startTime: Date): Promise<void> {
        const [limits, instance] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            db.instance.findFirst({ where: { id: instanceId, tenantId }, select: { timezone: true } }),
        ]);

        if (!instance) {
            throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
        }

        if (limits.maxBookingsPerDay === null) {
            return;
        }

        const bookingsInDay = await UsageService.getBookingsInDay({
            tenantId,
            instanceId,
            bookingDate: startTime,
            timezone: instance.timezone,
        });

        assertWithinLimit(
            limits.maxBookingsPerDay,
            bookingsInDay + 1,
            'Daily booking limit reached for this plan. Upgrade to continue accepting more bookings today.',
        );
    }

    static async assertCanCreateOrActivateService(input: {
        tenantId: string;
        instanceId: string;
        currentIsActive?: boolean;
        nextIsActive?: boolean;
    }): Promise<void> {
        const willIncreaseActiveCount = input.currentIsActive !== true && (input.nextIsActive ?? true) === true;
        if (!willIncreaseActiveCount) {
            return;
        }

        const [limits, usage] = await Promise.all([
            this.getEffectiveLimits(input.tenantId),
            UsageService.getInstanceUsage({
                tenantId: input.tenantId,
                instanceId: input.instanceId,
                bookingDate: new Date(),
                timezone: 'UTC',
            }),
        ]);

        assertWithinLimit(
            limits.maxActiveServices,
            usage.activeServices + 1,
            'Active service limit reached for your plan. Upgrade to activate more services.',
        );
    }

    static async assertCanCreateStaff(tenantId: string): Promise<void> {
        const [limits] = await Promise.all([
            this.getEffectiveLimits(tenantId),
            UsageService.getTenantUsage(tenantId),
        ]);

        if (!limits.allowStaffAccounts) {
            throw new AppError(
                'PLAN_LIMIT_REACHED',
                'Staff account creation is not available on your current plan.',
                403,
            );
        }
    }
}
