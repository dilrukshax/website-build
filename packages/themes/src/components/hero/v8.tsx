'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV8({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Salesforce Pipeline v8';
    const title = (content.title as string) || 'Grow with a lane-specific hero';
    const subtitle = (content.subtitle as string) || 'Each hero version now uses an independent structure.';
    const primaryCtaText = (content.primaryCtaText as string) || (content.ctaText as string) || 'Book Now';
    const primaryCtaLink = ((content.primaryCtaLink as string) || (content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See Details';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#services').trim() || '#services';
    const imageUrl = (content.imageUrl as string) || (content.videoPosterUrl as string) || 'https://placehold.co/1200x800/e2e8f0/0f172a?text=Hero+v8';

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="hero" style={{ background: sectionBg, padding: 'clamp(78px, 10vw, 128px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1080px', margin: '0 auto', border, background: card, borderRadius: '16px', padding: '16px' }}>
        <h1 style={{ margin: 0, color: titleColor, fontSize: 'clamp(30px, 5vw, 48px)' }}>{title}</h1>
        <p style={{ margin: '10px 0 0 0', color: muted }}>{subtitle}</p>
        <div style={{ marginTop: '14px', display: 'grid', gap: '10px', gridTemplateColumns: '2fr 1fr' }}>
            <img src={imageUrl} alt={title} style={{ width: '100%', minHeight: '240px', objectFit: 'cover', borderRadius: '12px', border }} />
            <div style={{ display: 'grid', gap: '8px' }}>
                <a href={primaryCtaLink} style={{ background: tokens.primary, color: '#fff', borderRadius: '8px', minHeight: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>{primaryCtaText}</a>
                <a href={secondaryCtaLink} style={{ border, color: titleColor, borderRadius: '8px', minHeight: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>{secondaryCtaText}</a>
            </div>
        </div>
    </div>

        </section>
    );
}
