import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV2({ content, tokens }: ThemeComponentProps) {
    const headline = content.headline as string || content.title as string || 'Digital Dreams Await';
    const subheadline = content.subheadline as string || content.subtitle as string || 'Step into the future. Discover bookings powered by next-generation technology.';
    const ctaText = content.ctaText as string || content.ctaTextPrimary as string || 'Explore Now';
    const ctaLinkCandidate = content.ctaLink as string || content.ctaLinkPrimary as string;
    const ctaLink = ctaLinkCandidate && ctaLinkCandidate !== '#' ? ctaLinkCandidate : '#booking-widget';
    const imageUrl = content.imageUrl as string || content.backgroundImage as string || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ 
            fontFamily: tokens.font,
            backgroundColor: tokens.background,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            color: tokens.text,
        }}>
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '-10%',
                width: '50vw',
                height: '50vw',
                backgroundColor: tokens.primary,
                borderRadius: '50%',
                filter: 'blur(150px)',
                opacity: 0.3,
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '-10%',
                width: '40vw',
                height: '40vw',
                backgroundColor: tokens.accent,
                borderRadius: '50%',
                filter: 'blur(150px)',
                opacity: 0.2,
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: 'clamp(84px, 12vw, 120px) 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'clamp(22px, 6vw, 64px)',
                alignItems: 'center',
                zIndex: 1,
                position: 'relative'
            }}>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(34px, 9vw, 76px)',
                        fontWeight: 900,
                        color: '#fff',
                        lineHeight: 1.08,
                        letterSpacing: '-0.04em',
                        marginBottom: '32px',
                        textShadow: `0 0 30px ${tokens.primary}80`
                    }}>
                        {headline}
                    </h1>
                    <p style={{
                        fontSize: 'clamp(15px, 3.8vw, 20px)',
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '48px',
                        maxWidth: '500px',
                        fontWeight: 300
                    }}>
                        {subheadline}
                    </p>
                    <a href={ctaLink} style={{
                        display: 'inline-block',
                        background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
                        color: '#fff',
                        padding: '12px 22px',
                        borderRadius: '100px',
                        fontSize: '14px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 10px 30px -10px ${tokens.primary}`
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 20px 40px -10px ${tokens.primary}`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${tokens.primary}`;
                    }}>
                        {ctaText}
                    </a>
                </div>

                <div style={{
                    position: 'relative',
                    borderRadius: '24px',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                    transform: 'perspective(1000px) rotateY(-2deg)',
                }}>
                    <img src={imageUrl} alt="Hero" style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '16/10',
                        objectFit: 'cover',
                        borderRadius: '16px',
                    }} />
                </div>
            </div>
        </section>
    );
}
