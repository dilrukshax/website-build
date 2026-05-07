import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES, logger } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { sanitizeBlogHtml } from '../lib/sanitize-blog-html';
import { invalidatePublishedSiteCache } from '../services/publish-cache-invalidation.service';

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseOptionalDate(value: unknown, fieldName: string): Date | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, `${fieldName} must be a valid ISO date`, 400, fieldName);
    }

    return parsed;
}

async function invalidatePublishedSeoArtifactsForInstance(
    tenantId: string,
    instanceId: string,
): Promise<void> {
    const instance = await db.instance.findFirst({
        where: {
            id: instanceId,
            tenantId,
        },
        select: {
            subdomain: true,
            fullDomain: true,
            customDomain: true,
        },
    });

    if (!instance?.subdomain) {
        return;
    }

    try {
        await invalidatePublishedSiteCache({
            action: 'blog',
            subdomain: instance.subdomain,
            fullDomain: instance.fullDomain || null,
            customDomain: instance.customDomain,
            version: 0,
        });
    } catch (cacheError) {
        logger.warn('Cache invalidation failed after blog publish mutation (fail-open)', {
            tenantId,
            instanceId,
            subdomain: instance.subdomain,
            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
    }
}

export class BlogsController {
    static async listCms(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const posts = await db.blogPost.findMany({
                where: { tenantId, instanceId },
                orderBy: [
                    { isPublished: 'desc' },
                    { publishedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
            });

            res.json({ success: true, data: posts });
        } catch (error) {
            next(error);
        }
    }

    static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const posts = await db.blogPost.findMany({
                where: {
                    tenantId,
                    instanceId,
                    isPublished: true,
                },
                orderBy: [
                    { publishedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    featuredImageUrl: true,
                    publishedAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            res.json({ success: true, data: posts });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await db.blogPost.findFirst({
                where: {
                    id: req.params.id,
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                },
            });

            if (!post) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Blog post not found', 404);
            }

            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    static async getBySlugPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawSlug = req.params.slug || '';
            const slug = normalizeSlug(rawSlug);
            if (!slug) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Slug is required', 400, 'slug');
            }

            const post = await db.blogPost.findFirst({
                where: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    slug,
                    isPublished: true,
                },
            });

            if (!post) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Blog post not found', 404);
            }

            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;

            const title = String(req.body.title || '').trim();
            const slug = normalizeSlug(String(req.body.slug || ''));
            const excerpt = typeof req.body.excerpt === 'string' ? req.body.excerpt.trim() : null;
            const rawHtml = String(req.body.contentHtml || '');
            const contentHtml = sanitizeBlogHtml(rawHtml);
            const featuredImageUrl = typeof req.body.featuredImageUrl === 'string' && req.body.featuredImageUrl.trim().length > 0
                ? req.body.featuredImageUrl.trim()
                : null;
            const seoJsonb = req.body.seoJsonb || null;
            const isPublished = Boolean(req.body.isPublished);
            const explicitPublishedAt = parseOptionalDate(req.body.publishedAt, 'publishedAt');

            if (!slug) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Slug is required', 400, 'slug');
            }
            if (!contentHtml) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Content cannot be empty after sanitization', 400, 'contentHtml');
            }

            const duplicate = await db.blogPost.findFirst({
                where: {
                    tenantId,
                    instanceId,
                    slug,
                },
                select: { id: true },
            });
            if (duplicate) {
                throw new AppError(ERROR_CODES.CONFLICT, 'A blog post with this slug already exists', 409, 'slug');
            }

            const publishedAt = isPublished ? (explicitPublishedAt || new Date()) : null;

            const post = await db.blogPost.create({
                data: {
                    tenantId,
                    instanceId,
                    title,
                    slug,
                    excerpt: excerpt || null,
                    contentHtml,
                    featuredImageUrl,
                    seoJsonb,
                    isPublished,
                    publishedAt,
                },
            });

            if (post.isPublished) {
                await invalidatePublishedSeoArtifactsForInstance(tenantId, instanceId);
            }

            res.status(201).json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const postId = req.params.id;

            const existing = await db.blogPost.findFirst({
                where: {
                    id: postId,
                    tenantId,
                    instanceId,
                },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Blog post not found', 404);
            }

            const data: Record<string, unknown> = {};

            if (req.body.title !== undefined) {
                data.title = String(req.body.title || '').trim();
            }

            if (req.body.slug !== undefined) {
                const slug = normalizeSlug(String(req.body.slug || ''));
                if (!slug) {
                    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Slug is required', 400, 'slug');
                }

                const duplicate = await db.blogPost.findFirst({
                    where: {
                        tenantId,
                        instanceId,
                        slug,
                        id: { not: postId },
                    },
                    select: { id: true },
                });
                if (duplicate) {
                    throw new AppError(ERROR_CODES.CONFLICT, 'A blog post with this slug already exists', 409, 'slug');
                }

                data.slug = slug;
            }

            if (req.body.excerpt !== undefined) {
                data.excerpt = typeof req.body.excerpt === 'string' && req.body.excerpt.trim().length > 0
                    ? req.body.excerpt.trim()
                    : null;
            }

            if (req.body.contentHtml !== undefined) {
                const contentHtml = sanitizeBlogHtml(String(req.body.contentHtml || ''));
                if (!contentHtml) {
                    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Content cannot be empty after sanitization', 400, 'contentHtml');
                }
                data.contentHtml = contentHtml;
            }

            if (req.body.featuredImageUrl !== undefined) {
                data.featuredImageUrl = typeof req.body.featuredImageUrl === 'string' && req.body.featuredImageUrl.trim().length > 0
                    ? req.body.featuredImageUrl.trim()
                    : null;
            }

            if (req.body.seoJsonb !== undefined) {
                data.seoJsonb = req.body.seoJsonb || null;
            }

            const explicitPublishedAt = parseOptionalDate(req.body.publishedAt, 'publishedAt');
            const hasPublishFlag = req.body.isPublished !== undefined;

            const nextIsPublished = hasPublishFlag
                ? Boolean(req.body.isPublished)
                : existing.isPublished;

            if (hasPublishFlag) {
                data.isPublished = nextIsPublished;
            }

            if (nextIsPublished) {
                data.publishedAt = explicitPublishedAt
                    || existing.publishedAt
                    || new Date();
            } else if (hasPublishFlag || req.body.publishedAt !== undefined) {
                data.publishedAt = null;
            }

            const post = await db.blogPost.update({
                where: { id: postId },
                data,
            });

            if (existing.isPublished || post.isPublished) {
                await invalidatePublishedSeoArtifactsForInstance(tenantId, instanceId);
            }

            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.blogPost.findFirst({
                where: {
                    id: req.params.id,
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                },
                select: {
                    id: true,
                    isPublished: true,
                },
            });

            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Blog post not found', 404);
            }

            await db.blogPost.update({
                where: { id: req.params.id },
                data: {
                    isPublished: false,
                    publishedAt: null,
                },
            });

            if (existing.isPublished) {
                await invalidatePublishedSeoArtifactsForInstance(req.tenant!.id, req.instance!.id);
            }

            res.json({ success: true, data: { message: 'Blog post unpublished' } });
        } catch (error) {
            next(error);
        }
    }
}
