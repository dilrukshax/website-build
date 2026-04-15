'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type LogoItem = { name: string; imageUrl?: string };

function normalizeLogos(content: Record<string, unknown>): LogoItem[] {
    const fromContent = Array.isArray(content.logos)
        ? content.logos
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const name = typeof record.name === 'string' ? record.name.trim() : '';
                const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl.trim() : '';
                return name ? ({ name, imageUrl: imageUrl || undefined } as LogoItem) : null;
            })
            .filter((item): item is LogoItem => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [{ name: 'Stripe' }, { name: 'Notion' }, { name: 'HubSpot' }, { name: 'Shopify' }, { name: 'Figma' }, { name: 'Slack' }];
}

export default function LogosV6({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Trusted by revenue-led teams';
    const logos = normalizeLogos(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const primary = tokens.primary || '#ff6a3d';
    const card = '#ffffff';
    const border = '#eadfcb';
    const accent = tokens.accent || '#1da99b';

    return (
        <section
            style={{
                background: `linear-gradient(180deg, ${sectionBg} 0%, #fffaf2 100%)`,
                padding: '58px 16px',
                fontFamily: tokens.font,
            }}
        >
            <p
                style={{
                    margin: '0 auto 14px',
                    maxWidth: '1120px',
                    color: primary,
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 760,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}
            >
                {eyebrow}
            </p>
            <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                {logos.map((logo, i) => (
                    <article
                        key={i}
                        style={{
                            border: `1px solid ${border}`,
                            borderRadius: '13px',
                            minHeight: '58px',
                            display: 'grid',
                            placeItems: 'center',
                            color: titleColor,
                            background: i % 3 === 1 ? '#fffbf4' : card,
                            boxShadow: '0 10px 22px rgba(25, 29, 36, 0.06)',
                            fontWeight: 670,
                        }}
                    >
                        {logo.imageUrl ? <img src={logo.imageUrl} alt={logo.name} style={{ maxHeight: '30px', maxWidth: '84px' }} /> : logo.name}
                    </article>
                ))}
            </div>
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '14px auto 0',
                    height: '3px',
                    borderRadius: '999px',
                    background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
                    opacity: 0.34,
                }}
            />
        </section>
    );
}
