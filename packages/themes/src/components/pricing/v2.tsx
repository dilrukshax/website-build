import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function PricingV2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Access Tiers';
    const subtitle = content.subtitle as string || 'Unlock the architecture that scales with you';
    const plans = (content.plans as { name: string, price: string, features: string[], cta: string }[]) || [
        { name: 'Node / Alpha', price: '$49', features: ['Core API access', 'Community Support', '99.9% Uptime', 'Standard encryption'], cta: 'Initialize Alpha' },
        { name: 'Cluster / Omega', price: '$199', features: ['Full Matrix Access', '0ms latency routing', 'Predictive AI module', 'Dedicated Quantum Link'], cta: 'Initialize Omega' },
    ];

    return (
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 11vw, 140px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(34px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 900, color: '#fff', textShadow: `0 0 15px ${tokens.primary}60`, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(13px, 3.3vw, 16px)', color: tokens.primary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(14px, 4vw, 30px)' }}>
                    {plans.map((plan, i) => {
                        const isFeatured = i === 1;
                        return (
                            <div key={i} style={{ 
                                background: isFeatured ? `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))` : 'rgba(255,255,255,0.02)', 
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${isFeatured ? tokens.accent : `${tokens.primary}40`}`, 
                                borderRadius: '24px', 
                                padding: 'clamp(18px, 5vw, 48px)',
                                boxShadow: isFeatured ? `0 20px 50px -10px ${tokens.accent}40` : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {isFeatured && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '4px', background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})` }} />
                                )}
                                <h3 style={{ fontSize: 'clamp(17px, 4.8vw, 20px)', fontWeight: 800, color: isFeatured ? tokens.accent : '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>{plan.name}</h3>
                                <div style={{ fontSize: 'clamp(34px, 10vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: 'clamp(22px, 5vw, 40px)', letterSpacing: '-2px' }}>
                                    {plan.price}<span style={{ fontSize: 'clamp(14px, 3.8vw, 18px)', fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: 'normal' }}>{plan.price !== 'Custom' && ' / mo'}</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 clamp(22px, 6vw, 48px) 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isFeatured ? tokens.accent : tokens.primary, boxShadow: `0 0 8px ${isFeatured ? tokens.accent : tokens.primary}` }} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button style={{ 
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '100px',
                                    border: isFeatured ? 'none' : `1px solid ${tokens.primary}`,
                                    background: isFeatured ? `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})` : 'transparent',
                                    color: isFeatured ? '#fff' : tokens.primary,
                                    fontSize: 'clamp(12px, 3.2vw, 14px)',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: isFeatured ? `0 10px 20px -10px ${tokens.accent}` : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    if(!isFeatured) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    if(!isFeatured) e.currentTarget.style.background = 'transparent';
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
