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

export default function FAQV11({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'FAQ';
    const subtitle = (content.subtitle as string) || 'Fusion Growth v11';
    const faqs = normalizeFaqs(content as Record<string, unknown>);
    const [openIndex, setOpenIndex] = useState(0);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="questions" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
        <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
        <div style={{ marginTop: '12px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {faqs.map((item, index) => (
                <article key={index} style={{ border, background: card, borderRadius: '12px', padding: '10px' }}>
                    <p style={{ margin: 0, color: tokens.primary, fontSize: '12px', fontWeight: 800 }}>Q{index + 1}</p>
                    <p style={{ margin: '6px 0 0 0', color: titleColor, fontWeight: 700 }}>{item.question}</p>
                    <p style={{ margin: '6px 0 0 0', color: muted }}>{item.answer}</p>
                </article>
            ))}
        </div>
    </div>

        </section>
    );
}
