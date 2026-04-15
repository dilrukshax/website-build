'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

export default function FAQV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Frequently Asked Questions';
    const faqs = (content.faqs as { q: string, a: string }[]) || [
        { q: "How do I make a booking?", a: "Select your desired date and time from our booking widget, fill in your details, and proceed to checkout." },
        { q: "What is your cancellation policy?", a: "You can cancel up to 24 hours in advance for a full refund." },
        { q: "Do you offer customer support?", a: "Yes, our support team is available 24/7 to assist you." },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section style={{ backgroundColor: '#f9fafb', padding: '100px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, color: tokens.text }}>{title}</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} style={{ 
                            backgroundColor: tokens.background, 
                            borderRadius: '12px', 
                            border: `1px solid #e5e7eb`,
                            overflow: 'hidden'
                        }}>
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                style={{ 
                                    width: '100%', 
                                    padding: '24px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: tokens.text,
                                    fontFamily: tokens.font
                                }}
                            >
                                {faq.q}
                                <span style={{ 
                                    transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)', 
                                    transition: 'transform 0.3s ease',
                                    color: tokens.primary 
                                }}>▼</span>
                            </button>
                            <div style={{ 
                                maxHeight: openIndex === i ? '500px' : '0', 
                                overflow: 'hidden', 
                                transition: 'max-height 0.3s ease-in-out',
                                padding: openIndex === i ? '0 24px 24px 24px' : '0 24px',
                            }}>
                                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
