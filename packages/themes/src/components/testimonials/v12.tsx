'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type Item = { quote: string; author: string; role?: string };

function normalize(content: Record<string, unknown>): Item[] {
    const fromContent = Array.isArray(content.testimonials)
        ? content.testimonials
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const quote = (typeof record.quote === 'string' ? record.quote : typeof record.text === 'string' ? record.text : '').trim();
                const author = (typeof record.author === 'string' ? record.author : typeof record.name === 'string' ? record.name : '').trim();
                const role = typeof record.role === 'string' ? record.role.trim() : '';
                return quote && author ? ({ quote, author, role: role || undefined } as Item) : null;
            })
            .filter((item): item is Item => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [
        { quote: 'Template lanes finally feel visually independent.', author: 'Avery Shah', role: 'Growth Lead' },
        { quote: 'Builder edits remain safe while design intent stays consistent.', author: 'Jordan Lee', role: 'Ops Manager' },
        { quote: 'Section swaps no longer break visual rhythm.', author: 'Taylor Brooks', role: 'Product Owner' },
    ];
}

export default function TestimonialsV12({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Testimonials';
    const subtitle = (content.subtitle as string) || 'Spectrum Prime v12';
    const items = normalize(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="reviews" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '940px', margin: '0 auto', border, background: card, borderRadius: '16px', padding: '12px' }}><h2 style={{ margin: 0, color: titleColor }}>{title}</h2><p style={{ margin: '8px 0 0 0', color: muted }}>{subtitle}</p><div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>{items.map((item, i) => <article key={i} style={{ border, borderRadius: '10px', padding: '10px' }}><p style={{ margin: 0, color: titleColor }}>{item.quote}</p><p style={{ margin: '6px 0 0 0', color: tokens.primary }}>{item.author}</p></article>)}</div></div>
        </section>
    );
}
