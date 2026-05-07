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
        title: 'Launch Your Content Engine in 30 Days',
        slug: 'launch-your-content-engine-in-30-days',
        excerpt: 'A practical publishing cadence that helps service teams build steady inbound trust.',
    },
    {
        title: 'How We Structure High-Converting Service Posts',
        slug: 'how-we-structure-high-converting-service-posts',
        excerpt: 'Use this framing to connect educational content with clear next booking steps.',
    },
    {
        title: 'Editorial Checklist for Weekly Publishing',
        slug: 'editorial-checklist-for-weekly-publishing',
        excerpt: 'Ship quality articles consistently with one reusable workflow and role split.',
    },
    {
        title: 'From Blog Reader to Qualified Inquiry',
        slug: 'from-blog-reader-to-qualified-inquiry',
        excerpt: 'Simple CTA placement patterns that keep educational pages conversion-friendly.',
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
    const featuredCountRaw = Number(input.content.featuredCount ?? 4);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0
        ? Math.floor(featuredCountRaw)
        : 4;

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

export default function BlogV2({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'Blog Library';
    const subtitle = (content.subtitle as string) || 'Insights, tutorials, and publishing updates from your team.';
    const ctaText = (content.ctaText as string) || 'View All Posts';
    const ctaLink = (content.ctaLink as string) || '/blog';
    const ctaHref = resolveBlogIndexHref(ctaLink, context, isEditor);

    const showExcerpt = (styles?.showExcerpt as boolean) !== false;
    const showFeaturedImage = (styles?.showFeaturedImage as boolean) !== false;
    const showPublishDate = (styles?.showPublishDate as boolean) !== false;
    const showReadMore = (styles?.showReadMore as boolean) !== false;
    const readMoreText = (styles?.readMoreText as string) || 'Read Article';

    const fallbackPosts = normalizeFallbackPosts(content);
    const { blogs } = usePublicBlogs(context);
    const dynamicPosts = blogs.map(mapBlogCard);
    const visiblePosts = resolveVisiblePosts({
        content,
        dynamicPosts,
        fallbackPosts,
    });

    const [heroPost, ...restPosts] = visiblePosts;

    return (
        <section style={{ background: '#f6f8fc', padding: 'clamp(72px, 10vw, 110px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '14px', marginBottom: '30px' }}>
                    <div style={{ maxWidth: '720px' }}>
                        <h2 style={{ margin: 0, color: tokens.text, fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.1 }}>{title}</h2>
                        <p style={{ margin: '12px 0 0', color: '#5f6f86', fontSize: '16px', lineHeight: 1.7 }}>{subtitle}</p>
                    </div>
                    <a
                        href={ctaHref}
                        data-editor-nav="allow"
                        style={{
                            alignSelf: 'flex-start',
                            background: tokens.primary,
                            color: '#fff',
                            textDecoration: 'none',
                            fontWeight: 700,
                            borderRadius: '12px',
                            padding: '10px 16px',
                            boxShadow: `0 12px 22px ${tokens.primary}33`,
                        }}
                    >
                        {ctaText}
                    </a>
                </div>

                {visiblePosts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '18px 0' }}>
                        No blog posts are available right now.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '14px' }}>
                        {heroPost && (
                            <article
                                style={{
                                    gridColumn: 'span 12',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: '#fff',
                                    border: '1px solid #dde4f0',
                                    boxShadow: '0 24px 42px rgba(30, 41, 59, 0.1)',
                                }}
                            >
                                <a
                                    href={resolveBlogDetailHref(heroPost.slug, context, isEditor)}
                                    data-editor-nav="allow"
                                    style={{
                                        display: 'block',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        height: '100%',
                                    }}
                                    aria-label={`Open post: ${heroPost.title}`}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', minHeight: '280px' }}>
                                        {showFeaturedImage ? (
                                            heroPost.featuredImageUrl ? (
                                                <img
                                                    src={heroPost.featuredImageUrl}
                                                    alt={heroPost.title}
                                                    style={{ width: '100%', height: '100%', minHeight: '240px', objectFit: 'cover', display: 'block' }}
                                                />
                                            ) : (
                                                <div style={{ background: 'linear-gradient(140deg, #dbeafe 0%, #e2e8f0 100%)', minHeight: '240px' }} />
                                            )
                                        ) : null}

                                        <div style={{ padding: '22px', display: 'grid', alignContent: 'center' }}>
                                            {showPublishDate && (
                                                <p style={{ margin: 0, color: tokens.primary, fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                    {formatPublishedDate(heroPost.publishedAt)}
                                                </p>
                                            )}
                                            <h3 style={{ margin: '10px 0 0', fontSize: 'clamp(24px, 4vw, 34px)', color: tokens.text, lineHeight: 1.18 }}>{heroPost.title}</h3>
                                            {showExcerpt && (
                                                <p style={{ margin: '10px 0 0', color: '#4b5563', lineHeight: 1.7 }}>
                                                    {heroPost.excerpt || 'Read the full article for more details.'}
                                                </p>
                                            )}
                                            {showReadMore && (
                                                <span
                                                    style={{
                                                        marginTop: '16px',
                                                        width: 'fit-content',
                                                        color: '#fff',
                                                        background: tokens.primary,
                                                        borderRadius: '10px',
                                                        padding: '9px 13px',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {readMoreText}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </a>
                            </article>
                        )}

                        {restPosts.map((post, index) => (
                            <article
                                key={post.id || `${post.slug}-${index}`}
                                style={{
                                    gridColumn: 'span 12',
                                    borderRadius: '14px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    padding: '18px',
                                }}
                            >
                                <a
                                    href={resolveBlogDetailHref(post.slug, context, isEditor)}
                                    data-editor-nav="allow"
                                    style={{
                                        display: 'flex',
                                        gap: '16px',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                    }}
                                    aria-label={`Open post: ${post.title}`}
                                >
                                    {showFeaturedImage && (
                                        post.featuredImageUrl ? (
                                            <img
                                                src={post.featuredImageUrl}
                                                alt={post.title}
                                                style={{ width: '110px', height: '82px', borderRadius: '10px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '110px', height: '82px', borderRadius: '10px', background: '#e2e8f0' }} />
                                        )
                                    )}

                                    <div style={{ minWidth: '240px', flex: 1 }}>
                                        {showPublishDate && (
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                                                {formatPublishedDate(post.publishedAt)}
                                            </p>
                                        )}
                                        <h4 style={{ margin: '4px 0 0', fontSize: '18px', color: tokens.text }}>{post.title}</h4>
                                        {showExcerpt && (
                                            <p style={{ margin: '6px 0 0', color: '#5f6f86', fontSize: '14px', lineHeight: 1.6 }}>
                                                {post.excerpt || 'Read the full article for more details.'}
                                            </p>
                                        )}
                                    </div>

                                    {showReadMore && (
                                        <span
                                            style={{
                                                color: tokens.primary,
                                                fontWeight: 800,
                                                fontSize: '13px',
                                                letterSpacing: '0.01em',
                                            }}
                                        >
                                            {readMoreText}
                                        </span>
                                    )}
                                </a>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
