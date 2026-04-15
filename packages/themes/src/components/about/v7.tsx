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

export default function AboutV7({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Prism Grid';
    const subtitle = (content.subtitle as string) || 'Prism Grid v7';
    const body = (content.body as string) || 'Explain your value clearly before users reach the booking form.';
    const points = normalizePoints(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <h2 style={{ margin: 0, color: titleColor, textAlign: 'center', fontSize: 'clamp(30px,6vw,44px)' }}>{title}</h2>
        <p style={{ margin: '10px auto 0', color: muted, textAlign: 'center', maxWidth: '760px' }}>{body}</p>
        <div style={{ marginTop: '16px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {points.map((p, i) => <article key={i} style={{ border, background: card, borderRadius: '14px', padding: '12px', color: titleColor }}>{p}</article>)}
        </div>
    </div>

        </section>
    );
}
