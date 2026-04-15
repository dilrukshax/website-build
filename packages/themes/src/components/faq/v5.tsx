'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface FaqItem {
    q: string;
    a: string;
}

function normalizeFaqs(content: Record<string, unknown>): FaqItem[] {
    const fromFaqs = Array.isArray(content.faqs)
        ? content.faqs
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const q = typeof record.q === 'string' ? record.q.trim() : '';
                const a = typeof record.a === 'string' ? record.a.trim() : '';

                if (!q || !a) {
                    return null;
                }

                return { q, a } as FaqItem;
            })
            .filter((item): item is FaqItem => item !== null)
        : [];

    if (fromFaqs.length > 0) {
        return fromFaqs;
    }

    return [
        {
            q: 'Can the hero content be updated after publishing?',
            a: 'Yes. Headlines, supporting copy, video links, calls to action, and proof items are all stored as editable section content.',
        },
        {
            q: 'Does this layout work well on mobile devices?',
            a: 'Yes. The layout collapses into a single-column flow and keeps navigation, video, and content blocks easy to scan on smaller screens.',
        },
        {
            q: 'Can the feature cards and testimonials be customized?',
            a: 'Yes. Those entries are builder-managed content arrays, so each card and quote can be replaced without changing the component code.',
        },
        {
            q: 'Is this theme intended to be plan-restricted?',
            a: 'No. This theme is configured as a free option so it can be used like the rest of the unrestricted catalog entries.',
        },
    ];
}

export default function FAQv5({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Questions, answered clearly';
    const subtitle = (content.subtitle as string) || 'A compact accordion section for the details visitors usually want before they commit.';
    const faqs = normalizeFaqs(content);
    const [openIndex, setOpenIndex] = useState<number>(0);
    const sectionFont = tokens.font || '"Inter", sans-serif';

    return (
        <>
            <style>{`
                .theme-v5-faq {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};

                    padding: 96px 20px;
                    background: var(--v5-bg);
                    color: var(--v5-text);
                }
                .theme-v5-faq-inner {
                    max-width: 980px;
                    margin: 0 auto;
                }
                .theme-v5-faq-head {
                    text-align: center;
                    max-width: 760px;
                    margin: 0 auto 32px;
                }
                .theme-v5-faq-head h2 {
                    margin: 0 0 14px;
                    font-size: clamp(32px, 4vw, 48px);
                    line-height: 1.15;
                    letter-spacing: -0.02em;
                    font-weight: 800;
                }
                .theme-v5-faq-head p {
                    margin: 0;
                    color: #a0aec0;
                    font-size: 18px;
                    line-height: 1.6;
                }
                .theme-v5-faq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .theme-v5-faq-item {
                    border-radius: 22px;
                    background: var(--v5-secondary);
                    border: 1px solid var(--v5-primary);
                    overflow: hidden;
                }
                .theme-v5-faq-trigger {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 22px 24px;
                    color: var(--v5-text);
                    background: transparent;
                    border: none;
                    text-align: left;
                    cursor: pointer;
                    font: inherit;
                }
                .theme-v5-faq-question {
                    font-size: 17px;
                    font-weight: 600;
                    line-height: 1.45;
                }
                .theme-v5-faq-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--v5-primary);
                    color: var(--v5-bg);
                    flex-shrink: 0;
                    font-size: 20px;
                }
                .theme-v5-faq-panel {
                    padding: 0 24px 22px;
                    color: #a0aec0;
                    font-size: 16px;
                    line-height: 1.8;
                }
                @media (max-width: 640px) {
                    .theme-v5-faq {
                        padding: 72px 16px;
                    }
                    .theme-v5-faq-trigger {
                        padding: 18px 18px;
                    }
                    .theme-v5-faq-panel {
                        padding: 0 18px 18px;
                    }
                }
            `}</style>

            <section className="theme-v5-faq" id="questions" style={{ fontFamily: sectionFont }}>
                <div className="theme-v5-faq-inner">
                    <div className="theme-v5-faq-head">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    <div className="theme-v5-faq-list">
                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <article key={`${faq.q}-${index}`} className="theme-v5-faq-item">
                                    <button
                                        type="button"
                                        className="theme-v5-faq-trigger"
                                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                        aria-expanded={isOpen}
                                    >
                                        <span className="theme-v5-faq-question">{faq.q}</span>
                                        <span className="theme-v5-faq-icon">{isOpen ? '-' : '+'}</span>
                                    </button>

                                    {isOpen && <div className="theme-v5-faq-panel">{faq.a}</div>}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
