import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES, sanitizeSubdomain } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export class InstancesController {
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
                data: instances.map((inst) => ({
                    id: inst.id,
                    subdomain: inst.subdomain,
                    name: inst.name,
                    businessType: inst.businessType,
                    status: inst.status,
                    createdAt: inst.createdAt,
                })),
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
            const { name, subdomain, businessType } = req.body;

            // Sanitize and validate subdomain
            const cleanSubdomain = sanitizeSubdomain(subdomain);
            if (cleanSubdomain.length < 3) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Subdomain must be at least 3 characters', 400, 'subdomain');
            }

            // Check subdomain uniqueness against Instance table
            const existing = await db.instance.findUnique({ where: { subdomain: cleanSubdomain } });
            if (existing) {
                throw new AppError(ERROR_CODES.SUBDOMAIN_TAKEN, 'This subdomain is already taken', 409, 'subdomain');
            }

            const instance = await db.instance.create({
                data: {
                    tenantId,
                    subdomain: cleanSubdomain,
                    name,
                    businessType: businessType || null,
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    id: instance.id,
                    subdomain: instance.subdomain,
                    name: instance.name,
                    businessType: instance.businessType,
                    status: instance.status,
                    createdAt: instance.createdAt,
                },
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
                data: {
                    id: instance.id,
                    subdomain: instance.subdomain,
                    customDomain: instance.customDomain,
                    name: instance.name,
                    businessType: instance.businessType,
                    status: instance.status,
                    createdAt: instance.createdAt,
                    updatedAt: instance.updatedAt,
                },
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

            const { name, businessType } = req.body;
            const updated = await db.instance.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(businessType !== undefined && { businessType: businessType || null }),
                },
            });

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    subdomain: updated.subdomain,
                    name: updated.name,
                    businessType: updated.businessType,
                    status: updated.status,
                    updatedAt: updated.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deactivate an instance.
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

            await db.instance.update({
                where: { id },
                data: { status: 'inactive' },
            });

            res.json({
                success: true,
                data: { message: 'Instance deactivated successfully' },
            });
        } catch (error) {
            next(error);
        }
    }
}
