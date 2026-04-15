'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

export default function FAQv4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Inquiries';
    const faqs = (content.faqs as { q: string, a: string }[]) || [
        { q: "What is the procedure for acquiring services?", a: "Engage our concierge team directly. We curate each experience with meticulous attention to detail." },
        { q: "Are international limits applicable?", a: "We operate on a global scale. Boundaries do not restrict the caliber of our offerings." },
        { q: "How is privacy maintained?", a: "Discretion is our foremost principle. Your data and movements are guarded with absolute security." },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(34px, 9vw, 100px)' }}>
                    <h2 style={{ fontSize: 'clamp(26px, 7vw, 32px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>{title}</h2>
                    <div style={{ width: '1px', height: 'clamp(34px, 8vw, 60px)', backgroundColor: tokens.primary, margin: 'clamp(20px, 5vw, 40px) auto 0 auto' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} style={{ 
                            borderBottom: `1px solid ${tokens.primary}20`,
                            borderTop: i === 0 ? `1px solid ${tokens.primary}20` : 'none',
                        }}>
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                style={{ 
                                    width: '100%', 
                                    padding: 'clamp(16px, 5vw, 40px) 0',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: 'clamp(13px, 3.3vw, 15px)',
                                    fontWeight: 400,
                                    color: '#1a1a1a',
                                    fontFamily: tokens.font,
                                    letterSpacing: '0.05em',
                                    transition: 'color 0.4s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if(openIndex !== i) e.currentTarget.style.color = tokens.primary;
                                }}
                                onMouseLeave={(e) => {
                                    if(openIndex !== i) e.currentTarget.style.color = '#1a1a1a';
                                }}
                            >
                                <span style={{ flex: 1, paddingRight: 'clamp(16px, 4vw, 40px)' }}>{faq.q}</span>
                                <div style={{ 
                                    width: '12px',
                                    height: '1px',
                                    backgroundColor: openIndex === i ? tokens.primary : '#1a1a1a',
                                    position: 'relative',
                                    transition: 'background-color 0.4s ease'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        width: '1px',
                                        height: '12px',
                                        backgroundColor: '#1a1a1a',
                                        top: '-5px',
                                        left: '5px',
                                        transform: openIndex === i ? 'rotate(90deg)' : 'rotate(0deg)',
                                        opacity: openIndex === i ? 0 : 1,
                                        transition: 'all 0.4s ease'
                                    }} />
                                </div>
                            </button>
                            <div style={{ 
                                maxHeight: openIndex === i ? '500px' : '0', 
                                overflow: 'hidden', 
                                transition: 'max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                <div style={{ 
                                    paddingBottom: 'clamp(16px, 5vw, 40px)',
                                    color: '#666', 
                                    lineHeight: 1.8,
                                    fontSize: 'clamp(13px, 3.2vw, 14px)',
                                    fontWeight: 300,
                                    maxWidth: '100%'
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
