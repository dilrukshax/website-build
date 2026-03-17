import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES, logger, sanitizeSubdomain } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { buildPrimaryFullDomain, normalizeDomainHost } from '../utils/domain';
import { PlanPolicyService } from '../services/plan-policy.service';
import { ReferralRewardsService } from '../services/referral-rewards.service';
import { RoutingIndexService } from '../services/routing-index.service';

type InstanceRecord = Awaited<ReturnType<typeof db.instance.findFirst>>;

type DomainRouteUpdateResult = {
    removed: boolean;
    fallbackHost: string | null;
};

function buildInstanceResponse(instance: NonNullable<InstanceRecord>) {
    const hasCustomDomain = Boolean(instance.customDomain);

    return {
        id: instance.id,
        subdomain: instance.subdomain,
        fullDomain: instance.fullDomain,
        customDomain: instance.customDomain,
        cloudflareAccountId: null,
        cloudflareAccountName: null,
        customDomainHostnameStatus: hasCustomDomain ? 'active' : null,
        customDomainSslStatus: hasCustomDomain ? 'active' : null,
        customDomainIsActive: hasCustomDomain,
        customDomainLastCheckedAt: null,
        customDomainActivatedAt: hasCustomDomain ? instance.updatedAt : null,
        timezone: instance.timezone,
        name: instance.name,
        businessType: instance.businessType,
        status: instance.status,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
    };
}

