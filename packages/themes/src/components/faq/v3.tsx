'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

export default function FAQv3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Got questions?';
    const faqs = (content.faqs as { q: string, a: string }[]) || [
        { q: "Is this really fun to use?", a: "Oh absolutely. It's built for maximum joy." },
        { q: "Can I bring my friends?", a: "The more the merrier! Bring everyone." },
        { q: "How fast does it go?", a: "Fasten your seatbelts, we're taking off!" },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section style={{ backgroundColor: tokens.background, padding: '140px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <span style={{ display: 'inline-block', backgroundColor: tokens.secondary, padding: '8px 24px', borderRadius: '40px', fontSize: '20px', fontWeight: 800, color: tokens.text, transform: 'rotate(-4deg)', marginBottom: '16px' }}>We have answers</span>
                    <h2 style={{ fontSize: '56px', fontWeight: 900, color: tokens.primary, letterSpacing: '-2px', transform: 'rotate(2deg)' }}>{title}</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} style={{ 
                            backgroundColor: openIndex === i ? tokens.secondary : '#fff', 
                            borderRadius: '32px', 
                            border: `4px solid ${tokens.text}`,
                            boxShadow: `8px 8px 0 ${openIndex === i ? tokens.accent : tokens.primary}`,
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            transform: openIndex === i ? 'scale(1.02)' : 'scale(1)'
                        }}>
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                style={{ 
                                    width: '100%', 
                                    padding: '32px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '24px',
                                    fontWeight: 900,
                                    color: tokens.text,
                                    fontFamily: tokens.font
                                }}
                            >
                                {faq.q}
                                <div style={{ 
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: openIndex === i ? tokens.primary : tokens.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '24px',
                                    fontWeight: 900,
                                    transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)', 
                                    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                    border: `2px solid ${tokens.text}`
                                }}>
                                    {openIndex === i ? '-' : '+'}
                                </div>
                            </button>
                            <div style={{ 
                                maxHeight: openIndex === i ? '500px' : '0', 
                                overflow: 'hidden', 
                                transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                <div style={{ padding: '0 32px 40px', color: '#4b5563', lineHeight: 1.6, fontSize: '18px', fontWeight: 600 }}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
