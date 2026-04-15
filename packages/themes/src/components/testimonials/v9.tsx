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

export default function TestimonialsV9({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Testimonials';
    const subtitle = (content.subtitle as string) || 'Velocity VSL v9';
    const items = normalize(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="reviews" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <ol style={{ maxWidth: '960px', margin: '0 auto', padding: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>{items.map((item, i) => <li key={i} style={{ border, background: card, borderRadius: '12px', padding: '10px' }}><p style={{ margin: 0, color: titleColor }}>&ldquo;{item.quote}&rdquo;</p><p style={{ margin: '8px 0 0 0', color: tokens.primary }}>{item.author}</p></li>)}</ol>
        </section>
    );
}
