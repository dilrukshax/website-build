import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from './plan-policy.service';
import { ReferralRewardsService } from './referral-rewards.service';

function addBillingInterval(date: Date, interval: 'monthly' | 'annual'): Date {
    const next = new Date(date);
    if (interval === 'annual') {
        next.setUTCFullYear(next.getUTCFullYear() + 1);
    } else {
        next.setUTCMonth(next.getUTCMonth() + 1);
    }
    return next;
}

export class BillingService {
    static async ensureTenantSubscription(tenantId: string): Promise<any> {
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

        const subscription = await db.tenantSubscription.findUnique({ where: { tenantId } });
        if (subscription) {
            if (
                subscription.plan !== tenant.plan ||
                subscription.billingInterval !== tenant.billingInterval ||
                subscription.addonBundles !== tenant.addonBundles
            ) {
                await db.tenantSubscription.update({
                    where: { tenantId },
                    data: {
                        plan: tenant.plan,
                        billingInterval: tenant.billingInterval,
                        addonBundles: tenant.addonBundles,
                    },
                });
            }

            return db.tenantSubscription.findUnique({ where: { tenantId } });
        }

        return db.tenantSubscription.create({
            data: {
                tenantId,
                plan: tenant.plan,
                billingInterval: tenant.billingInterval,
                addonBundles: tenant.addonBundles,
                status: 'active',
                startedAt: new Date(),
                currentPeriodEnd: addBillingInterval(new Date(), tenant.billingInterval as 'monthly' | 'annual'),
            },
        });
    }

