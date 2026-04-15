import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV4({ content, tokens }: ThemeComponentProps) {
    const headline = content.headline as string || content.title as string || 'An Odyssey of Luxury';
    const subheadline = content.subheadline as string || content.subtitle as string || 'Curated experiences for the discerning traveler. Unmatched comfort, absolute elegance.';
    const ctaText = content.ctaText as string || content.ctaTextPrimary as string || 'Begin Journey';
    const ctaLinkCandidate = content.ctaLink as string || content.ctaLinkPrimary as string;
    const ctaLink = ctaLinkCandidate && ctaLinkCandidate !== '#' ? ctaLinkCandidate : '#booking-widget';
    const imageUrl = content.imageUrl as string || content.backgroundImage as string || 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ 
            fontFamily: tokens.font,
            backgroundColor: tokens.background,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            color: tokens.text,
            padding: 'clamp(84px, 12vw, 120px) 16px',
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 0
            }}>
                <img src={imageUrl} alt="Luxury Background" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.5) contrast(1.1)',
                }} />
            </div>

            <div style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '920px',
                margin: '0 auto',
                padding: '0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <span style={{
                    display: 'block',
                    color: tokens.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '32px',
                }}>
                    Welcome to the collection
                </span>
                
                <h1 style={{
                    fontSize: 'clamp(36px, 10vw, 92px)',
                    fontWeight: 400,
                    color: '#fff',
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    marginBottom: '40px',
                }}>
                    {headline}
                </h1>
                
                <p style={{
                    fontSize: 'clamp(15px, 3.8vw, 18px)',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.7,
                    marginBottom: '48px',
                    maxWidth: '600px',
                    margin: '0 auto 48px auto'
                }}>
                    {subheadline}
                </p>
                
                <a href={ctaLink} style={{
                    display: 'inline-block',
                    border: `1px solid ${tokens.primary}`,
                    color: tokens.primary,
                    padding: '12px 22px',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'all 0.6s ease',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = tokens.primary;
                    e.currentTarget.style.color = tokens.background;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)';
                    e.currentTarget.style.color = tokens.primary;
                }}>
                    {ctaText}
                </a>
            </div>
        </section>
    );
}
