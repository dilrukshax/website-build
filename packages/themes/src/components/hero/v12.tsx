'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function HeroV12({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Spectrum Prime v12';
    const title = (content.title as string) || 'Grow with a lane-specific hero';
    const subtitle = (content.subtitle as string) || 'Each hero version now uses an independent structure.';
    const primaryCtaText = (content.primaryCtaText as string) || (content.ctaText as string) || 'Book Now';
    const primaryCtaLink = ((content.primaryCtaLink as string) || (content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See Details';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#services').trim() || '#services';
    const imageUrl = (content.imageUrl as string) || (content.videoPosterUrl as string) || 'https://placehold.co/1200x800/e2e8f0/0f172a?text=Hero+v12';

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="hero" style={{ background: sectionBg, padding: 'clamp(78px, 10vw, 128px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '940px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, color: muted, fontWeight: 700 }}>{eyebrow}</p>
        <h1 style={{ margin: '10px 0 0 0', color: titleColor, fontSize: 'clamp(30px, 5vw, 46px)' }}>{title}</h1>
        <p style={{ margin: '10px 0 0 0', color: muted }}>{subtitle}</p>
        <img src={imageUrl} alt={title} style={{ marginTop: '14px', width: '100%', minHeight: '260px', objectFit: 'cover', borderRadius: '16px', border }} />
        <a href={primaryCtaLink} style={{ marginTop: '14px', display: 'inline-flex', minHeight: '44px', alignItems: 'center', padding: '0 16px', borderRadius: '999px', background: tokens.primary, color: '#fff', textDecoration: 'none' }}>{primaryCtaText}</a>
    </div>

        </section>
    );
}
