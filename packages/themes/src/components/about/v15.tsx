import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV15({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'about this journal';
    const body = (content.body as string)
        || 'This blog is where I share essays on creative process, growth, books, and the practical side of building a meaningful life.';
    const imageUrl = (content.imageUrl as string)
        || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80';

    return (
        <section
            id="about"
            style={{
                background: '#f2f1ec',
                padding: 'clamp(62px, 9vw, 104px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'clamp(20px, 4vw, 52px)',
                    alignItems: 'center',
                }}
            >
                <img
                    src={imageUrl}
                    alt={title}
                    style={{
                        width: '100%',
                        borderRadius: '18px',
                        objectFit: 'cover',
                        aspectRatio: '5 / 4',
                        border: '1px solid #dad8cf',
                    }}
                />
                <div>
                    <p
                        style={{
                            margin: 0,
                            color: '#66635b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '12px',
                            fontWeight: 700,
                        }}
                    >
                        About
                    </p>
                    <h2
                        style={{
                            margin: '12px 0 0',
                            color: '#181818',
                            textTransform: 'lowercase',
                            fontSize: 'clamp(34px, 5.8vw, 56px)',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h2>
                    <p
                        style={{
                            margin: '18px 0 0',
                            color: '#4f4c45',
                            fontSize: 'clamp(16px, 2.1vw, 19px)',
                            lineHeight: 1.8,
                        }}
                    >
                        {body}
                    </p>
                </div>
            </div>
        </section>
    );
}
