import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV1({ content, styles, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Welcome to Our Business';
    const subtitle = content.subtitle as string || 'We provide excellent services for you';
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string || '#';
    const backgroundImage = content.backgroundImage as string;
    const fullHeight = styles.fullHeight as boolean;
    const overlay = styles.overlay as boolean;
    const overlayOpacity = (styles.overlayOpacity as number) || 0.5;

    return (
        <section
            style={{
                position: 'relative',
                minHeight: fullHeight ? '90vh' : '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: backgroundImage ? tokens.background : tokens.primary,
                fontFamily: tokens.font,
                overflow: 'hidden',
            }}
        >
            {overlay && backgroundImage && (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity + 0.3}))` }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 24px', maxWidth: '900px' }}>
                <h1 style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, color: backgroundImage ? '#ffffff' : tokens.background, marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                    {title}
                </h1>
                <p style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: backgroundImage ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)', marginBottom: '48px', fontWeight: 400, maxWidth: '700px', marginInline: 'auto' }}>
                    {subtitle}
                </p>
                {ctaText && ctaLink && (
                    <a
                        href={ctaLink}
                        style={{
                            display: 'inline-block',
                            padding: '16px 40px',
                            backgroundColor: tokens.accent,
                            color: '#ffffff',
                            borderRadius: '9999px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '18px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        {ctaText}
                    </a>
                )}
            </div>
        </section>
    );
}
