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

export default function LogosV7({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Prism Grid v7';
    const logos = normalizeLogos(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section style={{ background: sectionBg, padding: '52px 16px', fontFamily: tokens.font }}>
            <p style={{ margin: '0 auto 12px', maxWidth: '1120px', color: muted, textAlign: 'center', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{eyebrow}</p>
            <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>{logos.map((logo, i) => <span key={i} style={{ border, borderRadius: '999px', padding: '6px 12px', color: titleColor }}>{logo.name}</span>)}</div>
        </section>
    );
}