export class InstancesController {
    private static grantReferralActivationFailOpen(ownerId: string): void {
        void ReferralRewardsService.grantActivationRewardIfEligible(ownerId).catch((error) => {
            logger.warn('Referral activation reward skipped (fail-open)', {
                ownerId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }

    private static refreshRoutingIndexFailOpen(changedHosts: Array<string | null | undefined>): void {
        const normalizedChangedHosts = changedHosts.filter((host): host is string => Boolean(host && host.trim().length > 0));
        const timeoutMs = Number(process.env.ROUTING_INDEX_REBUILD_TIMEOUT_MS || 4000);

        const publishTask = async () => {
            if (timeoutMs > 0) {
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(() => {
                        reject(new Error(`Routing index refresh timed out after ${timeoutMs}ms`));
                    }, timeoutMs);

                    void RoutingIndexService.rebuildAndPublish({ changedHosts: normalizedChangedHosts })
                        .then(() => {
                            clearTimeout(timer);
                            resolve();
                        })
                        .catch((error) => {
                            clearTimeout(timer);
                            reject(error);
                        });
                });
                return;
            }

            await RoutingIndexService.rebuildAndPublish({ changedHosts: normalizedChangedHosts });
        };

        void publishTask().catch((error) => {
            logger.warn('Routing index refresh skipped (fail-open)', {
                error: error instanceof Error ? error.message : String(error),
                hostCount: normalizedChangedHosts.length,
            });
        });
    }

    private static extractLegacyCustomDomainHost(body: unknown): string {
        if (!body || typeof body !== 'object') {
            return '';
        }

        const payload = body as Record<string, unknown>;
        const candidate = [
            payload.host,
            payload.customDomain,
            payload.domain,
            payload.hostname,
        ].find((value) => typeof value === 'string' && value.trim().length > 0);

        return typeof candidate === 'string' ? candidate : '';
    }

    private static async getInstanceForTenant(tenantId: string, instanceId: string) {
        return db.instance.findFirst({
            where: { id: instanceId, tenantId },
            select: {
                id: true,
                fullDomain: true,
                customDomain: true,
                subdomain: true,
                updatedAt: true,
            },
        });
    }

    /**
     * List all instances for the current tenant.
     */
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;

            const instances = await db.instance.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                success: true,
                data: instances.map((inst) => buildInstanceResponse(inst)),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new instance (website) within the current tenant.
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const { name, subdomain, businessType, timezone } = req.body;

            await PlanPolicyService.assertCanCreateInstance(tenantId);

            const cleanSubdomain = sanitizeSubdomain(subdomain);
            if (cleanSubdomain.length < 3) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Subdomain must be at least 3 characters', 400, 'subdomain');
            }

            const existing = await db.instance.findUnique({ where: { subdomain: cleanSubdomain } });
            if (existing) {
                throw new AppError(ERROR_CODES.SUBDOMAIN_TAKEN, 'This subdomain is already taken', 409, 'subdomain');
            }

            const fullDomain = buildPrimaryFullDomain(cleanSubdomain);

            const instance = await db.instance.create({
                data: {
                    tenantId,
                    subdomain: cleanSubdomain,
                    fullDomain,
                    name,
                    businessType: businessType || null,
                    timezone: timezone || 'UTC',
                },
            });

            const tenant = await db.tenant.findUnique({
                where: { id: tenantId },
                select: { ownerId: true },
            });
            if (tenant?.ownerId) {
                InstancesController.grantReferralActivationFailOpen(tenant.ownerId);
            }

            InstancesController.refreshRoutingIndexFailOpen([instance.fullDomain || '', instance.customDomain || '']);

            res.status(201).json({
                success: true,
                data: buildInstanceResponse(instance),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific instance by ID within the current tenant.
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const instance = await db.instance.findFirst({
                where: { id, tenantId },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            res.json({
                success: true,
                data: buildInstanceResponse(instance),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an instance.
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const instance = await db.instance.findFirst({
                where: { id, tenantId },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            const { name, businessType, timezone } = req.body;
            const updated = await db.instance.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(businessType !== undefined && { businessType: businessType || null }),
                    ...(timezone !== undefined && { timezone }),
                },
            });

            res.json({
                success: true,
                data: buildInstanceResponse(updated),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upsert a provider-agnostic domain route for an instance.
     */
    static async upsertDomainRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const { host, active = true, isPrimary = true } = req.body as {
                host: string;
                active?: boolean;
                isPrimary?: boolean;
            };

            const normalizedHost = normalizeDomainHost(host);
            if (!normalizedHost) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'host is required', 400, 'host');
            }

            const instance = await db.instance.findFirst({
                where: { id, tenantId },
                select: {
                    id: true,
                    fullDomain: true,
                    customDomain: true,
                },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            if (active) {
                await PlanPolicyService.assertCanAttachCustomDomain(tenantId, id);
            }

            const upserted = await db.$transaction(async (tx) => {
                const duplicate = await tx.domainRoute.findUnique({
                    where: { host: normalizedHost },
                    select: { id: true, instanceId: true },
                });
                if (duplicate && duplicate.instanceId !== instance.id) {
                    throw new AppError(ERROR_CODES.CONFLICT, 'This domain is already mapped to another website', 409, 'host');
                }

                if (isPrimary) {
                    await tx.domainRoute.updateMany({
                        where: { instanceId: instance.id },
                        data: { isPrimary: false },
                    });
                }

                const route = await tx.domainRoute.upsert({
                    where: { host: normalizedHost },
                    update: {
                        active: Boolean(active),
                        isPrimary: Boolean(isPrimary),
                    },
                    create: {
                        tenantId,
                        instanceId: instance.id,
                        host: normalizedHost,
                        active: Boolean(active),
                        isPrimary: Boolean(isPrimary),
                    },
                });

                if (isPrimary) {
                    if (active) {
                        await tx.instance.update({
                            where: { id: instance.id },
                            data: { customDomain: normalizedHost },
                        });
                    } else if ((instance.customDomain || '').toLowerCase() === normalizedHost) {
                        await tx.instance.update({
                            where: { id: instance.id },
                            data: { customDomain: null },
                        });
                    }
                }

                return route;
            });

            InstancesController.refreshRoutingIndexFailOpen([normalizedHost, instance.fullDomain || '', instance.customDomain || '']);

            res.json({
                success: true,
                data: {
                    id: upserted.id,
                    instanceId: upserted.instanceId,
                    host: upserted.host,
                    active: upserted.active,
                    isPrimary: upserted.isPrimary,
                    updatedAt: upserted.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Legacy compatibility alias for older clients that call POST /custom-domain
     * with payload { customDomain: "example.com" }.
     */
    static async updateCustomDomainLegacy(req: Request, res: Response, next: NextFunction): Promise<void> {
        const extractedHost = InstancesController.extractLegacyCustomDomainHost(req.body);
        req.body = {
            host: extractedHost,
            active: true,
            isPrimary: true,
        };

        return InstancesController.upsertDomainRoute(req, res, next);
    }

    /**
     * Remove a domain route from an instance.
     */
    static async removeDomainRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const hostParam = req.params.host || '';
            const normalizedHost = normalizeDomainHost(hostParam);

            if (!normalizedHost) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'host is required', 400, 'host');
            }

            const instance = await db.instance.findFirst({
                where: { id, tenantId },
                select: {
                    id: true,
                    fullDomain: true,
                    customDomain: true,
                },
            });
            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            const result = await db.$transaction(async (tx): Promise<DomainRouteUpdateResult> => {
                const existing = await tx.domainRoute.findFirst({
                    where: { instanceId: instance.id, host: normalizedHost },
                    select: { id: true, isPrimary: true },
                });

                if (!existing) {
                    return {
                        removed: false,
                        fallbackHost: null,
                    };
                }

                await tx.domainRoute.delete({
                    where: { id: existing.id },
                });

                let fallbackHost: string | null = null;
                if (existing.isPrimary || (instance.customDomain || '').toLowerCase() === normalizedHost) {
                    const fallback = await tx.domainRoute.findFirst({
                        where: { instanceId: instance.id, active: true },
                        orderBy: [
                            { isPrimary: 'desc' },
                            { updatedAt: 'desc' },
                        ],
                    });

                    if (fallback && !fallback.isPrimary) {
                        await tx.domainRoute.update({
                            where: { id: fallback.id },
                            data: { isPrimary: true },
                        });
                    }

                    fallbackHost = fallback?.host || null;
                    await tx.instance.update({
                        where: { id: instance.id },
                        data: {
                            customDomain: fallbackHost,
                        },
                    });
                }

                return {
                    removed: true,
                    fallbackHost,
                };
            });

            if (result.removed) {
                InstancesController.refreshRoutingIndexFailOpen([normalizedHost, instance.fullDomain || '', instance.customDomain || '', result.fallbackHost || '']);
            }

            res.json({
                success: true,
                data: {
                    removed: result.removed,
                    host: normalizedHost,
                },
                message: result.removed ? 'Domain route removed successfully' : 'Domain route not found',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Legacy compatibility alias for DELETE /custom-domain (without host param).
     */
    static async removeCustomDomainLegacy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const instance = await InstancesController.getInstanceForTenant(tenantId, id);

            if (!instance || !instance.customDomain) {
                res.json({
                    success: true,
                    data: {
                        removed: false,
                        host: null,
                    },
                    message: 'No custom domain to remove',
                });
                return;
            }

            req.params.host = instance.customDomain;
            return InstancesController.removeDomainRoute(req, res, next);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Legacy compatibility endpoint for GET /custom-domain/status.
     */
    static async getCustomDomainStatusLegacy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const instance = await InstancesController.getInstanceForTenant(tenantId, id);

            if (!instance || !instance.customDomain) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Custom domain not configured for this instance', 404);
            }

            res.json({
                success: true,
                data: {
                    hostname: instance.customDomain,
                    customDomain: instance.customDomain,
                    status: 'active',
                    hostnameStatus: 'active',
                    sslStatus: 'active',
                    isActive: true,
                    verification: [],
                    verificationErrors: [],
                    cnameTarget: instance.fullDomain || buildPrimaryFullDomain(instance.subdomain),
                    lastCheckedAt: instance.updatedAt,
                    activatedAt: instance.updatedAt,
                    setupLastUpdatedAt: instance.updatedAt,
                    verificationSource: 'snapshot',
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Legacy compatibility endpoint for GET /custom-domain/setup.
     */
    static async getCustomDomainSetupLegacy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const instance = await InstancesController.getInstanceForTenant(tenantId, id);

            if (!instance || !instance.customDomain) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Custom domain not configured for this instance', 404);
            }

            res.json({
                success: true,
                data: {
                    hostname: instance.customDomain,
                    customDomain: instance.customDomain,
                    status: 'active',
                    hostnameStatus: 'active',
                    sslStatus: 'active',
                    isActive: true,
                    verification: [],
                    verificationErrors: [],
                    cnameTarget: instance.fullDomain || buildPrimaryFullDomain(instance.subdomain),
                    lastCheckedAt: instance.updatedAt,
                    activatedAt: instance.updatedAt,
                    setupLastUpdatedAt: instance.updatedAt,
                    verificationSource: 'snapshot',
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Permanently delete an instance and all related records.
     */
    static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const instance = await db.instance.findFirst({
                where: { id, tenantId },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            await db.instance.delete({
                where: { id },
            });

            InstancesController.refreshRoutingIndexFailOpen([instance.fullDomain || '', instance.customDomain || '']);

            res.json({
                success: true,
                data: {
                    message: 'Instance deleted successfully',
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
