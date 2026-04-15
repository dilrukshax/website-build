import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function PricingV4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Memberships';
    const subtitle = content.subtitle as string || 'An invitation to exclusivity';
    const plans = (content.plans as { name: string, price: string, features: string[], cta: string }[]) || [
        { name: 'Patron', price: '$2,500', features: ['Curated Access', 'Quarterly Consultations', 'Standard Pre-booking'], cta: 'Apply Now' },
        { name: 'Collector', price: '$10,000', features: ['Global Concierge', 'Priority Pre-booking', 'Exclusive Events', 'Private Transport'], cta: 'Submit Inquiry' },
    ];

    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(34px, 9vw, 100px)' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '0.4em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '32px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.05em', margin: 0 }}>
                        {title}
                    </h2>
                    <div style={{ width: '1px', height: 'clamp(34px, 8vw, 60px)', backgroundColor: tokens.primary, margin: 'clamp(20px, 5vw, 40px) auto 0 auto' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(14px, 4vw, 30px)' }}>
                    {plans.map((plan, i) => {
                        const isFeatured = i === 1;
                        return (
                            <div key={i} style={{ 
                                backgroundColor: isFeatured ? '#0a0a0a' : '#fff',
                                padding: 'clamp(22px, 6vw, 80px) clamp(16px, 5vw, 60px)',
                                border: isFeatured ? 'none' : `1px solid ${tokens.primary}40`,
                                color: isFeatured ? '#fff' : '#1a1a1a',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '24px', color: tokens.primary }}>{plan.name}</h3>
                                <div style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 300, marginBottom: 'clamp(24px, 6vw, 48px)', fontFamily: tokens.font }}>
                                    {plan.price}<span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 300, color: isFeatured ? 'rgba(255,255,255,0.4)' : '#666', fontFamily: tokens.font }}> / Annual</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 clamp(24px, 7vw, 64px) 0', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 3.6vw, 24px)', width: '100%' }}>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} style={{ fontSize: 'clamp(13px, 3.2vw, 14px)', color: isFeatured ? 'rgba(255,255,255,0.7)' : '#4a4a4a', fontWeight: 300, letterSpacing: '0.05em', borderBottom: `1px solid ${isFeatured ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: '14px' }}>{feature}</li>
                                    ))}
                                </ul>
                                <button style={{ 
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: `1px solid ${tokens.primary}`,
                                    backgroundColor: isFeatured ? tokens.primary : 'transparent',
                                    color: isFeatured ? '#0a0a0a' : tokens.primary,
                                    fontSize: 'clamp(11px, 2.9vw, 12px)',
                                    fontWeight: 500,
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s ease',
                                    marginTop: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                    if(!isFeatured) {
                                        e.currentTarget.style.backgroundColor = tokens.primary;
                                        e.currentTarget.style.color = '#fff';
                                    } else {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = tokens.primary;
                                        e.currentTarget.style.borderColor = tokens.primary;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if(!isFeatured) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = tokens.primary;
                                    } else {
                                        e.currentTarget.style.backgroundColor = tokens.primary;
                                        e.currentTarget.style.color = '#0a0a0a';
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
