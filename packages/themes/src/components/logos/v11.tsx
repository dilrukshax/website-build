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

export default function LogosV11({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Fusion Growth v11';
    const logos = normalizeLogos(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section style={{ background: sectionBg, padding: '52px 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, textAlign: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{eyebrow}</p>
            <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>{logos.map((logo, i) => <article key={i} style={{ border, borderRadius: '12px', minHeight: '56px', display: 'grid', placeItems: 'center', color: titleColor }}>{logo.name}</article>)}</div>
        </section>
    );
}
