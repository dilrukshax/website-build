'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readSectionBackground, readSectionText } from '../shared/style-overrides';

type AudienceCard = {
    title: string;
    headline: string;
    description: string;
};

function normalizeAudience(content: Record<string, unknown>): AudienceCard[] {
    const source = Array.isArray(content.members) ? content.members : Array.isArray(content.cards) ? content.cards : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = typeof record.title === 'string' ? record.title.trim() : typeof record.role === 'string' ? record.role.trim() : '';
            const headline = typeof record.headline === 'string' ? record.headline.trim() : typeof record.name === 'string' ? record.name.trim() : '';
            const description = typeof record.description === 'string' ? record.description.trim() : typeof record.bio === 'string' ? record.bio.trim() : '';
            return title && headline && description ? { title, headline, description } : null;
        })
        .filter((item): item is AudienceCard => item !== null);

    if (items.length > 0) return items;

    return [
        { title: 'For operators', headline: 'Fast-track the buying story', description: 'Use the page to package a flagship offer into a clear, visual buying flow with repeated proof.' },
        { title: 'For founders', headline: 'Turn one product into a shelf', description: 'Present a hero offer, bundles, and companion products without losing the premium editorial tone.' },
        { title: 'For marketers', headline: 'Deploy a mobile-safe storefront', description: 'Keep the long-form sales rhythm intact on smaller screens with stacked cards and compact CTAs.' },
    ];
}

export default function TeamV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Who this template is for';
    const title = (content.title as string) || 'Three audience cards that mirror the buyer-segment block on the reference page.';
    const subtitle = (content.subtitle as string) || 'This section works well near the bottom of the page, after reviews and curriculum, to help different buyer types recognize themselves.';
    const items = normalizeAudience(content as Record<string, unknown>);
    const sectionBackground = readSectionBackground(styles, '#f4ecdf');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#4f4338' : headingColor;

    return (
        <section className="fusion13-team" id="audience">
            <style>{`
                .fusion13-team { background: ${sectionBackground}; padding: clamp(56px, 9vw, 96px) 16px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-team__shell { max-width: 1180px; margin: 0 auto; }
                .fusion13-team__heading { max-width: 760px; margin-bottom: 26px; }
                .fusion13-team__eyebrow { margin: 0; color: #9a592b; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-team__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2.1rem, 4.2vw, 3.7rem); line-height: 1.03; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-team__subtitle { margin: 14px 0 0; color: ${bodyColor}; font-size: 17px; line-height: 1.75; }
                .fusion13-team__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
                .fusion13-team__card { border-radius: 26px; border: 1px solid #decfbc; background: #fffaf2; padding: 22px; box-shadow: 0 18px 38px rgba(52, 39, 28, 0.08); }
                .fusion13-team__label { margin: 0; color: #9a592b; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-team__headline { margin: 12px 0 0; color: ${headingColor}; font-size: 30px; line-height: 1.04; letter-spacing: -0.03em; font-weight: 800; }
                .fusion13-team__description { margin: 12px 0 0; color: ${bodyColor}; font-size: 16px; line-height: 1.75; }
                @media (max-width: 980px) { .fusion13-team__grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="fusion13-team__shell">
                <div className="fusion13-team__heading">
                    <p className="fusion13-team__eyebrow">{eyebrow}</p>
                    <h2 className="fusion13-team__title">{title}</h2>
                    <p className="fusion13-team__subtitle">{subtitle}</p>
                </div>

                <div className="fusion13-team__grid">
                    {items.map((item, index) => (
                        <article key={`${item.title}-${index}`} className="fusion13-team__card">
                            <p className="fusion13-team__label">{item.title}</p>
                            <h3 className="fusion13-team__headline">{item.headline}</h3>
                            <p className="fusion13-team__description">{item.description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