    static async getSummary(tenantId: string): Promise<any> {
        const subscription = await this.ensureTenantSubscription(tenantId);

        const [usage, wallet, pendingCharges, recentCharges] = await Promise.all([
            PlanPolicyService.getUsageSummary(tenantId),
            db.tenantCreditWallet.findUnique({ where: { tenantId } }),
            db.billingCharge.findMany({
                where: { tenantId, status: 'pending' },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            db.billingCharge.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
        ]);

        return {
            subscription,
            limits: usage.limits,
            usage: usage.tenantUsage,
            wallet: {
                balanceCents: wallet?.balanceCents || 0,
            },
            pendingCharges,
            recentCharges,
        };
    }

    static async getUsage(tenantId: string, instanceId?: string) {
        return PlanPolicyService.getUsageSummary(tenantId, instanceId);
    }

    static async requestPlanChange(input: {
        tenantId: string;
        requestedByUserId: string;
        requestedPlan: 'free' | 'starter' | 'freelance' | 'enterprise';
        requestedInterval: 'monthly' | 'annual';
        notes?: string;
    }): Promise<any> {
        await PlanPolicyService.getEffectiveLimits(input.tenantId);

        const [tenant, catalog] = await Promise.all([
            db.tenant.findUnique({
                where: { id: input.tenantId },
                select: {
                    id: true,
                    plan: true,
                    billingInterval: true,
                },
            }),
            db.planCatalog.findUnique({
                where: { plan: input.requestedPlan },
            }),
        ]);

        if (!tenant) {
            throw new AppError(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant not found', 404);
        }

        if (!catalog) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Requested plan is not configured', 400, 'requestedPlan');
        }

        if (tenant.plan === input.requestedPlan && tenant.billingInterval === input.requestedInterval) {
            throw new AppError(ERROR_CODES.CONFLICT, 'Tenant already uses this plan and interval', 409);
        }

        const amountCents = input.requestedInterval === 'annual'
            ? catalog.annualPriceCents
            : catalog.monthlyPriceCents;

        const charge = await db.billingCharge.create({
            data: {
                tenantId: input.tenantId,
                requestedByUserId: input.requestedByUserId,
                chargeType: 'plan_change',
                requestedPlan: input.requestedPlan,
                requestedInterval: input.requestedInterval,
                amountCents,
                netAmountCents: amountCents,
                notes: input.notes || null,
            },
        });

        return charge;
    }

    static async requestAddonBundles(input: {
        tenantId: string;
        requestedByUserId: string;
        bundles: number;
        notes?: string;
    }): Promise<any> {
        if (!Number.isInteger(input.bundles) || input.bundles < 1) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Bundle quantity must be at least 1', 400, 'bundles');
        }

        const limits = await PlanPolicyService.getEffectiveLimits(input.tenantId);
        if (!limits.allowAddonBundle || limits.addonPriceCents === null) {
            throw new AppError(
                'BILLING_REQUIRED',
                'Add-on bundles are not available for this plan',
                403,
            );
        }

        const amountCents = limits.addonPriceCents * input.bundles;

        const charge = await db.billingCharge.create({
            data: {
                tenantId: input.tenantId,
                requestedByUserId: input.requestedByUserId,
                chargeType: 'addon_bundle',
                requestedAddonBundles: input.bundles,
                amountCents,
                netAmountCents: amountCents,
                notes: input.notes || null,
            },
        });

        return charge;
    }

    static async confirmCharge(chargeId: string, reviewerUserId: string): Promise<any> {
        const charge = await db.billingCharge.findUnique({ where: { id: chargeId } });
        if (!charge) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Charge not found', 404);
        }

        const tenantSnapshot = await db.tenant.findUnique({
            where: { id: charge.tenantId },
            select: { plan: true, billingInterval: true },
        });
        if (!tenantSnapshot) {
            throw new AppError(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant not found', 404);
        }

        if (charge.status !== 'pending') {
            throw new AppError(ERROR_CODES.CONFLICT, 'Charge is not pending', 409);
        }

        await db.$transaction(async (tx) => {
            const wallet = await tx.tenantCreditWallet.upsert({
                where: { tenantId: charge.tenantId },
                create: {
                    tenantId: charge.tenantId,
                    balanceCents: 0,
                },
                update: {},
            });

            const creditAppliedCents = Math.min(wallet.balanceCents, charge.amountCents);
            const netAmountCents = charge.amountCents - creditAppliedCents;

            if (creditAppliedCents > 0) {
                await tx.tenantCreditWallet.update({
                    where: { id: wallet.id },
                    data: {
                        balanceCents: {
                            decrement: creditAppliedCents,
                        },
                    },
                });

                await tx.tenantCreditLedger.create({
                    data: {
                        walletId: wallet.id,
                        tenantId: charge.tenantId,
                        chargeId: charge.id,
                        entryType: 'debit',
                        amountCents: -creditAppliedCents,
                        note: 'Auto-applied billing credit',
                    },
                });
            }

            await tx.billingCharge.update({
                where: { id: charge.id },
                data: {
                    status: 'confirmed',
                    reviewedByUserId: reviewerUserId,
                    reviewedAt: new Date(),
                    creditAppliedCents,
                    netAmountCents,
                    rejectionReason: null,
                },
            });

            if (charge.chargeType === 'plan_change') {
                if (!charge.requestedPlan || !charge.requestedInterval) {
                    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Plan change charge is missing target plan metadata', 500);
                }

                await tx.tenant.update({
                    where: { id: charge.tenantId },
                    data: {
                        plan: charge.requestedPlan,
                        billingInterval: charge.requestedInterval,
                    },
                });

                await tx.tenantSubscription.upsert({
                    where: { tenantId: charge.tenantId },
                    create: {
                        tenantId: charge.tenantId,
                        plan: charge.requestedPlan,
                        billingInterval: charge.requestedInterval,
                        addonBundles: 0,
                        status: 'active',
                        startedAt: new Date(),
                        currentPeriodEnd: addBillingInterval(new Date(), charge.requestedInterval as 'monthly' | 'annual'),
                    },
                    update: {
                        plan: charge.requestedPlan,
                        billingInterval: charge.requestedInterval,
                        status: 'active',
                        currentPeriodEnd: addBillingInterval(new Date(), charge.requestedInterval as 'monthly' | 'annual'),
                    },
                });
            }

            if (charge.chargeType === 'addon_bundle') {
                const incrementBy = charge.requestedAddonBundles || 0;

                if (incrementBy > 0) {
                    await tx.tenant.update({
                        where: { id: charge.tenantId },
                        data: {
                            addonBundles: {
                                increment: incrementBy,
                            },
                        },
                    });

                    await tx.tenantSubscription.upsert({
                        where: { tenantId: charge.tenantId },
                        create: {
                            tenantId: charge.tenantId,
                            plan: tenantSnapshot.plan,
                            billingInterval: tenantSnapshot.billingInterval,
                            addonBundles: incrementBy,
                            status: 'active',
                            startedAt: new Date(),
                        },
                        update: {
                            addonBundles: {
                                increment: incrementBy,
                            },
                        },
                    });
                }
            }
        });

        await ReferralRewardsService.processPaidRewardForCharge(charge.id);

        return db.billingCharge.findUnique({ where: { id: charge.id } });
    }

    static async rejectCharge(input: {
        chargeId: string;
        reviewerUserId: string;
        reason?: string;
    }): Promise<any> {
        const charge = await db.billingCharge.findUnique({ where: { id: input.chargeId } });
        if (!charge) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Charge not found', 404);
        }

        if (charge.status !== 'pending') {
            throw new AppError(ERROR_CODES.CONFLICT, 'Charge is not pending', 409);
        }

        const updated = await db.billingCharge.update({
            where: { id: input.chargeId },
            data: {
                status: 'rejected',
                reviewedByUserId: input.reviewerUserId,
                reviewedAt: new Date(),
                rejectionReason: input.reason || 'Rejected by superadmin',
            },
        });

        return updated;
    }

    static async redeemPoints(input: {
        accountId: string;
        tenantId: string;
        points: number;
    }) {
        const tenant = await db.tenant.findUnique({
            where: { id: input.tenantId },
            select: { ownerId: true },
        });

        if (!tenant) {
            throw new AppError(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant not found', 404);
        }

        if (tenant.ownerId !== input.accountId) {
            throw new AppError(
                ERROR_CODES.FORBIDDEN,
                'You can only redeem points into your own tenant wallets',
                403,
            );
        }

        return ReferralRewardsService.redeemPoints(input);
    }

    static async listChargesForSuperAdmin(status?: 'pending' | 'confirmed' | 'rejected'): Promise<any[]> {
        return db.billingCharge.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: {
                    select: {
                        businessName: true,
                        ownerId: true,
                    },
                },
            },
            take: 200,
        });
    }
}
