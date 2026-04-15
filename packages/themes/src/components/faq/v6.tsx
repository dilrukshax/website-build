'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

type FaqItem = { question: string; answer: string };

function normalizeFaqs(content: Record<string, unknown>): FaqItem[] {
    const source = Array.isArray(content.faqs) ? content.faqs : Array.isArray(content.items) ? content.items : [];
    const normalized = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const question = (typeof record.question === 'string' ? record.question : typeof record.q === 'string' ? record.q : '').trim();
            const answer = (typeof record.answer === 'string' ? record.answer : typeof record.a === 'string' ? record.a : '').trim();
            return question && answer ? { question, answer } : null;
        })
        .filter((item): item is FaqItem => item !== null);

    if (normalized.length > 0) return normalized;

    return [
        { question: 'Can we keep lane consistency?', answer: 'Yes, each template maps directly to a lane version.' },
        { question: 'Is this mobile-ready?', answer: 'Yes, all lane components are responsive.' },
        { question: 'Can editors update content?', answer: 'Yes, content remains builder-driven.' },
    ];
}

export default function FAQV6({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Common Questions Before Launch';
    const subtitle = (content.subtitle as string) || 'Decision Support';
    const faqs = normalizeFaqs(content as Record<string, unknown>);
    const [openIndex, setOpenIndex] = useState(0);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#586273';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const card = '#ffffff';
    const border = '#e9ddc9';

    return (
        <section id="questions" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '920px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    {faqs.map((item, index) => {
                        const open = openIndex === index;
                        return (
                            <article
                                key={index}
                                style={{
                                    border: `1px solid ${border}`,
                                    background: card,
                                    borderRadius: '15px',
                                    boxShadow: '0 14px 30px rgba(25, 29, 36, 0.08)',
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
                                        opacity: open ? 1 : 0,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(open ? -1 : index)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        padding: '14px',
                                        color: titleColor,
                                        fontWeight: 700,
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                    }}
                                >
                                    <span>{item.question}</span>
                                    <span style={{ color: primary, fontWeight: 800 }}>{open ? '−' : '+'}</span>
                                </button>
                                {open ? <p style={{ margin: 0, padding: '0 14px 14px', color: muted, lineHeight: 1.6 }}>{item.answer}</p> : null}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
