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

export default function AboutV8({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Salesforce Pipeline';
    const subtitle = (content.subtitle as string) || 'Salesforce Pipeline v8';
    const body = (content.body as string) || 'Explain your value clearly before users reach the booking form.';
    const points = normalizePoints(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{subtitle}</p>

    <article style={{ maxWidth: '940px', margin: '0 auto', border, background: card, borderRadius: '18px', padding: '18px' }}>
        <h2 style={{ margin: 0, color: titleColor, fontSize: 'clamp(30px,5vw,42px)' }}>{title}</h2>
        <p style={{ margin: '10px 0 0 0', color: muted }}>{body}</p>
        <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {points.map((p, i) => <span key={i} style={{ border, borderRadius: '999px', padding: '4px 10px', color: titleColor }}>{p}</span>)}
        </div>
    </article>

        </section>
    );
}
