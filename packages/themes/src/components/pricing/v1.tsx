import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function PricingV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Simple, Transparent Pricing';
    const subtitle = content.subtitle as string || 'No hidden fees. No surprises.';
    const plans = (content.plans as { name: string, price: string, features: string[], cta: string }[]) || [
        { name: 'Basic', price: '$29', features: ['1 User', '10GB Storage', 'Basic Support'], cta: 'Get Started' },
        { name: 'Pro', price: '$99', features: ['5 Users', '100GB Storage', 'Priority Support', 'Advanced Analytics'], cta: 'Start Free Trial' },
        { name: 'Enterprise', price: 'Custom', features: ['Unlimited Users', 'Unlimited Storage', '24/7 Dedicated Support', 'Custom Integrations'], cta: 'Contact Sales' },
    ];

    return (
        <section style={{ backgroundColor: tokens.background, padding: '120px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, color: tokens.text, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
                    {plans.map((plan, i) => {
                        const isFeatured = i === 1;
                        return (
                            <div key={i} style={{ 
                                backgroundColor: isFeatured ? tokens.primary : tokens.background, 
                                padding: isFeatured ? '64px 40px' : '48px 40px', 
                                borderRadius: '16px', 
                                border: isFeatured ? 'none' : '1px solid #e5e7eb',
                                boxShadow: isFeatured ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                                color: isFeatured ? tokens.background : tokens.text,
                                textAlign: 'center',
                                scale: isFeatured ? '1.05' : '1',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if(!isFeatured) e.currentTarget.style.transform = 'translateY(-8px)';
                            }}
                            onMouseLeave={(e) => {
                                if(!isFeatured) e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: isFeatured ? tokens.background : tokens.text }}>{plan.name}</h3>
                                <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '32px' }}>{plan.price}<span style={{ fontSize: '16px', fontWeight: 500, color: isFeatured ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>{plan.price !== 'Custom' && '/mo'}</span></div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} style={{ fontSize: '16px', color: isFeatured ? 'rgba(255,255,255,0.9)' : '#4b5563' }}>{feature}</li>
                                    ))}
                                </ul>
                                <button style={{ 
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: isFeatured ? 'none' : `1px solid ${tokens.primary}`,
                                    backgroundColor: isFeatured ? tokens.background : 'transparent',
                                    color: isFeatured ? tokens.primary : tokens.primary,
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if(!isFeatured) {
                                        e.currentTarget.style.backgroundColor = tokens.primary;
                                        e.currentTarget.style.color = tokens.background;
                                    } else {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if(!isFeatured) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = tokens.primary;
                                    } else {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}>
                                    {plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
