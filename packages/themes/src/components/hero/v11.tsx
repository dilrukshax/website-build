'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV11({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Fusion Growth v11';
    const title = (content.title as string) || 'Grow with a lane-specific hero';
    const subtitle = (content.subtitle as string) || 'Each hero version now uses an independent structure.';
    const primaryCtaText = (content.primaryCtaText as string) || (content.ctaText as string) || 'Book Now';
    const primaryCtaLink = ((content.primaryCtaLink as string) || (content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See Details';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#services').trim() || '#services';
    const imageUrl = (content.imageUrl as string) || (content.videoPosterUrl as string) || 'https://placehold.co/1200x800/e2e8f0/0f172a?text=Hero+v11';
    const laneText = 'Fusion Growth v11';

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="hero" style={{ background: sectionBg, padding: 'clamp(78px, 10vw, 128px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, color: titleColor, fontSize: 'clamp(34px, 6vw, 52px)' }}>{title}</h1>
            <span style={{ color: muted, fontSize: '12px', fontWeight: 700 }}>{laneText}</span>
        </header>
        <p style={{ margin: '10px 0 0 0', color: muted }}>{subtitle}</p>
        <div style={{ marginTop: '14px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <a href={primaryCtaLink} style={{ border, borderRadius: '10px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: titleColor }}>{primaryCtaText}</a>
            <a href={secondaryCtaLink} style={{ background: tokens.primary, borderRadius: '10px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff' }}>{secondaryCtaText}</a>
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border, gridColumn: 'span 2' }} />
        </div>
    </div>

        </section>
    );
}
