import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV3({ content, tokens }: ThemeComponentProps) {
    const headline = content.headline as string || content.title as string || 'Let\'s create something magical!';
    const subheadline = content.subheadline as string || content.subtitle as string || 'Experience booking like never before with our playful, vibrant, and incredibly smooth platform.';
    const ctaText = content.ctaText as string || content.ctaTextPrimary as string || 'Jump In';
    const ctaLinkCandidate = content.ctaLink as string || content.ctaLinkPrimary as string;
    const ctaLink = ctaLinkCandidate && ctaLinkCandidate !== '#' ? ctaLinkCandidate : '#booking-widget';
    const imageUrl = content.imageUrl as string || content.backgroundImage as string || 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ 
            fontFamily: tokens.font,
            backgroundColor: tokens.background,
            padding: '120px 24px',
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <svg style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', zIndex: 0, opacity: 0.1, fill: tokens.primary, animation: 'spin 20s linear infinite' }} viewBox="0 0 200 200">
                <path d="M42.7,-74.6C54.9,-67.2,64,-53.4,72.7,-39C81.4,-24.6,89.6,-9.7,86.9,4C84.3,17.7,70.9,30.2,59.3,42.5C47.7,54.8,38,66.8,25.3,73.4C12.6,80, -3.2,81.1,-18.2,77.5C-33.3,73.9,-47.5,65.6,-59.4,54.2C-71.3,42.7,-80.9,28.2,-85.4,12.3C-89.9,-3.6,-89.3,-20.9,-82,-35.1C-74.6,-49.4,-60.6,-60.7,-46.1,-67.4C-31.6,-74.1,-15.8,-76.3,0.6,-77.4C17,-78.4,30.5,-82,42.7,-74.6Z" transform="translate(100 100)" />
            </svg>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: '80px',
                alignItems: 'center',
                flexWrap: 'wrap',
                zIndex: 1,
            }}>
                <div style={{
                    flex: '1 1 500px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        width: '100%',
                        height: '100%',
                        backgroundColor: tokens.primary,
                        borderRadius: '40px',
                        zIndex: 0,
                    }} />
                    <img src={imageUrl} alt="Hero" style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        borderRadius: '40px',
                        position: 'relative',
                        zIndex: 1,
                        border: `6px solid ${tokens.background}`
                    }} />
                </div>

                <div style={{ flex: '1 1 400px', zIndex: 2 }}>
                    <h1 style={{
                        fontSize: 'clamp(52px, 7vw, 84px)',
                        fontWeight: 900,
                        color: tokens.text,
                        lineHeight: 1.05,
                        letterSpacing: '-2px',
                        marginBottom: '32px',
                    }}>
                        {headline}
                    </h1>
                    <p style={{
                        fontSize: '22px',
                        fontWeight: 500,
                        color: '#4b5563',
                        lineHeight: 1.6,
                        marginBottom: '48px',
                    }}>
                        {subheadline}
                    </p>
                    <a href={ctaLink} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: tokens.accent,
                        color: '#fff',
                        padding: '18px 48px',
                        borderRadius: '100px',
                        fontSize: '20px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        boxShadow: `0 8px 0 ${tokens.primary}`
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(8px)';
                        e.currentTarget.style.boxShadow = '0 0 0 transparent';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 8px 0 ${tokens.primary}`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 8px 0 ${tokens.primary}`;
                    }}>
                        {ctaText}
                    </a>
                </div>
            </div>
        </section>
    );
}
