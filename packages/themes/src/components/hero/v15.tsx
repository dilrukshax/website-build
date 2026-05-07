import React from 'react';
import type { ThemeComponentProps } from '../../types';

function resolveHref(href: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (!isEditor || !context?.subdomain) {
        return href;
    }

    if (href === '/blog') {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }

    if (href === '/') {
        return `/preview/${encodeURIComponent(context.subdomain)}`;
    }

    return href;
}

export default function HeroV15({ content, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'Train of Thought';
    const subtitle = (content.subtitle as string) || 'A personal space for observations, stories, and slow ideas.';
    const ctaText = (content.ctaText as string) || 'Read the Blog';
    const ctaLink = resolveHref(((content.ctaLink as string) || '/blog'), context, isEditor);
    const imageUrl = (content.imageUrl as string)
        || 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80';

    return (
        <section
            style={{
                background: '#f7f6f3',
                color: '#181818',
                padding: 'clamp(56px, 9vw, 92px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'clamp(20px, 4.5vw, 64px)',
                    alignItems: 'center',
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            color: '#6a675f',
                            fontSize: '12px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                        }}
                    >
                        Personal Journal
                    </p>
                    <h1
                        style={{
                            margin: '14px 0 0',
                            fontSize: 'clamp(46px, 7.8vw, 88px)',
                            lineHeight: 0.95,
                            letterSpacing: '-0.03em',
                            fontWeight: 700,
                            textTransform: 'lowercase',
                        }}
                    >
                        {title}
                    </h1>
                    <p
                        style={{
                            margin: '22px 0 0',
                            maxWidth: '520px',
                            color: '#4f4c45',
                            fontSize: 'clamp(16px, 2.2vw, 20px)',
                            lineHeight: 1.7,
                        }}
                    >
                        {subtitle}
                    </p>
                    <a
                        href={ctaLink}
                        data-editor-nav="allow"
                        style={{
                            marginTop: '28px',
                            display: 'inline-flex',
                            textDecoration: 'none',
                            background: '#121212',
                            color: '#fafafa',
                            borderRadius: '999px',
                            padding: '12px 22px',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {ctaText}
                    </a>
                </div>

                <div>
                    <div
                        style={{
                            background: '#fefdf9',
                            borderRadius: '22px',
                            border: '1px solid #dfdcd3',
                            padding: '12px',
                            boxShadow: '0 24px 48px rgba(20, 20, 20, 0.08)',
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={title}
                            style={{
                                width: '100%',
                                display: 'block',
                                borderRadius: '16px',
                                objectFit: 'cover',
                                aspectRatio: '4 / 3',
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
