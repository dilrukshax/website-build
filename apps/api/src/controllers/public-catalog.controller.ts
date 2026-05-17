import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

/**
 * Public storefront catalog with variants (design §10). Only `status=active`
 * products and active, purchasable variants are exposed. Cost/supplier fields
 * are never returned to the storefront.
 */
function publicVariant(v: {
    id: string;
    sku: string | null;
    optionsJsonb: unknown;
    price: unknown;
    compareAtPrice: unknown;
    currency: string;
    availability: string;
    imageUrl: string | null;
}) {
    return {
        id: v.id,
        sku: v.sku,
        options: v.optionsJsonb ?? null,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
        currency: v.currency,
        availability: v.availability,
        imageUrl: v.imageUrl,
    };
}

export class PublicCatalogController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await db.product.findMany({
                where: { instanceId: req.instance!.id, status: 'active' },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                include: { variants: { where: { isActive: true } } },
            });
            res.json({
                success: true,
                data: products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    description: p.description,
                    imageUrl: p.imageUrl,
                    gallery: p.galleryJsonb ?? null,
                    price: Number(p.price),
                    currency: p.currency,
                    shippingInfo: p.shippingInfo,
                    variants: p.variants.map(publicVariant),
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async getBySlugOrId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const key = req.params.key;
            const product = await db.product.findFirst({
                where: {
                    instanceId: req.instance!.id,
                    status: 'active',
                    OR: [{ slug: key }, { id: key }],
                },
                include: { variants: { where: { isActive: true } } },
            });
            if (!product) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Product not found', 404);
            }
            res.json({
                success: true,
                data: {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    description: product.description,
                    imageUrl: product.imageUrl,
                    gallery: product.galleryJsonb ?? null,
                    price: Number(product.price),
                    currency: product.currency,
                    shippingInfo: product.shippingInfo,
                    variants: product.variants.map(publicVariant),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /** Public store profile/policies for trust/footer/policy pages. */
    static async storeInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const p = await db.storeCommerceProfile.findUnique({
                where: { instanceId: req.instance!.id },
            });
            res.json({
                success: true,
                data: p
                    ? {
                        niche: p.niche,
                        storeCurrency: p.storeCurrency,
                        legalBusinessName: p.legalBusinessName,
                        businessAddress: p.businessAddress,
                        supportEmail: p.supportEmail,
                        supportPhone: p.supportPhone,
                        supportWhatsapp: p.supportWhatsapp,
                        shippingPolicy: p.shippingPolicy,
                        returnsPolicy: p.returnsPolicy,
                        refundPolicy: p.refundPolicy,
                        privacyPolicy: p.privacyPolicy,
                        termsPolicy: p.termsPolicy,
                        shippingLeadDays: p.shippingLeadDays,
                    }
                    : null,
            });
        } catch (error) {
            next(error);
        }
    }
}
