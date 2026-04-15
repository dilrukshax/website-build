'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV12({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Spectrum Prime';
    const subtitle = (content.subtitle as string) || 'Spectrum Prime v12';
    const body = (content.body as string) || 'Explain your value clearly before users reach the booking form.';
    const ctaText = (content.ctaText as string) || 'Start Booking';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const imageUrl = (content.imageUrl as string) || 'https://placehold.co/1200x800/f1f5f9/0f172a?text=About+v12';

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '12px', gridTemplateColumns: '1.1fr 0.9fr' }}>
        <article style={{ border, background: card, borderRadius: '18px', padding: '18px' }}>
            <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
            <p style={{ margin: '10px 0 0 0', color: muted }}>{body}</p>
            <a href={ctaLink} style={{ marginTop: '12px', display: 'inline-flex', minHeight: '42px', alignItems: 'center', padding: '0 14px', borderRadius: '999px', textDecoration: 'none', background: tokens.primary, color: '#fff' }}>{ctaText}</a>
        </article>
        <article style={{ border, borderRadius: '18px', overflow: 'hidden' }}>
            <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', minHeight: '260px', objectFit: 'cover', display: 'block' }} />
        </article>
    </div>

        </section>
    );
}
