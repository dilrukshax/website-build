'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type ProofItem = { label: string; value: string };

function normalizeProofItems(content: Record<string, unknown>): ProofItem[] {
    const fromContent = Array.isArray(content.proofItems)
        ? content.proofItems
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const label = typeof record.label === 'string' ? record.label.trim() : '';
                const value = typeof record.value === 'string' ? record.value.trim() : '';
                return label && value ? ({ label, value } as ProofItem) : null;
            })
            .filter((item): item is ProofItem => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [
        { label: 'Avg. Launch Window', value: '14 Days' },
        { label: 'Landing Conversion', value: '4.9%' },
        { label: 'Booked Calls', value: '320+' },
    ];
}

export default function HeroV6({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Acquisition Shop';
    const title = (content.title as string) || 'Build a conversion system your team can operate every week.';
    const subtitle = (content.subtitle as string) || 'From offer framing to booked calls, this template turns traffic into revenue conversations without adding funnel chaos.';
    const primaryCtaText = (content.primaryCtaText as string) || (content.ctaText as string) || 'Book Strategy Call';
    const primaryCtaLink = ((content.primaryCtaLink as string) || (content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'View Revenue Modules';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#services').trim() || '#services';
    const imageUrl = (content.imageUrl as string) || (content.videoPosterUrl as string) || 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=1400';
    const proofItems = normalizeProofItems(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#576172';
    const primary = tokens.primary || '#ff6a3d';
    const secondary = tokens.secondary || '#ffe9c9';
    const accent = tokens.accent || '#1da99b';

    return (
        <section
            id="hero"
            style={{
                background: `radial-gradient(860px 320px at 2% 8%, ${secondary} 0%, transparent 70%), ${sectionBg}`,
                padding: 'clamp(68px, 10vw, 118px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1140px',
                    margin: '0 auto',
                    display: 'grid',
                    gap: '20px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                }}
            >
                <article
                    style={{
                        borderRadius: '24px',
                        border: '1px solid #e8dcc7',
                        padding: 'clamp(20px, 4vw, 34px)',
                        background: 'linear-gradient(180deg, #ffffff 0%, #fff6ea 100%)',
                        boxShadow: '0 20px 42px rgba(25, 29, 36, 0.1)',
                    }}
                >
                    <p style={{ margin: 0, color: primary, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px', fontWeight: 800 }}>
                        {eyebrow}
                    </p>
                    <h1 style={{ margin: '10px 0 0 0', color: titleColor, fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.05 }}>
                        {title}
                    </h1>
                    <p style={{ margin: '14px 0 0 0', color: muted, lineHeight: 1.7, fontSize: '16px' }}>{subtitle}</p>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <a
                            href={primaryCtaLink}
                            style={{
                                background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                                color: '#fff',
                                borderRadius: '12px',
                                minHeight: '44px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0 15px',
                                textDecoration: 'none',
                                fontWeight: 760,
                                boxShadow: '0 14px 20px rgba(255, 106, 61, 0.32)',
                            }}
                        >
                            {primaryCtaText}
                        </a>
                        <a
                            href={secondaryCtaLink}
                            style={{
                                border: '1px solid #e2cfb2',
                                color: titleColor,
                                borderRadius: '12px',
                                minHeight: '44px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                textDecoration: 'none',
                                background: '#fffef9',
                                fontWeight: 600,
                            }}
                        >
                            {secondaryCtaText}
                        </a>
                    </div>

                    <div style={{ marginTop: '18px', display: 'grid', gap: '9px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                        {proofItems.map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    border: '1px solid #e9ddc8',
                                    borderRadius: '13px',
                                    background: '#fff',
                                    padding: '10px',
                                }}
                            >
                                <p style={{ margin: 0, color: '#7f6b51', fontSize: '12px', fontWeight: 700 }}>{item.label}</p>
                                <p style={{ margin: '4px 0 0 0', color: titleColor, fontSize: '19px', fontWeight: 800 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </article>

                <div
                    style={{
                        borderRadius: '24px',
                        border: '1px solid #e8dcc7',
                        overflow: 'hidden',
                        background: '#fff',
                        boxShadow: '0 20px 42px rgba(25, 29, 36, 0.1)',
                        position: 'relative',
                        minHeight: '360px',
                    }}
                >
                    <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', minHeight: '360px', objectFit: 'cover', display: 'block' }} />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.45) 100%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 'auto 14px 14px 14px',
                            display: 'grid',
                            gap: '6px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.28)',
                            background: 'rgba(17, 22, 32, 0.72)',
                            backdropFilter: 'blur(6px)',
                            padding: '10px 12px',
                        }}
                    >
                        <p style={{ margin: 0, color: '#fff', fontWeight: 740, fontSize: '13px' }}>Acquisition Pipeline Snapshot</p>
                        <p style={{ margin: 0, color: '#d7dfec', fontSize: '12px', lineHeight: 1.5 }}>
                            Position offer. Capture intent. Qualify quickly. Book with context.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
