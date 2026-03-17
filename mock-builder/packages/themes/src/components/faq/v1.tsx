'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface FAQItem {
    question: string;
    answer: string;
}

export default function FAQv1({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Frequently Asked Questions';
    const subtitle = (content.subtitle as string) || '';
    const items = (content.items as FAQItem[]) || [
        { question: 'How do I book an appointment?', answer: 'You can book online through our website or call us directly. We offer flexible scheduling to fit your needs.' },
        { question: 'What is your cancellation policy?', answer: 'We ask for 24-hour notice for cancellations. Cancellations made within 24 hours may incur a fee.' },
        { question: 'Do you offer any discounts?', answer: 'Yes! We offer loyalty discounts for returning clients and package deals for multiple services booked together.' },
        { question: 'How long does a typical session last?', answer: 'Session lengths vary by service. Most appointments are between 30 minutes to 2 hours. You can find specific durations on our services page.' },
    ];

    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <section style={{
            padding: '80px 24px',
            backgroundColor: '#f9fafb',
            fontFamily: tokens.font,
        }}>
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                {/* Heading */}
                <div style={{ textAlign: 'center', marginBottom: '52px' }}>
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
                        <p style={{ fontSize: '17px', color: '#6b7280', margin: 0 }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Accordion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, idx) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div
                                key={idx}
                                style={{
                                    borderRadius: '12px',
                                    border: isOpen ? `1.5px solid ${tokens.primary}` : '1.5px solid #e5e7eb',
                                    backgroundColor: '#fff',
                                    overflow: 'hidden',
                                    boxShadow: isOpen ? `0 4px 20px ${tokens.primary}18` : '0 1px 4px rgba(0,0,0,0.05)',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                            >
                                {/* Question Row */}
                                <button
                                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '20px 24px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        gap: '16px',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: isOpen ? tokens.primary : tokens.text,
                                        transition: 'color 0.2s',
                                    }}>
                                        {item.question}
                                    </span>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: isOpen ? tokens.primary : '#f3f4f6',
                                        color: isOpen ? '#fff' : '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        fontSize: '18px',
                                        fontWeight: 300,
                                        lineHeight: 1,
                                        transition: 'background-color 0.2s, transform 0.3s',
                                        transform: isOpen ? 'rotate(45deg)' : 'none',
                                    }}>
                                        +
                                    </span>
                                </button>

                                {/* Answer */}
                                <div style={{
                                    maxHeight: isOpen ? '400px' : '0',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.35s ease',
                                }}>
                                    <p style={{
                                        margin: 0,
                                        padding: '0 24px 24px 24px',
                                        fontSize: '15px',
                                        lineHeight: 1.7,
                                        color: '#4b5563',
                                    }}>
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
