import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export class PagesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const pages = await db.page.findMany({
                where: { instanceId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    _count: { select: { sections: true } },
                },
            });

            res.json({
                success: true,
                data: pages.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    isPublished: p.isPublished,
                    sortOrder: p.sortOrder,
                    sectionCount: p._count.sections,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const { title, slug, seoJsonb } = req.body;

            // Check slug uniqueness within instance
            const existing = await db.page.findFirst({
                where: { instanceId, slug },
            });
            if (existing) {
                throw new AppError(ERROR_CODES.SLUG_TAKEN, 'A page with this slug already exists', 409, 'slug');
            }

            // Get max sortOrder for positioning
            const maxOrder = await db.page.aggregate({
                where: { instanceId },
                _max: { sortOrder: true },
            });
            const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

            const page = await db.page.create({
                data: {
                    tenantId,
                    instanceId,
                    title,
                    slug,
                    seoJsonb: seoJsonb || null,
                    sortOrder: nextOrder,
                },
            });

            res.status(201).json({ success: true, data: page });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;

            const page = await db.page.findFirst({
                where: { id, instanceId },
                include: {
                    sections: {
                        where: { enabled: true },
                        orderBy: { position: 'asc' },
                        include: {
                            theme: {
                                select: {
                                    id: true,
                                    name: true,
                                    componentKey: true,
                                    schemaJsonb: true,
                                    defaultStylesJsonb: true,
                                    version: true,
                                    feature: { select: { id: true, name: true, slug: true } },
                                },
                            },
                        },
                    },
                },
            });

            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            res.json({ success: true, data: page });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;
            const { title, slug, seoJsonb, isPublished } = req.body;

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            // Check slug uniqueness if changing
            if (slug && slug !== page.slug) {
                const existing = await db.page.findFirst({
                    where: { instanceId, slug, NOT: { id } },
                });
                if (existing) {
                    throw new AppError(ERROR_CODES.SLUG_TAKEN, 'A page with this slug already exists', 409, 'slug');
                }
            }

            const updated = await db.page.update({
                where: { id },
                data: {
                    ...(title !== undefined && { title }),
                    ...(slug !== undefined && { slug }),
                    ...(seoJsonb !== undefined && { seoJsonb }),
                    ...(isPublished !== undefined && { isPublished }),
                },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            await db.page.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Page deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const { pages } = req.body as { pages: Array<{ id: string; sortOrder: number }> };

            // Update all pages in a transaction
            await db.$transaction(
                pages.map((p) =>
                    db.page.updateMany({
                        where: { id: p.id, instanceId },
                        data: { sortOrder: p.sortOrder },
                    })
                )
            );

            res.json({ success: true, data: { message: 'Pages reordered' } });
        } catch (error) {
            next(error);
        }
    }

    static async applyTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const { templateId } = req.body;

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            const template = await db.pageTemplate.findUnique({ where: { id: templateId } });
            if (!template || !template.isActive) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, 'Template not found or inactive', 404);
            }

            // Parse the sections JSON from the template
            const sections = template.sectionsJsonb as Array<{
                themeComponentKey: string;
                defaultContent: Record<string, unknown>;
                defaultStyles: Record<string, unknown>;
            }>;

            // Fetch the corresponding Theme IDs based on component keys
            const componentKeys = sections.map(s => s.themeComponentKey);
            const themes = await db.theme.findMany({
                where: { componentKey: { in: componentKeys }, isActive: true }
            });
            const themeMap = new Map(themes.map(t => [t.componentKey, t]));

            // Delete any existing sections for this page before applying the template
            await db.pageSection.deleteMany({ where: { pageId: id } });

            // Create new sections based on the template
            const createdSections = [];
            for (let i = 0; i < sections.length; i++) {
                const sectionData = sections[i]!;
                const theme = themeMap.get(sectionData.themeComponentKey);

                if (!theme) continue; // Skip if theme not found in DB

                const newSection = await db.pageSection.create({
                    data: {
                        tenantId,
                        instanceId,
                        pageId: id,
                        themeId: theme.id,
                        themeVersionUsed: theme.version,
                        position: i,
                        contentJsonb: sectionData.defaultContent as any,
                        stylesJsonb: sectionData.defaultStyles as any,
                    }
                });
                createdSections.push(newSection);
            }

            res.json({ success: true, data: { message: 'Template applied successfully', sections: createdSections } });
        } catch (error) {
            next(error);
        }
    }
}
