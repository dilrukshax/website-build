'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

type FaqItem = { question: string; answer: string };

function normalizeFaqs(content: Record<string, unknown>): FaqItem[] {
    const source = Array.isArray(content.faqs) ? content.faqs : Array.isArray(content.items) ? content.items : [];
    const faqs = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const question = (typeof record.question === 'string' ? record.question : typeof record.q === 'string' ? record.q : '').trim();
            const answer = (typeof record.answer === 'string' ? record.answer : typeof record.a === 'string' ? record.a : '').trim();
            return question && answer ? { question, answer } : null;
        })
        .filter((item): item is FaqItem => item !== null);

    if (faqs.length > 0) return faqs;

    return [
        { question: 'Can I replace the copy later?', answer: 'Yes. All content remains editable from the builder, so the structure stays intact while the message changes.' },
        { question: 'Will this layout hold up on mobile devices?', answer: 'Yes. The hero cards stack, the logo rail becomes scrollable, and the buttons collapse into a single-column flow on smaller screens.' },
        { question: 'Can this be used for multiple offers?', answer: 'Yes. The same section sequence works well for acquisition pages, launch pages, or conversion-focused service landing pages.' },
        { question: 'Do I need a custom video block for this layout?', answer: 'No. This lane focuses on stat-driven storytelling instead of a hero video, which keeps the top of the page lighter and faster.' },
    ];
}

export default function FAQV13({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Frequently asked questions';
    const subtitle = (content.subtitle as string) || 'Handle the final uncertainty with a clean accordion that feels consistent with the rest of the dark premium layout.';
    const faqs = normalizeFaqs(content as Record<string, unknown>);
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="fg13-faq" id="faq">
            <style>{`
                .fg13-faq { background: linear-gradient(180deg, #0b1121 0%, #0d1429 100%); padding: 84px 16px; font-family: ${tokens.font}; }
                .fg13-faq__shell { max-width: 980px; margin: 0 auto; }
                .fg13-faq__heading { text-align: center; max-width: 760px; margin: 0 auto 28px; }
                .fg13-faq__eyebrow { margin: 0 0 14px; color: #a0aec0; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
                .fg13-faq__title { margin: 0; color: #ffffff; font-size: clamp(2rem, 4vw, 3.1rem); line-height: 1.08; letter-spacing: -0.03em; }
                .fg13-faq__subtitle { margin: 18px 0 0; color: #a0aec0; font-size: 18px; line-height: 1.7; }
                .fg13-faq__list { display: grid; gap: 14px; }
                .fg13-faq__item { border-radius: 18px; border: 1px solid rgba(99, 102, 241, 0.2); background: rgba(21, 31, 56, 0.82); overflow: hidden; }
                .fg13-faq__button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 24px; background: transparent; border: 0; color: #ffffff; text-align: left; font: inherit; cursor: pointer; }
                .fg13-faq__question { margin: 0; font-size: 18px; line-height: 1.45; font-weight: 600; }
                .fg13-faq__icon { flex-shrink: 0; color: #a0aec0; font-size: 26px; line-height: 1; }
                .fg13-faq__answer { padding: 0 24px 22px; color: #a0aec0; font-size: 16px; line-height: 1.75; }
                @media (max-width: 640px) { .fg13-faq { padding: 70px 16px; } .fg13-faq__subtitle { font-size: 16px; } .fg13-faq__button { padding: 18px 18px; } .fg13-faq__answer { padding: 0 18px 18px; } .fg13-faq__question { font-size: 17px; } }
            `}</style>

            <div className="fg13-faq__shell">
                <div className="fg13-faq__heading">
                    <p className="fg13-faq__eyebrow">FAQ</p>
                    <h2 className="fg13-faq__title">{title}</h2>
                    <p className="fg13-faq__subtitle">{subtitle}</p>
                </div>

                <div className="fg13-faq__list">
                    {faqs.map((item, index) => {
                        const isOpen = index === openIndex;
                        return (
                            <article key={`${item.question}-${index}`} className="fg13-faq__item">
                                <button type="button" className="fg13-faq__button" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                                    <span className="fg13-faq__question">{item.question}</span>
                                    <span className="fg13-faq__icon">{isOpen ? '-' : '+'}</span>
                                </button>
                                {isOpen ? <div className="fg13-faq__answer">{item.answer}</div> : null}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
