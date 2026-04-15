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

export default function AboutV9({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Velocity VSL';
    const subtitle = (content.subtitle as string) || 'Velocity VSL v9';
    const points = normalizePoints(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'grid', gap: '12px' }}>
        <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
            {points.map((p, i) => (
                <li key={i} style={{ border, background: card, borderRadius: '12px', padding: '10px', color: titleColor, display: 'grid', gridTemplateColumns: '32px 1fr', gap: '8px' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '999px', background: tokens.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</span>
                    <span>{p}</span>
                </li>
            ))}
        </ol>
    </div>

        </section>
    );
}
