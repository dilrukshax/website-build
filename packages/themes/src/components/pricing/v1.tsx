import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface PricingTier {
    name: string;
    price: string;
    period?: string;
    description?: string;
    features: string[];
    ctaText?: string;
    ctaLink?: string;
    highlighted?: boolean;
}

export default function PricingV1({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Our Pricing';
    const subtitle = (content.subtitle as string) || '';
    const tiers = (content.tiers as PricingTier[]) || [
        {
            name: 'Basic',
            price: '$29',
            period: '/month',
            description: 'Perfect for getting started',
            features: ['1 Service', 'Online Booking', 'Email Support'],
            ctaText: 'Get Started',
            highlighted: false,
        },
        {
            name: 'Pro',
            price: '$79',
            period: '/month',
            description: 'For growing businesses',
            features: ['Unlimited Services', 'Online Booking', 'Priority Support', 'Analytics'],
            ctaText: 'Get Started',
            highlighted: true,
        },
        {
            name: 'Enterprise',
            price: '$199',
            period: '/month',
            description: 'For large teams',
            features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Account Manager', 'SLA'],
            ctaText: 'Contact Us',
            highlighted: false,
        },
    ];

    return (
        <section style={{
            padding: '80px 24px',
            backgroundColor: tokens.background,
            fontFamily: tokens.font,
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Heading */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: tokens.text,
                        margin: '0 0 12px 0',
                        letterSpacing: '-0.5px',
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{ fontSize: '18px', color: '#6b7280', margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Tier Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`,
                    gap: '24px',
                    alignItems: 'start',
                }}>
                    {tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            style={{
                                borderRadius: '16px',
                                padding: '36px 28px',
                                border: tier.highlighted ? `2px solid ${tokens.primary}` : '1px solid #e5e7eb',
                                backgroundColor: tier.highlighted ? tokens.primary : '#fff',
                                color: tier.highlighted ? '#fff' : tokens.text,
                                boxShadow: tier.highlighted
                                    ? `0 20px 40px -10px ${tokens.primary}55`
                                    : '0 4px 12px rgba(0,0,0,0.06)',
                                transform: tier.highlighted ? 'scale(1.04)' : 'none',
                                position: 'relative',
                            }}
                        >
                            {tier.highlighted && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-13px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: tokens.accent,
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    padding: '4px 16px',
                                    borderRadius: '999px',
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '0.5px',
                                }}>
                                    MOST POPULAR
                                </div>
                            )}

                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                margin: '0 0 8px 0',
                                color: tier.highlighted ? '#fff' : tokens.text,
                            }}>
                                {tier.name}
                            </h3>

                            {tier.description && (
                                <p style={{
                                    fontSize: '14px',
                                    margin: '0 0 20px 0',
                                    color: tier.highlighted ? 'rgba(255,255,255,0.8)' : '#6b7280',
                                }}>
                                    {tier.description}
                                </p>
                            )}

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                                <span style={{
                                    fontSize: '44px',
                                    fontWeight: 800,
                                    color: tier.highlighted ? '#fff' : tokens.primary,
                                    lineHeight: 1,
                                }}>
                                    {tier.price}
                                </span>
                                {tier.period && (
                                    <span style={{
                                        fontSize: '15px',
                                        color: tier.highlighted ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                    }}>
                                        {tier.period}
                                    </span>
                                )}
                            </div>

                            <ul style={{ listStyle: 'none', margin: '0 0 32px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(tier.features || []).map((feat, fIdx) => (
                                    <li key={fIdx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '14px',
                                        color: tier.highlighted ? 'rgba(255,255,255,0.9)' : '#374151',
                                    }}>
                                        <span style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            backgroundColor: tier.highlighted ? 'rgba(255,255,255,0.25)' : `${tokens.secondary}22`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            flexShrink: 0,
                                            color: tier.highlighted ? '#fff' : tokens.secondary,
                                            fontWeight: 700,
                                        }}>✓</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            {tier.ctaText && (
                                <a
                                    href={tier.ctaLink || '#'}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        textDecoration: 'none',
                                        backgroundColor: tier.highlighted ? '#fff' : tokens.primary,
                                        color: tier.highlighted ? tokens.primary : '#fff',
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    {tier.ctaText}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
