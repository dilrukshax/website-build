'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicBlogs, type PublicBlogCard } from '../shared/public-web';

type DisplayPost = {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl?: string;
    publishedAt?: string;
    category?: string;
};

const DEFAULT_POSTS: DisplayPost[] = [
    {
        title: 'How to Build a Quiet Writing Routine',
        slug: 'how-to-build-a-quiet-writing-routine',
        excerpt: 'Simple systems that help you publish without burning out.',
        category: 'Writing',
    },
    {
        title: 'The Difference Between Busy and Creative',
        slug: 'the-difference-between-busy-and-creative',
        excerpt: 'What changed when I stopped glorifying busy work.',
        category: 'Mindset',
    },
    {
        title: 'Why Most Blogs Feel Hard to Read',
        slug: 'why-most-blogs-feel-hard-to-read',
        excerpt: 'A practical readability checklist for better long-form posts.',
        category: 'Publishing',
    },
];

function mapDynamicPost(post: PublicBlogCard): DisplayPost {
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt?.trim() || '',
        featuredImageUrl: post.featuredImageUrl || undefined,
        publishedAt: post.publishedAt || undefined,
        category: 'Journal',
    };
}

function normalizeFallbackPosts(content: Record<string, unknown>): DisplayPost[] {
    if (!Array.isArray(content.postsList)) {
        return DEFAULT_POSTS;
    }

    const posts = content.postsList
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const record = entry as Record<string, unknown>;
            const title = typeof record.title === 'string' ? record.title.trim() : '';
            const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
            if (!title || !slug) return null;

            return {
                title,
                slug,
                excerpt: typeof record.excerpt === 'string' ? record.excerpt.trim() : '',
                featuredImageUrl: typeof record.featuredImageUrl === 'string' ? record.featuredImageUrl.trim() || undefined : undefined,
                publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : undefined,
                category: typeof record.category === 'string' ? record.category : 'Journal',
            } as DisplayPost;
        })
        .filter((entry): entry is DisplayPost => Boolean(entry));

    return posts.length > 0 ? posts : DEFAULT_POSTS;
}

function formatDate(value: string | undefined): string {
    if (!value) return 'Draft';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Draft';
    }
    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function resolveBlogIndexHref(href: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (!isEditor || !context?.subdomain) return href;
    if (href === '/blog') {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }
    return href;
}

function resolveBlogDetailHref(slug: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    const safeSlug = encodeURIComponent(slug);
    if (!isEditor || !context?.subdomain) {
        return `/blog/${safeSlug}`;
    }
    return `/preview/${encodeURIComponent(context.subdomain)}/blog/${safeSlug}`;
}

export default function BlogV15({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'latest posts';
    const subtitle = (content.subtitle as string) || 'Stories, notes, and ideas from the journal.';
    const ctaText = (content.ctaText as string) || 'View all posts';
    const ctaLink = resolveBlogIndexHref(((content.ctaLink as string) || '/blog'), context, isEditor);

    const showAllPosts = (content.showAllPosts as boolean) ?? true;
    const featuredCountRaw = Number(content.featuredCount ?? 6);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0 ? Math.floor(featuredCountRaw) : 6;

    const showFeaturedImage = (styles?.showFeaturedImage as boolean) !== false;
    const showExcerpt = (styles?.showExcerpt as boolean) !== false;
    const showPublishDate = (styles?.showPublishDate as boolean) !== false;
    const showReadMore = (styles?.showReadMore as boolean) !== false;
    const readMoreText = (styles?.readMoreText as string) || 'Read More';

    const dynamicPosts = usePublicBlogs(context).blogs.map(mapDynamicPost);
    const fallbackPosts = normalizeFallbackPosts(content);
    const source = dynamicPosts.length > 0 ? dynamicPosts : fallbackPosts;
    const visiblePosts = showAllPosts ? source : source.slice(0, featuredCount);

    return (
        <section
            id="blog"
            style={{
                background: '#f7f6f3',
                padding: 'clamp(58px, 9vw, 96px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ maxWidth: '700px' }}>
                        <p
                            style={{
                                margin: 0,
                                color: '#67645d',
                                fontSize: '12px',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                            }}
                        >
                            Journal
                        </p>
                        <h2
                            style={{
                                margin: '10px 0 0',
                                fontSize: 'clamp(36px, 6.3vw, 62px)',
                                lineHeight: 0.95,
                                letterSpacing: '-0.02em',
                                textTransform: 'lowercase',
                                color: '#191919',
                            }}
                        >
                            {title}
                        </h2>
                        <p style={{ margin: '16px 0 0', color: '#514e48', fontSize: '17px', lineHeight: 1.7 }}>
                            {subtitle}
                        </p>
                    </div>
                    <a
                        href={ctaLink}
                        data-editor-nav="allow"
                        style={{
                            textDecoration: 'none',
                            background: '#121212',
                            color: '#f7f7f7',
                            borderRadius: '999px',
                            padding: '10px 18px',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontWeight: 700,
                        }}
                    >
                        {ctaText}
                    </a>
                </div>

                {visiblePosts.length === 0 ? (
                    <p style={{ marginTop: '22px', color: '#6b6861' }}>No posts available yet.</p>
                ) : (
                    <div
                        style={{
                            marginTop: '28px',
                            display: 'grid',
                            gap: '16px',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
                        }}
                    >
                        {visiblePosts.map((post, index) => (
                            <article
                                key={post.id || `${post.slug}-${index}`}
                                style={{
                                    border: '1px solid #dddbd3',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#fdfcf9',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <a
                                    href={resolveBlogDetailHref(post.slug, context, isEditor)}
                                    data-editor-nav="allow"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        height: '100%',
                                    }}
                                    aria-label={`Open post: ${post.title}`}
                                >
                                    {showFeaturedImage ? (
                                        post.featuredImageUrl ? (
                                            <img
                                                src={post.featuredImageUrl}
                                                alt={post.title}
                                                style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    aspectRatio: '16 / 10',
                                                    background: 'linear-gradient(145deg, #e7e3d8 0%, #f7f6f3 100%)',
                                                    borderBottom: '1px solid #e4e1d7',
                                                }}
                                            />
                                        )
                                    ) : null}

                                    <div style={{ padding: '18px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    color: '#5f5b54',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {post.category || 'Journal'}
                                            </span>
                                            {showPublishDate && (
                                                <span style={{ fontSize: '12px', color: '#7a766f' }}>{formatDate(post.publishedAt)}</span>
                                            )}
                                        </div>

                                        <h3
                                            style={{
                                                margin: '10px 0 0',
                                                fontSize: 'clamp(24px, 3.5vw, 32px)',
                                                lineHeight: 1.05,
                                                letterSpacing: '-0.01em',
                                                color: '#191919',
                                                textTransform: 'lowercase',
                                            }}
                                        >
                                            {post.title}
                                        </h3>

                                        {showExcerpt && (
                                            <p
                                                style={{
                                                    margin: '10px 0 0',
                                                    color: '#4f4c45',
                                                    fontSize: '15px',
                                                    lineHeight: 1.75,
                                                }}
                                            >
                                                {post.excerpt || 'Open the post to read the full article.'}
                                            </p>
                                        )}

                                        {showReadMore && (
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    marginTop: '14px',
                                                    color: '#181818',
                                                    fontSize: '12px',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 700,
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
