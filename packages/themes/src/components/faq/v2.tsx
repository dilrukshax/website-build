'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

export default function FAQv2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Knowledge Base';
    const faqs = (content.faqs as { q: string, a: string }[]) || [
        { q: "Data encryption protocols?", a: "AES-256 at rest, TLS 1.3 in transit." },
        { q: "Node distribution methodology?", a: "Global CDN utilizing edge-compute architecture." },
        { q: "API Rate limits?", a: "1000 requests per minute on standard tier." },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(30px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 900, color: '#fff', textShadow: `0 0 10px ${tokens.primary}80`, marginBottom: '16px', letterSpacing: '2px' }}>{title}</h2>
                    <div style={{ width: '40px', height: '2px', backgroundColor: tokens.accent, margin: '0 auto', boxShadow: `0 0 10px ${tokens.accent}` }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 3.5vw, 20px)' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${openIndex === i ? tokens.accent : `${tokens.primary}30`}`, 
                            borderRadius: '16px', 
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            boxShadow: openIndex === i ? `0 0 20px -5px ${tokens.accent}40` : 'none'
                        }}>
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                style={{ 
                                    width: '100%', 
                                    padding: 'clamp(14px, 4.5vw, 28px)',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: 'clamp(15px, 3.8vw, 18px)',
                                    fontWeight: 700,
                                    color: openIndex === i ? '#fff' : 'rgba(255,255,255,0.8)',
                                    fontFamily: tokens.font,
                                    letterSpacing: '0.05em'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: tokens.primary, fontSize: 'clamp(11px, 2.8vw, 14px)' }}>[{String(i + 1).padStart(2, '0')}]</span>
                                    {faq.q}
                                </span>
                                <span style={{ 
                                    transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)', 
                                    transition: 'transform 0.3s ease',
                                    color: openIndex === i ? tokens.accent : tokens.primary,
                                    fontSize: 'clamp(18px, 4.8vw, 24px)'
                                }}>+</span>
                            </button>
                            <div style={{ 
                                maxHeight: openIndex === i ? '500px' : '0', 
                                overflow: 'hidden', 
                                transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                <div style={{ 
                                    padding: '0 clamp(14px, 4.5vw, 28px) clamp(14px, 4.5vw, 28px) clamp(28px, 8vw, 56px)',
                                    color: 'rgba(255,255,255,0.6)', 
                                    lineHeight: 1.7,
                                    fontSize: 'clamp(14px, 3.4vw, 16px)',
                                    fontWeight: 300 
                                }}>
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
