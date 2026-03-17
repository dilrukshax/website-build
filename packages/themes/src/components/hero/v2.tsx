import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV2({ content, styles, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Welcome to our platform';
    const subtitle = content.subtitle as string | undefined;
    const ctaTextPrimary = (content.ctaTextPrimary as string) || 'Get Started';
    const ctaLinkPrimary = (content.ctaLinkPrimary as string) || '#';
    const ctaTextSecondary = content.ctaTextSecondary as string | undefined;
    const ctaLinkSecondary = (content.ctaLinkSecondary as string) || '#';
    const imageUrl = (content.imageUrl as string) || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800&h=600';
    const imageAlt = (content.imageAlt as string) || 'Hero image';

    // Styles
    const layout = (styles.layout as string) || 'image-right'; // 'image-right' or 'image-left'
    const padding = (styles.padding as string) || 'large'; // 'small', 'medium', 'large'

    const paddingStyles = {
        small: '40px 24px',
        medium: '80px 24px',
        large: '120px 24px',
    }[padding];

    const flexDirection = layout === 'image-left' ? 'row-reverse' : 'row';

    return (
        <section style={{
            padding: paddingStyles,
            backgroundColor: tokens.background,
            fontFamily: tokens.font,
            color: tokens.text,
            overflow: 'hidden',
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: flexDirection as 'row' | 'row-reverse',
                alignItems: 'center',
                gap: '64px',
                flexWrap: 'wrap',
            }}>
                {/* Text Content Area */}
                <div style={{
                    flex: '1 1 500px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    padding: layout === 'image-left' ? '0 0 0 20px' : '0 20px 0 0',
                }}>
                    <h1 style={{
                        fontSize: 'clamp(40px, 5vw, 64px)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        margin: 0,
                        letterSpacing: '-1px',
                        color: tokens.text,
                    }}>
                        {title}
                    </h1>

                    {subtitle && (
                        <p style={{
                            fontSize: 'clamp(18px, 2vw, 20px)',
                            lineHeight: 1.6,
                            color: '#6b7280',
                            margin: 0,
                            maxWidth: '560px',
                        }}>
                            {subtitle}
                        </p>
                    )}

                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '16px',
                        flexWrap: 'wrap',
                    }}>
                        {ctaTextPrimary && (
                            <a href={ctaLinkPrimary} style={{
                                padding: '16px 32px',
                                backgroundColor: tokens.primary,
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '16px',
                                transition: 'transform 0.2s',
                                textAlign: 'center',
                            }}
                               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                {ctaTextPrimary}
                            </a>
                        )}

                        {ctaTextSecondary && (
                            <a href={ctaLinkSecondary} style={{
                                padding: '16px 32px',
                                backgroundColor: 'transparent',
                                color: tokens.primary,
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '16px',
                                border: `2px solid ${tokens.primary}`,
                                transition: 'all 0.2s',
                                textAlign: 'center',
                            }}
                               onMouseEnter={(e) => {
                                   e.currentTarget.style.transform = 'translateY(-2px)';
                                   e.currentTarget.style.backgroundColor = `${tokens.primary}11`;
                               }}
                               onMouseLeave={(e) => {
                                   e.currentTarget.style.transform = 'none';
                                   e.currentTarget.style.backgroundColor = 'transparent';
                               }}
                            >
                                {ctaTextSecondary}
                            </a>
                        )}
                    </div>
                </div>

                {/* Image Area */}
                <div style={{
                    flex: '1 1 500px',
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                }}>
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '700px',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.5s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    
                    {/* Decorative Blob pattern (optional visual flair) */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${tokens.primary}44, transparent)`,
                        pointerEvents: 'none',
                    }} />
                </div>
            </div>
        </section>
    );
}
