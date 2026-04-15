'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

function normalizePoints(content: Record<string, unknown>): string[] {
    const fromItems = Array.isArray(content.items)
        ? content.items
            .map((item) => {
                if (!item || typeof item !== 'object') return '';
                const record = item as Record<string, unknown>;
                return typeof record.text === 'string' ? record.text.trim() : '';
            })
            .filter((item): item is string => item.length > 0)
        : [];

    if (fromItems.length > 0) return fromItems;

    return [
        'Offer-first structure that guides visitors from problem to booking.',
        'Content blocks tuned for quick scanning and action-focused reading.',
        'CMS-safe layout so teams can edit without breaking visual quality.',
    ];
}

export default function AboutV6({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Built for practical acquisition outcomes.';
    const subtitle = (content.subtitle as string) || 'Acquisition Shop v6';
    const body = (content.body as string) || 'Use this section to explain your method, positioning, and why the booking conversation should happen now.';
    const ctaText = (content.ctaText as string) || 'View Booking Flow';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const imageUrl = (content.imageUrl as string) || 'https://placehold.co/1200x800/f6ead8/2a2116?text=Acquisition+Strategy';
    const points = normalizePoints(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#fffbf5';
    const titleColor = tokens.text || '#2a2116';
    const muted = '#6b5842';
    const primary = tokens.primary || '#b7791f';

    return (
        <section id="about" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div
                style={{
                    maxWidth: '1140px',
                    margin: '0 auto',
                    display: 'grid',
                    gap: '18px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                }}
            >
                <div
                    style={{
                        borderRadius: '22px',
                        border: '1px solid #e8d9be',
                        overflow: 'hidden',
                        background: '#fff',
                        boxShadow: '0 18px 40px rgba(42, 33, 22, 0.10)',
                        minHeight: '340px',
                    }}
                >
                    <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', minHeight: '340px', objectFit: 'cover', display: 'block' }} />
                </div>

                <article
                    style={{
                        borderRadius: '22px',
                        border: '1px solid #e8d9be',
                        padding: 'clamp(20px, 4vw, 34px)',
                        background: 'linear-gradient(180deg, #ffffff 0%, #fff8ee 100%)',
                        boxShadow: '0 18px 40px rgba(42, 33, 22, 0.10)',
                    }}
                >
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{subtitle}</p>
                    <h2 style={{ margin: '10px 0 0 0', color: titleColor, fontSize: 'clamp(30px, 5.4vw, 46px)', lineHeight: 1.12 }}>{title}</h2>
                    <p style={{ margin: '14px 0 0 0', color: muted, lineHeight: 1.7 }}>{body}</p>

                    <div style={{ marginTop: '16px', display: 'grid', gap: '9px' }}>
                        {points.map((point) => (
                            <div
                                key={point}
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'flex-start',
                                    border: '1px solid #eadfcf',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '10px',
                                }}
                            >
                                <span
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: primary,
                                        marginTop: '7px',
                                        flexShrink: 0,
                                    }}
                                />
                                <span style={{ color: titleColor, lineHeight: 1.6 }}>{point}</span>
                            </div>
                        ))}
                    </div>

                    <a
                        href={ctaLink}
                        style={{
                            marginTop: '16px',
                            display: 'inline-flex',
                            textDecoration: 'none',
                            background: primary,
                            color: '#fff',
                            padding: '10px 14px',
                            borderRadius: '11px',
                            fontWeight: 700,
                            boxShadow: '0 10px 18px rgba(183, 121, 31, 0.30)',
                        }}
                    >
                        {ctaText}
                    </a>
                </article>
            </div>
        </section>
    );
}
