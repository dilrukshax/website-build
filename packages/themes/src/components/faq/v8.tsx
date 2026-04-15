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

export default function FAQV8({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'FAQ';
    const subtitle = (content.subtitle as string) || 'Salesforce Pipeline v8';
    const faqs = normalizeFaqs(content as Record<string, unknown>);
    const [openIndex, setOpenIndex] = useState(0);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="questions" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <h2 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{title}</h2>
        <p style={{ margin: '8px 0 0 0', color: muted, textAlign: 'center' }}>{subtitle}</p>
        <div style={{ marginTop: '12px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {faqs.map((item, index) => (
                <details key={index} open={index === 0} style={{ border, background: card, borderRadius: '12px', padding: '12px' }}>
                    <summary style={{ color: titleColor, fontWeight: 700 }}>{item.question}</summary>
                    <p style={{ margin: '8px 0 0 0', color: muted }}>{item.answer}</p>
                </details>
            ))}
        </div>
    </div>

        </section>
    );
}
