'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

function normalizePoints(content: Record<string, unknown>): string[] {
    const fromItems = Array.isArray(content.items)
        ? content.items
            .map((item) => (item && typeof item === 'object' && typeof (item as Record<string, unknown>).text === 'string'
                ? ((item as Record<string, unknown>).text as string).trim()
                : ''))
            .filter((item): item is string => item.length > 0)
        : [];

    if (fromItems.length > 0) return fromItems;

    return [
        'Keep visual consistency across template lanes.',
        'Each version has its own JSX structure.',
        'Editable content stays CMS-safe.',
    ];
}

export default function AboutV11({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Fusion Growth';
    const subtitle = (content.subtitle as string) || 'Fusion Growth v11';
    const body = (content.body as string) || 'Explain your value clearly before users reach the booking form.';
    const ctaText = (content.ctaText as string) || 'Start Booking';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const points = normalizePoints(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, color: titleColor, fontSize: 'clamp(32px,6vw,48px)' }}>{title}</h2>
            <a href={ctaLink} style={{ color: titleColor, textDecoration: 'none', border: `1px solid ${tokens.primary}`, borderRadius: '8px', padding: '8px 12px' }}>{ctaText}</a>
        </header>
        <p style={{ margin: '10px 0 0 0', color: muted }}>{body}</p>
        <div style={{ marginTop: '12px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {points.map((p, i) => <article key={i} style={{ border, background: card, borderRadius: '12px', padding: '10px', color: titleColor }}>{p}</article>)}
        </div>
    </div>

        </section>
    );
}
