'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicBlogs, type PublicBlogCard } from '../shared/public-web';

type DisplayBlogCard = {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl?: string;
    publishedAt?: string;
};

const DEFAULT_POSTS: DisplayBlogCard[] = [
    {
        title: 'Editorial SOP: Keep Quality High at Scale',
        slug: 'editorial-sop-keep-quality-high-at-scale',
        excerpt: 'A lightweight process for planning, drafting, reviewing, and publishing every week.',
    },
    {
        title: 'How To Connect Blog Content to Service Booking',
        slug: 'how-to-connect-blog-content-to-service-booking',
        excerpt: 'Structure each post so education and conversion can work together naturally.',
    },
    {
        title: 'What We Track After Every Blog Publish',
        slug: 'what-we-track-after-every-blog-publish',
        excerpt: 'Simple metrics that reveal whether each article is driving qualified traffic.',
    },
];

function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    return typeof value === 'string' ? value.trim() : '';
}

function mapBlogCard(post: PublicBlogCard): DisplayBlogCard {
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt?.trim() || '',
        featuredImageUrl: post.featuredImageUrl || undefined,
        publishedAt: post.publishedAt || undefined,
    };
}

function normalizeFallbackPosts(content: Record<string, unknown>): DisplayBlogCard[] {
    const rawItems = Array.isArray(content.postsList) ? content.postsList : [];
    const posts = rawItems
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = readString(record, 'title');
            const slug = readString(record, 'slug');
            if (!title || !slug) return null;
            return {
                title,
                slug,
                excerpt: readString(record, 'excerpt'),
                featuredImageUrl: readString(record, 'featuredImageUrl') || undefined,
                publishedAt: readString(record, 'publishedAt') || undefined,
            } as DisplayBlogCard;
        })
        .filter((post): post is DisplayBlogCard => post !== null);

    if (posts.length > 0) {
        return posts;
    }

    return DEFAULT_POSTS;
}

function resolveVisiblePosts(input: {
    content: Record<string, unknown>;
    dynamicPosts: DisplayBlogCard[];
    fallbackPosts: DisplayBlogCard[];
}): DisplayBlogCard[] {
    const showAllPosts = (input.content.showAllPosts as boolean) ?? true;
    const featuredCountRaw = Number(input.content.featuredCount ?? 3);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0
        ? Math.floor(featuredCountRaw)
        : 3;

    const source = input.dynamicPosts.length > 0 ? input.dynamicPosts : input.fallbackPosts;
    return showAllPosts ? source : source.slice(0, featuredCount);
}

function formatPublishedDate(dateValue: string | undefined): string {
    if (!dateValue) return '';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function resolveBlogDetailHref(slug: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    const safeSlug = encodeURIComponent(slug);
    if (isEditor && context?.subdomain) {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog/${safeSlug}`;
    }
    return `/blog/${safeSlug}`;
}

function resolveBlogIndexHref(link: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (isEditor && context?.subdomain && link === '/blog') {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }
    return link;
}

export default function BlogV3({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'From The Editorial Desk';
    const subtitle = (content.subtitle as string) || 'Publish long-form trust builders that support booking decisions.';
    const ctaText = (content.ctaText as string) || 'Explore All Articles';
    const ctaLink = (content.ctaLink as string) || '/blog';
    const ctaHref = resolveBlogIndexHref(ctaLink, context, isEditor);

    const showExcerpt = (styles?.showExcerpt as boolean) !== false;
    const showFeaturedImage = (styles?.showFeaturedImage as boolean) !== false;
    const showPublishDate = (styles?.showPublishDate as boolean) !== false;
    const showReadMore = (styles?.showReadMore as boolean) !== false;
    const readMoreText = (styles?.readMoreText as string) || 'Read Full Story';

    const fallbackPosts = normalizeFallbackPosts(content);
    const { blogs } = usePublicBlogs(context);
    const dynamicPosts = blogs.map(mapBlogCard);
    const visiblePosts = resolveVisiblePosts({
        content,
        dynamicPosts,
        fallbackPosts,
    });

    return (
        <section style={{ background: '#ffffff', padding: 'clamp(70px, 10vw, 112px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px', display: 'grid', gap: '12px' }}>
                    <p style={{ margin: 0, color: tokens.primary, fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Blog Section
                    </p>
                    <h2 style={{ margin: 0, color: tokens.text, fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.1 }}>{title}</h2>
                    <p style={{ margin: 0, color: '#5b667b', lineHeight: 1.7, maxWidth: '760px' }}>{subtitle}</p>
                </div>

                {visiblePosts.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '18px 0' }}>No blog posts are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {visiblePosts.map((post, index) => (
                            <article
                                key={post.id || `${post.slug}-${index}`}
                                style={{
                                    borderRadius: '16px',
                                    border: `1px solid ${tokens.primary}26`,
                                    background: '#fff',
                                    overflow: 'hidden',
                                }}
                            >
                                <a
                                    href={resolveBlogDetailHref(post.slug, context, isEditor)}
                                    data-editor-nav="allow"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(72px, 96px) 1fr',
                                        gap: '10px',
                                        alignItems: 'stretch',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                    }}
                                    aria-label={`Open post: ${post.title}`}
                                >
                                    <div
                                        style={{
                                            background: `${tokens.primary}10`,
                                            borderRight: `1px solid ${tokens.primary}20`,
                                            display: 'grid',
                                            placeItems: 'center',
                                            padding: '12px 8px',
                                        }}
                                    >
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: tokens.primary, fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Post</p>
                                            <p style={{ margin: '4px 0 0', color: tokens.text, fontSize: '30px', lineHeight: 1, fontWeight: 800 }}>{index + 1}</p>
                                        </div>
                                    </div>

                                    <div style={{ padding: '16px 16px 16px 0' }}>
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            {showPublishDate && (
                                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                                                    {formatPublishedDate(post.publishedAt)}
                                                </p>
                                            )}

                                            <h3 style={{ margin: 0, color: tokens.text, fontSize: 'clamp(20px, 3vw, 28px)', lineHeight: 1.2 }}>
                                                {post.title}
                                            </h3>

                                            {showExcerpt && (
                                                <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.7 }}>
                                                    {post.excerpt || 'Read the full article for more details.'}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {showReadMore && (
                                                    <span
                                                        style={{
                                                            background: tokens.primary,
                                                            color: '#fff',
                                                            fontWeight: 700,
                                                            borderRadius: '10px',
                                                            padding: '8px 12px',
                                                            fontSize: '13px',
                                                        }}
                                                    >
                                                        {readMoreText}
                                                    </span>
                                                )}

                                                {showFeaturedImage && post.featuredImageUrl && (
                                                    <img
                                                        src={post.featuredImageUrl}
                                                        alt={post.title}
                                                        style={{ width: '72px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '22px' }}>
                    <a
                        href={ctaHref}
                        data-editor-nav="allow"
                        style={{
                            display: 'inline-flex',
                            textDecoration: 'none',
                            color: tokens.primary,
                            fontWeight: 800,
                            letterSpacing: '0.01em',
                        }}
                    >
                        {ctaText}
                    </a>
                </div>
            </div>
        </section>
    );
}
