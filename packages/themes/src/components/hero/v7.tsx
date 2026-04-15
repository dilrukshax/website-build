'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV7({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Prism Grid v7';
    const title = (content.title as string) || 'Grow with a lane-specific hero';
    const subtitle = (content.subtitle as string) || 'Each hero version now uses an independent structure.';
    const primaryCtaText = (content.primaryCtaText as string) || (content.ctaText as string) || 'Book Now';
    const primaryCtaLink = ((content.primaryCtaLink as string) || (content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See Details';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#services').trim() || '#services';
    const imageUrl = (content.imageUrl as string) || (content.videoPosterUrl as string) || 'https://placehold.co/1200x800/0f172a/ffffff?text=Hero+v7';

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="hero" style={{ background: sectionBg, padding: 'clamp(78px, 10vw, 128px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, color: muted, fontWeight: 700 }}>{eyebrow}</p>
        <h1 style={{ margin: '10px 0 0 0', color: titleColor, fontSize: 'clamp(34px, 6vw, 54px)' }}>{title}</h1>
        <p style={{ margin: '12px auto 0', maxWidth: '760px', color: muted }}>{subtitle}</p>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <a href={primaryCtaLink} style={{ background: tokens.primary, color: '#fff', borderRadius: '999px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '0 16px', textDecoration: 'none', fontWeight: 700 }}>{primaryCtaText}</a>
            <a href={secondaryCtaLink} style={{ border, color: titleColor, borderRadius: '999px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '0 16px', textDecoration: 'none' }}>{secondaryCtaText}</a>
        </div>
    </div>

        </section>
    );
}
