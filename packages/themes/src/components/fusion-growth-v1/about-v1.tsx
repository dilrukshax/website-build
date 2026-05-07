'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readSectionBackground, readSectionText } from '../shared/style-overrides';

type Stat = {
    value: string;
    label: string;
};

function normalizeStats(content: Record<string, unknown>): Stat[] {
    const source = Array.isArray(content.stats) ? content.stats : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const value = typeof record.value === 'string' ? record.value.trim() : '';
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            return value && label ? { value, label } : null;
        })
        .filter((item): item is Stat => item !== null);

    if (items.length > 0) return items;

    return [
        { value: '$46M+', label: 'Recent exit value' },
        { value: '5M+', label: 'Audience reached' },
        { value: '16', label: 'Industries tested' },
        { value: '20k+', label: 'Daily lead capacity' },
    ];
}

export default function AboutV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Why readers trust this methodology';
    const title = (content.title as string) || 'Built like an authority storefront, not a generic landing page.';
    const body = (content.body as string) || 'This section mirrors the editorial proof block used by top business education storefronts: a grounded founder image, concise origin story, and a stack of measurable wins that make the offer feel lived-in before the reader scrolls into the product grid.';
    const imageUrl = (content.imageUrl as string) || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80';
    const stats = normalizeStats(content as Record<string, unknown>);
    const sectionBackground = readSectionBackground(styles, '#f7f1e7');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#504438' : headingColor;

    return (
        <section className="fusion13-about" id="about">
            <style>{`
                .fusion13-about { background: ${sectionBackground}; padding: clamp(56px, 9vw, 96px) 16px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-about__grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(20px, 4vw, 44px); align-items: center; }
                .fusion13-about__media { border-radius: 28px; overflow: hidden; border: 1px solid #ddccb8; background: #fffdf9; box-shadow: 0 24px 56px rgba(52, 39, 28, 0.12); }
                .fusion13-about__image { width: 100%; display: block; aspect-ratio: 0.9; object-fit: cover; background: #e5d6c3; }
                .fusion13-about__eyebrow { margin: 0; color: #9a592b; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-about__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2rem, 4.2vw, 3.7rem); line-height: 1.04; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-about__body { margin: 16px 0 0; color: ${bodyColor}; font-size: 17px; line-height: 1.78; max-width: 56ch; }
                .fusion13-about__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 26px; }
                .fusion13-about__stat { border-radius: 20px; border: 1px solid #decfbc; background: #fffaf2; padding: 18px; }
                .fusion13-about__stat-value { margin: 0; color: ${headingColor}; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
                .fusion13-about__stat-label { margin: 6px 0 0; color: ${bodyColor}; font-size: 14px; line-height: 1.6; }
                @media (max-width: 940px) { .fusion13-about__grid { grid-template-columns: 1fr; } }
                @media (max-width: 640px) { .fusion13-about__body { font-size: 16px; } .fusion13-about__stats { grid-template-columns: 1fr; } }
            `}</style>

            <div className="fusion13-about__grid">
                <div className="fusion13-about__media">
                    <img className="fusion13-about__image" src={imageUrl} alt={title} />
                </div>

                <div>
                    <p className="fusion13-about__eyebrow">{eyebrow}</p>
                    <h2 className="fusion13-about__title">{title}</h2>
                    <p className="fusion13-about__body">{body}</p>

                    <div className="fusion13-about__stats">
                        {stats.map((stat, index) => (
                            <article key={`${stat.value}-${index}`} className="fusion13-about__stat">
                                <p className="fusion13-about__stat-value">{stat.value}</p>
                                <p className="fusion13-about__stat-label">{stat.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
