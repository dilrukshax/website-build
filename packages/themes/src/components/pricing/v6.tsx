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

export default function PricingV6({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Choose the Growth Velocity';
    const subtitle = (content.subtitle as string) || 'Pricing Architecture';
    const plans = normalizePlans(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#566172';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const card = '#ffffff';
    const border = '#e9ddc9';

    return (
        <section id="pricing" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                </div>
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    {plans.map((plan, i) => (
                        <article
                            key={i}
                            style={{
                                border: `1px solid ${border}`,
                                background: plan.highlighted ? '#fff7ed' : card,
                                borderRadius: '17px',
                                padding: '16px',
                                display: 'grid',
                                gap: '10px',
                                boxShadow: plan.highlighted ? '0 16px 32px rgba(255, 106, 61, 0.22)' : '0 14px 30px rgba(25, 29, 36, 0.08)',
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
                            <div style={{ borderBottom: `1px solid ${border}`, paddingBottom: '10px' }}>
                                <h3 style={{ margin: 0, color: titleColor }}>{plan.name}</h3>
                                <p style={{ margin: '6px 0 0 0', color: primary, fontWeight: 800 }}>
                                    {plan.price}
                                    {plan.period}
                                </p>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', color: muted, display: 'grid', gap: '6px' }}>
                                {plan.features.map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                            <a
                                href="#booking-widget"
                                style={{
                                    marginTop: '4px',
                                    width: 'fit-content',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontWeight: 760,
                                    fontSize: '13px',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                                    boxShadow: '0 10px 18px rgba(255, 106, 61, 0.28)',
                                }}
                            >
                                Start With {plan.name}
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
