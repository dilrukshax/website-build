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

export default function PricingV5({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Pricing';
    const subtitle = (content.subtitle as string) || 'Signal Horizon v5';
    const plans = normalizePlans(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="pricing" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}><h2 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{title}</h2><p style={{ margin: '8px 0 0 0', color: muted, textAlign: 'center' }}>{subtitle}</p><div style={{ marginTop: '12px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>{plans.map((plan, i) => <article key={i} style={{ border, background: card, borderRadius: '14px', padding: '12px' }}><h3 style={{ margin: 0, color: titleColor }}>{plan.name}</h3><p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 900 }}>{plan.price}{plan.period}</p><ul style={{ margin: '8px 0 0 16px', color: muted }}>{plan.features.map((f) => <li key={f}>{f}</li>)}</ul></article>)}</div></div>
        </section>
    );
}
