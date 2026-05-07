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
        title: 'How to Prepare for Your First Visit',
        slug: 'how-to-prepare-for-your-first-visit',
        excerpt: 'A simple checklist to make your first appointment smooth and stress-free.',
    },
    {
        title: '5 Expert Tips for Better Results',
        slug: '5-expert-tips-for-better-results',
        excerpt: 'Apply these practical habits to get long-lasting results between appointments.',
    },
    {
        title: 'Behind the Scenes: Our Process',
        slug: 'behind-the-scenes-our-process',
        excerpt: 'A quick look at how we deliver consistent quality from start to finish.',
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

export default function BlogV1({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'Latest Blog Posts';
    const subtitle = (content.subtitle as string) || 'News, ideas, and practical guides from our team.';
    const ctaText = (content.ctaText as string) || '';
    const ctaLink = (content.ctaLink as string) || '/blog';
    const ctaHref = resolveBlogIndexHref(ctaLink, context, isEditor);
    const showExcerpt = (styles?.showExcerpt as boolean) !== false;
    const showFeaturedImage = (styles?.showFeaturedImage as boolean) !== false;
    const showPublishDate = (styles?.showPublishDate as boolean) !== false;
    const showReadMore = (styles?.showReadMore as boolean) !== false;
    const readMoreText = (styles?.readMoreText as string) || 'Read More';

    const fallbackPosts = normalizeFallbackPosts(content);
    const { blogs } = usePublicBlogs(context);
    const dynamicPosts = blogs.map(mapBlogCard);
    const visiblePosts = resolveVisiblePosts({
        content,
        dynamicPosts,
        fallbackPosts,
    });

    return (
        <section style={{ background: '#f8fafc', padding: '96px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '54px' }}>
                    <h2 style={{ margin: '0 0 10px', color: tokens.text, fontSize: '36px', fontWeight: 800 }}>{title}</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '17px' }}>{subtitle}</p>
                    {ctaText && (
                        <div style={{ marginTop: '22px' }}>
                            <a
                                href={ctaHref}
                                data-editor-nav="allow"
                                style={{
                                    display: 'inline-block',
                                    textDecoration: 'none',
                                    padding: '11px 22px',
                                    borderRadius: '10px',
                                    background: tokens.primary,
                                    color: '#ffffff',
                                    fontWeight: 700,
                                }}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>

                {visiblePosts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>No blog posts are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                        {visiblePosts.map((post, index) => (
                            <article
                                key={post.id || `${post.slug}-${index}`}
                                style={{
                                    borderRadius: '14px',
                                    border: `1px solid ${tokens.primary}30`,
                                    background: '#fff',
                                    overflow: 'hidden',
                                    boxShadow: `0 10px 24px ${tokens.primary}16`,
                                }}
                            >
                                <a
                                    href={resolveBlogDetailHref(post.slug, context, isEditor)}
                                    data-editor-nav="allow"
                                    style={{
                                        display: 'block',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        height: '100%',
                                    }}
                                    aria-label={`Open post: ${post.title}`}
                                >
                                    {showFeaturedImage && (
                                        post.featuredImageUrl ? (
                                            <img
                                                src={post.featuredImageUrl}
                                                alt={post.title}
                                                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                            />
                                        ) : (
                                            <div style={{ height: '180px', background: '#e2e8f0' }} />
                                        )
                                    )}
                                    <div style={{ padding: '20px' }}>
                                        {showPublishDate && (
                                            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                {formatPublishedDate(post.publishedAt)}
                                            </p>
                                        )}
                                        <h3 style={{ margin: '0 0 8px', fontSize: '19px', color: tokens.text }}>{post.title}</h3>
                                        {showExcerpt && (
                                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                                                {post.excerpt || 'Read the full article for more details.'}
                                            </p>
                                        )}
                                        {showReadMore && (
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    marginTop: '16px',
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    color: tokens.primary,
                                                }}
                                            >
                                                {readMoreText}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
