'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV10({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Aurora Atelier';
    const subtitle = (content.subtitle as string) || 'Aurora Atelier v10';
    const body = (content.body as string) || 'Explain your value clearly before users reach the booking form.';
    const imageUrl = (content.imageUrl as string) || 'https://placehold.co/1200x800/f1f5f9/0f172a?text=About+v10';

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '14px', gridTemplateColumns: '1fr 1fr' }}>
        <article style={{ border, background: card, borderRadius: '16px', padding: '16px' }}>
            <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
            <blockquote style={{ margin: '12px 0 0 0', borderLeft: `3px solid ${tokens.primary}`, paddingLeft: '10px', color: muted }}>{body}</blockquote>
        </article>
        <img src={imageUrl} alt={title} style={{ width: '100%', minHeight: '260px', objectFit: 'cover', borderRadius: '16px', border }} />
    </div>

        </section>
    );
}
