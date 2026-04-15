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

export default function TestimonialsV6({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Proof From Recent Deployments';
    const subtitle = (content.subtitle as string) || 'Client Outcomes';
    const items = normalize(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#586273';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const card = '#ffffff';
    const border = '#e9ddc9';

    return (
        <section id="reviews" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                </div>
                <div style={{ marginTop: '12px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {items.map((item, i) => (
                        <article
                            key={i}
                            style={{
                                border: `1px solid ${border}`,
                                background: card,
                                borderRadius: '17px',
                                padding: '16px',
                                boxShadow: '0 14px 30px rgba(25, 29, 36, 0.08)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
                                }}
                            />
                            <p style={{ margin: 0, color: titleColor, lineHeight: 1.7, fontSize: '16px' }}>&ldquo;{item.quote}&rdquo;</p>
                            <p style={{ margin: '10px 0 0 0', color: primary, fontWeight: 800 }}>{item.author}</p>
                            {item.role ? <p style={{ margin: '4px 0 0 0', color: muted, fontSize: '13px' }}>{item.role}</p> : null}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
