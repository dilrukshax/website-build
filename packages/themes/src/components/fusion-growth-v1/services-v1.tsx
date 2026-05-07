'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readPrimaryButtonBackground, readPrimaryButtonText, readSectionBackground, readSectionText } from '../shared/style-overrides';

type Lesson = {
    title: string;
    description: string;
};

function normalizeLessons(content: Record<string, unknown>): Lesson[] {
    const source = Array.isArray(content.items) ? content.items : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = typeof record.title === 'string' ? record.title.trim() : '';
            const description = typeof record.description === 'string' ? record.description.trim() : '';
            return title && description ? { title, description } : null;
        })
        .filter((item): item is Lesson => item !== null);

    if (items.length > 0) return items;

    return [
        { title: 'Start here', description: 'Introduce the promise and frame what the reader gets from the first chapter.' },
        { title: 'Learn how demand works', description: 'Break a complicated system into plain language and memorable frameworks.' },
        { title: 'See the buying paths', description: 'Show the practical levers a reader can apply without redesigning their whole offer.' },
        { title: 'Build the repeatable system', description: 'Move from isolated tactics into a process the team can operate every week.' },
        { title: 'Implementation plan', description: 'Close with a clean action plan that gives the storefront a practical finish.' },
    ];
}

export default function ServicesV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Inside the book';
    const title = (content.title as string) || 'A numbered teaching block that reads like a premium table of contents.';
    const subtitle = (content.subtitle as string) || 'This section mirrors the educational breakdown on the reference storefront: short numbered modules, concise explanations, and a clear CTA after the curriculum.';
    const items = normalizeLessons(content as Record<string, unknown>);
    const ctaText = (content.ctaText as string) || 'Discover The Book';
    const ctaLink = ((content.ctaLink as string) || '#offers').trim() || '#offers';
    const sectionBackground = readSectionBackground(styles, '#f4ecdf');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#4f4338' : headingColor;
    const buttonBackground = readPrimaryButtonBackground(styles, '#1f160f');
    const buttonLabel = readPrimaryButtonText(styles, '#ffffff');

    return (
        <section className="fusion13-services" id="learn">
            <style>{`
                .fusion13-services { background: ${sectionBackground}; padding: clamp(56px, 9vw, 96px) 16px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-services__shell { max-width: 1180px; margin: 0 auto; }
                .fusion13-services__heading { max-width: 760px; margin-bottom: 26px; }
                .fusion13-services__eyebrow { margin: 0; color: #9a592b; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-services__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2.1rem, 4.2vw, 3.7rem); line-height: 1.03; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-services__subtitle { margin: 14px 0 0; color: ${bodyColor}; font-size: 17px; line-height: 1.75; }
                .fusion13-services__list { display: grid; gap: 14px; }
                .fusion13-services__item { display: grid; grid-template-columns: 72px 1fr; gap: 18px; align-items: start; padding: 22px; border-radius: 24px; border: 1px solid #decfbc; background: #fffaf2; box-shadow: 0 18px 38px rgba(52, 39, 28, 0.08); }
                .fusion13-services__index { width: 72px; height: 72px; border-radius: 20px; display: grid; place-items: center; background: #1f160f; color: #ffffff; font-size: 28px; font-weight: 800; }
                .fusion13-services__item-title { margin: 0; color: ${headingColor}; font-size: 28px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 800; }
                .fusion13-services__item-copy { margin: 10px 0 0; color: ${bodyColor}; font-size: 16px; line-height: 1.75; max-width: 60ch; }
                .fusion13-services__cta { margin-top: 22px; min-height: 50px; padding: 0 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: ${buttonBackground}; color: ${buttonLabel}; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
                @media (max-width: 640px) { .fusion13-services__item { grid-template-columns: 1fr; } .fusion13-services__index { width: 60px; height: 60px; font-size: 24px; } }
            `}</style>

            <div className="fusion13-services__shell">
                <div className="fusion13-services__heading">
                    <p className="fusion13-services__eyebrow">{eyebrow}</p>
                    <h2 className="fusion13-services__title">{title}</h2>
                    <p className="fusion13-services__subtitle">{subtitle}</p>
                </div>

                <div className="fusion13-services__list">
                    {items.map((item, index) => (
                        <article key={`${item.title}-${index}`} className="fusion13-services__item">
                            <div className="fusion13-services__index">{index + 1}</div>
                            <div>
                                <h3 className="fusion13-services__item-title">{item.title}</h3>
                                <p className="fusion13-services__item-copy">{item.description}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <a className="fusion13-services__cta" href={ctaLink}>{ctaText}</a>
            </div>
        </section>
    );
}
