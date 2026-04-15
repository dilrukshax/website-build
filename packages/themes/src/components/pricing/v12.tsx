'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type Plan = { name: string; price: string; period: string; features: string[]; highlighted?: boolean };

function normalizePlans(content: Record<string, unknown>): Plan[] {
    const source = Array.isArray(content.plans) ? content.plans : Array.isArray(content.tiers) ? content.tiers : [];
    const plans = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const name = typeof record.name === 'string' ? record.name.trim() : '';
            const price = typeof record.price === 'string' ? record.price.trim() : '';
            const period = typeof record.period === 'string' ? record.period.trim() : '/mo';
            const features = Array.isArray(record.features)
                ? record.features.filter((feature): feature is string => typeof feature === 'string' && feature.trim().length > 0)
                : [];
            return name && price ? ({ name, price, period, features, highlighted: Boolean(record.highlighted) } as Plan) : null;
        })
        .filter((item): item is Plan => item !== null);

    if (plans.length > 0) return plans;

    return [
        { name: 'Starter', price: '$49', period: '/mo', features: ['Core booking flow', 'CMS editing'] },
        { name: 'Growth', price: '$99', period: '/mo', features: ['Everything in Starter', 'Conversion templates'], highlighted: true },
        { name: 'Scale', price: '$199', period: '/mo', features: ['Everything in Growth', 'Priority support'] },
    ];
}

export default function PricingV12({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Pricing';
    const subtitle = (content.subtitle as string) || 'Spectrum Prime v12';
    const plans = normalizePlans(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="pricing" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}><h2 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{title}</h2><p style={{ margin: '8px 0 0 0', color: muted, textAlign: 'center' }}>{subtitle}</p><div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>{plans.map((plan, i) => <article key={i} style={{ border, background: card, borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}><span style={{ color: titleColor }}>{plan.name}</span><span style={{ color: tokens.primary, fontWeight: 900 }}>{plan.price}{plan.period}</span></article>)}</div></div>
        </section>
    );
}
