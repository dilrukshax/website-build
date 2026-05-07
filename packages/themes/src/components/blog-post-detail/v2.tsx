import React from 'react';
import type { ThemeComponentProps } from '../../types';

function formatDate(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function resolveBlogIndexHref(context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (isEditor && context?.subdomain) {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }
    return '/blog';
}

export default function BlogPostDetailV2({ context, tokens, styles, isEditor }: ThemeComponentProps) {
    const post = context?.blogPost;

    if (!post) {
        return (
            <section
                style={{
                    backgroundColor: (styles?.backgroundColor as string) || '#f7f6f3',
                    color: (styles?.textColor as string) || '#1b1b1b',
                    padding: '72px 16px',
                    fontFamily: tokens.font,
                }}
            >
                <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#6a675f', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>Blog Layout</p>
                    <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(30px, 5vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'lowercase' }}>Post preview</h2>
                    <p style={{ margin: '12px 0 0', color: '#56534c', lineHeight: 1.8 }}>Select a blog post to preview the full editorial detail layout.</p>
                </div>
            </section>
        );
    }

    return (
        <section
            className="be-theme-mobile-safe"
            style={{
                backgroundColor: (styles?.backgroundColor as string) || '#f7f6f3',
                color: (styles?.textColor as string) || '#1b1b1b',
                padding: 'clamp(58px, 8vw, 90px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <article style={{ maxWidth: '780px', margin: '0 auto' }}>
                <a
                    href={resolveBlogIndexHref(context, isEditor)}
                    data-editor-nav="allow"
                    style={{
                        textDecoration: 'none',
                        color: '#5b5851',
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                    }}
                >
                    Back to Blog
                </a>

                <header style={{ marginTop: '16px' }}>
                    {post.featuredImageUrl ? (
                        <img
                            src={post.featuredImageUrl}
                            alt={post.title}
                            style={{
                                width: '100%',
                                aspectRatio: '16 / 9',
                                objectFit: 'cover',
                                borderRadius: '16px',
                                border: '1px solid #dfdcd3',
                                marginBottom: '18px',
                            }}
                        />
                    ) : null}

                    {post.publishedAt ? (
                        <p
                            style={{
                                margin: 0,
                                color: '#6a675f',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontSize: '11px',
                                fontWeight: 700,
                            }}
                        >
                            {formatDate(post.publishedAt)}
                        </p>
                    ) : null}

                    <h1
                        style={{
                            margin: '12px 0 0',
                            fontSize: 'clamp(38px, 7vw, 70px)',
                            lineHeight: 0.97,
                            letterSpacing: '-0.02em',
                            textTransform: 'lowercase',
                            color: '#161616',
                        }}
                    >
                        {post.title}
                    </h1>

                    {post.excerpt ? (
                        <p style={{ margin: '16px 0 0', color: '#4d4a43', fontSize: '18px', lineHeight: 1.8 }}>{post.excerpt}</p>
                    ) : null}
                </header>

                <div
                    style={{
                        marginTop: '26px',
                        color: '#252525',
                        fontSize: '18px',
                        lineHeight: 1.9,
                    }}
                    dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
                />
            </article>

            <style>{`
                section .prose h2,
                section .prose h3,
                section article h2,
                section article h3,
                section article h4 {
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                    margin-top: 1.35em;
                    margin-bottom: 0.55em;
                }

                section article p {
                    margin: 0.8em 0;
                }

                section article img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 12px;
                }
            `}</style>
        </section>
    );
}
