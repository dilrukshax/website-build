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

export default function TestimonialsV8({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Testimonials';
    const subtitle = (content.subtitle as string) || 'Salesforce Pipeline v8';
    const items = normalize(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="reviews" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1040px', margin: '0 auto' }}><h2 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{title}</h2><div style={{ marginTop: '10px', display: 'flex', gap: '10px', overflowX: 'auto' }}>{items.map((item, i) => <article key={i} style={{ flex: '0 0 320px', border, background: card, borderRadius: '14px', padding: '12px' }}><p style={{ margin: 0, color: titleColor }}>&ldquo;{item.quote}&rdquo;</p><p style={{ margin: '8px 0 0 0', color: tokens.primary }}>{item.author}</p></article>)}</div></div>
        </section>
    );
}
