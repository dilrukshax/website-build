import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV1({ content, tokens }: ThemeComponentProps) {
    const headline = content.headline as string || content.title as string || 'Experience the Extraordinary';
    const subheadline = content.subheadline as string || content.subtitle as string || 'Discover our world-class services and book your next unforgettable journey with us today.';
    const ctaText = content.ctaText as string || content.ctaTextPrimary as string || 'Book Now';
    const ctaLinkCandidate = content.ctaLink as string || content.ctaLinkPrimary as string;
    const ctaLink = ctaLinkCandidate && ctaLinkCandidate !== '#' ? ctaLinkCandidate : '#booking-widget';
    const imageUrl = content.imageUrl as string || content.backgroundImage as string || 'https://images.unsplash.com/photo-1542314831-c6a4203251ab?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ 
            fontFamily: tokens.font,
            padding: 'clamp(72px, 12vw, 120px) 16px',
            backgroundColor: tokens.background,
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: 'clamp(24px, 6vw, 64px)',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: '1 1 320px', zIndex: 2 }}>
                    <h1 style={{
                        fontSize: 'clamp(34px, 9vw, 72px)',
                        fontWeight: 800,
                        color: tokens.text,
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        marginBottom: '24px'
                    }}>
                        {headline}
                    </h1>
                    <p style={{
                        fontSize: 'clamp(18px, 2vw, 20px)',
                        color: '#6b7280',
                        lineHeight: 1.6,
                        marginBottom: '40px',
                        maxWidth: '540px'
                    }}>
                        {subheadline}
                    </p>
                    <a href={ctaLink} style={{
                        display: 'inline-block',
                        backgroundColor: tokens.primary,
                        color: tokens.background,
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'opacity 0.2s, transform 0.2s',
                        boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                        {ctaText}
                    </a>
                </div>
                
                <div style={{ flex: '1 1 320px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: tokens.secondary,
                        borderRadius: '24px',
                        zIndex: 0
                    }} />
                    <img src={imageUrl} alt="Hero" style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '4/5',
                        objectFit: 'cover',
                        borderRadius: '24px',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }} />
                </div>
            </div>
        </section>
    );
}
