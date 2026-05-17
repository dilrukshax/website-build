import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { computeSellPrice } from '../services/pricing.service';

/**
 * Supplier product import & review pipeline (design §9).
 *
 * Review-before-publish: nothing reaches customers until the owner approves.
 * Approval refuses to publish when every variant is unavailable. The same
 * pipeline serves API-fetched and assisted-manual imports — only the source of
 * `normalized` differs.
 */
export class ProductImportsController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const imports = await db.supplierProductImport.findMany({
                where: { tenantId: req.tenant!.id, instanceId: req.instance!.id },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ success: true, data: imports });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const row = await db.supplierProductImport.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!row) throw new AppError(ERROR_CODES.IMPORT_NOT_FOUND, 'Import not found', 404);
            res.json({ success: true, data: row });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const { supplierId, supplierItemRef, sourceUrl, raw, normalized } = req.body;

            const supplier = await db.supplier.findFirst({
                where: { id: supplierId, tenantId, instanceId },
            });
            if (!supplier) {
                throw new AppError(ERROR_CODES.SUPPLIER_NOT_FOUND, 'Supplier not found', 404);
            }

            const created = await db.supplierProductImport.create({
                data: {
                    tenantId,
                    instanceId,
                    supplierId,
                    supplierItemRef,
                    sourceUrl: sourceUrl ?? null,
                    rawJsonb: raw ?? {},
                    normalizedJsonb: normalized ?? null,
                    status: normalized ? 'needs_review' : 'imported',
                },
            });
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }

    static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const row = await db.supplierProductImport.findFirst({
                where: { id: req.params.id, tenantId, instanceId },
            });
            if (!row) throw new AppError(ERROR_CODES.IMPORT_NOT_FOUND, 'Import not found', 404);
            if (row.status === 'published') {
                throw new AppError(ERROR_CODES.CONFLICT, 'Import already published', 409);
            }

            const normalized = (row.normalizedJsonb ?? {}) as {
                name?: string;
                description?: string | null;
                imageUrl?: string | null;
                gallery?: string[];
                variants?: Array<{
                    sku?: string | null;
                    options?: Record<string, string>;
                    supplierVariantRef?: string | null;
                    cost: number;
                    availability?: string;
                    stockQty?: number | null;
                }>;
            };
            if (!normalized.name || !normalized.variants?.length) {
                throw new AppError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Import has no normalized product/variants to publish',
                    400,
                );
            }

            const availableVariants = normalized.variants.filter(
                (v) => v.availability !== 'out_of_stock' && v.availability !== 'discontinued',
            );
            if (availableVariants.length === 0) {
                throw new AppError(
                    ERROR_CODES.PRODUCT_UNAVAILABLE,
                    'All variants are unavailable — refusing to publish a misleading listing',
                    409,
                );
            }

            const rule = await db.pricingRule.findUnique({ where: { instanceId } });
            const profile = await db.storeCommerceProfile.findUnique({ where: { instanceId } });
            const currency = profile?.storeCurrency || 'USD';

            const priced = availableVariants.map((v) => {
                const computed = rule
                    ? computeSellPrice({
                        cost: v.cost,
                        rule: {
                            marginType: rule.marginType as 'percent' | 'fixed',
                            marginValue: Number(rule.marginValue),
                            roundingMode: rule.roundingMode,
                            minMargin: rule.minMargin != null ? Number(rule.minMargin) : null,
                            fxRate: rule.fxRate != null ? Number(rule.fxRate) : null,
                        },
                        fxRate: profile?.defaultFxRate != null ? Number(profile.defaultFxRate) : undefined,
                    })
                    : { price: v.cost, costInStoreCurrency: v.cost, marginApplied: 0 };
                return { v, computed };
            });

            const primary = priced[0];
            if (!primary) {
                throw new AppError(
                    ERROR_CODES.PRODUCT_UNAVAILABLE,
                    'No priceable variant to publish',
                    409,
                );
            }

            const product = await db.$transaction(async (tx) => {
                const created = await tx.product.create({
                    data: {
                        tenantId,
                        instanceId,
                        name: normalized.name as string,
                        description: normalized.description ?? null,
                        imageUrl: normalized.imageUrl ?? null,
                        price: primary.computed.price,
                        currency,
                        isActive: true,
                        status: 'active',
                        supplierId: row.supplierId,
                        supplierItemRef: row.supplierItemRef,
                        sourceUrl: row.sourceUrl,
                        costPrice: primary.computed.costInStoreCurrency,
                        galleryJsonb: normalized.gallery ?? undefined,
                    },
                });
                await tx.productVariant.createMany({
                    data: priced.map(({ v, computed }) => ({
                        tenantId,
                        instanceId,
                        productId: created.id,
                        sku: v.sku ?? null,
                        optionsJsonb: v.options ?? undefined,
                        supplierVariantRef: v.supplierVariantRef ?? null,
                        costPrice: computed.costInStoreCurrency,
                        price: computed.price,
                        currency,
                        availability: (v.availability as
                            | 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'unknown')
                            ?? 'unknown',
                        stockQty: v.stockQty ?? null,
                    })),
                });
                await tx.supplierProductImport.update({
                    where: { id: row.id },
                    data: { status: 'published', publishedProductId: created.id },
                });
                return created;
            });

            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const existing = await db.supplierProductImport.findFirst({
                where: { id: req.params.id, tenantId, instanceId },
            });
            if (!existing) throw new AppError(ERROR_CODES.IMPORT_NOT_FOUND, 'Import not found', 404);
            const row = await db.supplierProductImport.update({
                where: { id: existing.id },
                data: { status: 'rejected', reviewNote: req.body?.reviewNote ?? null },
            });
            res.json({ success: true, data: row });
        } catch (error) {
            next(error);
        }
    }
}
