import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from '../services/plan-policy.service';

const SHARED_LAYOUT_COMPONENT_KEYS = new Set(['header/v1', 'footer/v1']);
const HOME_PAGE_SLUG = '/';

interface TemplateSectionConfig {
    themeComponentKey: string;
    defaultContent: Record<string, unknown>;
    defaultStyles: Record<string, unknown>;
}

interface SectionCreateInput {
    themeId: string;
    themeVersionUsed: number;
    enabled: boolean;
    contentJsonb: Record<string, unknown>;
    stylesJsonb: Record<string, unknown>;
    conditionsJsonb?: unknown;
}

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
            const normalizedSlug = slug === HOME_PAGE_SLUG ? HOME_PAGE_SLUG : String(slug || '').trim();

            await PlanPolicyService.assertCanCreatePage(tenantId, instanceId);

            const totalPages = await db.page.count({ where: { instanceId } });
            if (totalPages === 0 && normalizedSlug !== HOME_PAGE_SLUG) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    'Create the Home page first. The first page slug must be "/".',
                    400,
                    'slug',
                );
            }

            if (totalPages > 0 && normalizedSlug === HOME_PAGE_SLUG) {
                throw new AppError(ERROR_CODES.SLUG_TAKEN, 'Home page already exists', 409, 'slug');
            }

            if (totalPages > 0) {
                const homePage = await db.page.findFirst({
                    where: { instanceId, slug: HOME_PAGE_SLUG },
                    include: {
                        _count: {
                            select: {
                                sections: true,
                            },
                        },
                    },
                });

                if (!homePage) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Create the Home page ("/") before adding more pages.',
                        400,
                        'slug',
                    );
                }

                if (homePage._count.sections === 0) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Set up the Home page with a template or at least one section before adding more pages.',
                        400,
                        'slug',
                    );
                }
            }

            // Check slug uniqueness within instance
            const existing = await db.page.findFirst({
                where: { instanceId, slug: normalizedSlug },
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
                    slug: normalizedSlug,
                    seoJsonb: seoJsonb || null,
                    sortOrder: nextOrder,
                },
            });

            // New pages should inherit shared layout sections to keep header/footer consistent.
            await cloneSharedLayoutSectionsToNewPage({
                tenantId,
                instanceId,
                newPageId: page.id,
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

            if (slug !== undefined) {
                if (page.slug === HOME_PAGE_SLUG && slug !== HOME_PAGE_SLUG) {
                    throw new AppError(ERROR_CODES.INVALID_INPUT, 'Home page slug cannot be changed', 400, 'slug');
                }

                if (page.slug !== HOME_PAGE_SLUG && slug === HOME_PAGE_SLUG) {
                    throw new AppError(ERROR_CODES.INVALID_INPUT, 'Only the Home page can use "/" slug', 400, 'slug');
                }
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

            if (page.slug === HOME_PAGE_SLUG) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, 'Home page cannot be deleted', 400);
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
            const sections = template.sectionsJsonb as unknown as TemplateSectionConfig[];

            // Fetch the corresponding Theme IDs based on component keys
            const componentKeys = sections.map(s => s.themeComponentKey);
            const themes = await db.theme.findMany({
                where: { componentKey: { in: componentKeys }, isActive: true }
            });
            const themeMap = new Map(themes.map(t => [t.componentKey, t]));

            // Keep existing header/footer if already present on this page.
            const existingSharedSections = await db.pageSection.findMany({
                where: {
                    pageId: id,
                    instanceId,
                    enabled: true,
                    theme: { componentKey: { in: ['header/v1', 'footer/v1'] } },
                },
                include: {
                    theme: {
                        select: {
                            componentKey: true,
                        },
                    },
                },
                orderBy: { position: 'asc' },
            });

            const existingHeader = existingSharedSections.find((sec) => sec.theme.componentKey === 'header/v1');
            const existingFooter = existingSharedSections.find((sec) => sec.theme.componentKey === 'footer/v1');
            const templateHeader = sections.find((sec) => sec.themeComponentKey === 'header/v1');
            const templateFooter = sections.find((sec) => sec.themeComponentKey === 'footer/v1');
            const templateBodySections = sections.filter((sec) => !SHARED_LAYOUT_COMPONENT_KEYS.has(sec.themeComponentKey));

            const sectionsToCreate: SectionCreateInput[] = [];
            const pushTemplateSection = (sectionConfig: TemplateSectionConfig | undefined) => {
                if (!sectionConfig) return;
                const theme = themeMap.get(sectionConfig.themeComponentKey);
                if (!theme) return;

                sectionsToCreate.push({
                    themeId: theme.id,
                    themeVersionUsed: theme.version,
                    enabled: true,
                    contentJsonb: sectionConfig.defaultContent || {},
                    stylesJsonb: sectionConfig.defaultStyles || {},
                });
            };

            if (existingHeader) {
                sectionsToCreate.push({
                    themeId: existingHeader.themeId,
                    themeVersionUsed: existingHeader.themeVersionUsed,
                    enabled: existingHeader.enabled,
                    contentJsonb: existingHeader.contentJsonb as Record<string, unknown>,
                    stylesJsonb: existingHeader.stylesJsonb as Record<string, unknown>,
                    conditionsJsonb: existingHeader.conditionsJsonb,
                });
            } else {
                pushTemplateSection(templateHeader);
            }

            templateBodySections.forEach((sectionConfig) => {
                pushTemplateSection(sectionConfig);
            });

            if (existingFooter) {
                sectionsToCreate.push({
                    themeId: existingFooter.themeId,
                    themeVersionUsed: existingFooter.themeVersionUsed,
                    enabled: existingFooter.enabled,
                    contentJsonb: existingFooter.contentJsonb as Record<string, unknown>,
                    stylesJsonb: existingFooter.stylesJsonb as Record<string, unknown>,
                    conditionsJsonb: existingFooter.conditionsJsonb,
                });
            } else {
                pushTemplateSection(templateFooter);
            }

            // Delete any existing sections for this page before applying the template
            await db.pageSection.deleteMany({ where: { pageId: id } });

            // Create final sections (header/body/footer), preserving shared layout when present.
            const createdSections = [];
            for (let i = 0; i < sectionsToCreate.length; i++) {
                const sectionData = sectionsToCreate[i]!;
                const newSection = await db.pageSection.create({
                    data: {
                        tenantId,
                        instanceId,
                        pageId: id,
                        themeId: sectionData.themeId,
                        themeVersionUsed: sectionData.themeVersionUsed,
                        position: i,
                        enabled: sectionData.enabled,
                        contentJsonb: sectionData.contentJsonb as any,
                        stylesJsonb: sectionData.stylesJsonb as any,
                        ...(sectionData.conditionsJsonb !== undefined && { conditionsJsonb: sectionData.conditionsJsonb as any }),
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

async function cloneSharedLayoutSectionsToNewPage(params: {
    tenantId: string;
    instanceId: string;
    newPageId: string;
}): Promise<void> {
    const { tenantId, instanceId, newPageId } = params;

    const candidatePages = await db.page.findMany({
        where: {
            instanceId,
            id: { not: newPageId },
        },
        orderBy: { sortOrder: 'asc' },
        include: {
            sections: {
                where: {
                    enabled: true,
                    theme: { componentKey: { in: ['header/v1', 'footer/v1'] } },
                },
                orderBy: { position: 'asc' },
                include: {
                    theme: {
                        select: {
                            componentKey: true,
                        },
                    },
                },
            },
        },
    });

    if (candidatePages.length === 0) return;

    let headerSection: (typeof candidatePages)[number]['sections'][number] | null = null;
    let footerSection: (typeof candidatePages)[number]['sections'][number] | null = null;

    for (const page of candidatePages) {
        for (const section of page.sections) {
            if (!headerSection && section.theme.componentKey === 'header/v1') {
                headerSection = section;
            }
            if (!footerSection && section.theme.componentKey === 'footer/v1') {
                footerSection = section;
            }
            if (headerSection && footerSection) {
                break;
            }
        }

        if (headerSection && footerSection) {
            break;
        }
    }

    const sharedSections = [headerSection, footerSection].filter((section) =>
        Boolean(section && SHARED_LAYOUT_COMPONENT_KEYS.has(section.theme.componentKey))
    ) as Array<NonNullable<typeof headerSection>>;

    if (sharedSections.length === 0) return;

    await db.$transaction(
        sharedSections.map((section, position) =>
            db.pageSection.create({
                data: {
                    tenantId,
                    instanceId,
                    pageId: newPageId,
                    themeId: section.themeId,
                    themeVersionUsed: section.themeVersionUsed,
                    position,
                    enabled: section.enabled,
                    contentJsonb: section.contentJsonb as any,
                    stylesJsonb: section.stylesJsonb as any,
                    ...(section.conditionsJsonb !== null && { conditionsJsonb: section.conditionsJsonb as any }),
                },
            })
        )
    );
}
