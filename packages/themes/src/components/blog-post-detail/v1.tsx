import React from 'react';
import { ThemeComponentProps } from '../../types';

export default function BlogPostDetailV1({
    context,
    styles,
    tokens,
}: ThemeComponentProps) {
    const post = context?.blogPost;

    if (!post) {
        return (
            <section
                style={{
                    backgroundColor: (styles?.backgroundColor as string) || tokens?.background || '#ffffff',
                    color: (styles?.textColor as string) || tokens?.text || '#1f2937',
                    padding: '80px 20px',
                    fontFamily: `${tokens?.font || 'Inter'}, sans-serif`
                }}
            >
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2>[Blog Post Detail Placeholder]</h2>
                    <p>Select a blog post to preview the content layout.</p>
                </div>
            </section>
        );
    }

    return (
        <section
            className="be-theme-mobile-safe"
            style={{
                backgroundColor: (styles?.backgroundColor as string) || tokens?.background || '#ffffff',
                color: (styles?.textColor as string) || tokens?.text || '#1f2937',
                padding: '60px 20px',
                fontFamily: `${tokens?.font || 'Inter'}, sans-serif`
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        marginBottom: '16px'
                    }}>
                        {post.title}
                    </h1>
                </header>
                
                <article
                    className="prose"
                    style={{
                        maxWidth: 'none',
                        lineHeight: 1.8,
                        fontSize: '1.125rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: post.contentHtml || '' }}
                />
            </div>
        </section>
    );
}
