import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV1({ content, styles, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'About Us';
    const body = content.body as string || 'Tell your story here. Share your mission, values, and what makes your business unique.';
    const imageUrl = content.imageUrl as string;
    const imageAlt = content.imageAlt as string || 'About us';
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string;
    const imagePosition = (styles.imagePosition as string) || 'right';

    const textBlock = (
        <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: tokens.text, marginBottom: '24px', fontFamily: tokens.font, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {title}
            </h2>
            <p style={{ fontSize: '18px', lineHeight: 1.8, color: '#4b5563', fontFamily: tokens.font, marginBottom: '32px' }}>
                {body}
            </p>
            {ctaText && ctaLink && (
                <div>
                    <a 
                        href={ctaLink} 
                        style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: tokens.primary, color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        {ctaText}
                    </a>
                </div>
            )}
        </div>
    );

    const imageBlock = imageUrl ? (
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-16px', backgroundColor: tokens.secondary || tokens.primary, opacity: 0.1, borderRadius: '24px', transform: 'rotate(-3deg)', zIndex: 0 }} />
            <img src={imageUrl} alt={imageAlt} style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', maxHeight: '500px', position: 'relative', zIndex: 1, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} />
        </div>
    ) : (
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#f3f4f6', borderRadius: '16px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 500 }}>Add an image</span>
        </div>
    );

    return (
        <section style={{ padding: '80px 24px', backgroundColor: tokens.background, fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '48px', flexWrap: 'wrap', alignItems: 'center' }}>
                {imagePosition === 'left' ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
            </div>
        </section>
    );
}
