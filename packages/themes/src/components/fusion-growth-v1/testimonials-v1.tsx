'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readPrimaryButtonBackground, readPrimaryButtonText, readSectionBackground, readSectionText } from '../shared/style-overrides';

type Testimonial = {
    quote: string;
    author: string;
    role?: string;
};

function normalizeTestimonials(content: Record<string, unknown>): Testimonial[] {
    const source = Array.isArray(content.testimonials) ? content.testimonials : [];
    const items: Testimonial[] = [];
    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const quote = (typeof record.quote === 'string' ? record.quote : typeof record.text === 'string' ? record.text : '').trim();
        const author = (typeof record.author === 'string' ? record.author : typeof record.name === 'string' ? record.name : '').trim();
        const role = typeof record.role === 'string' ? record.role.trim() : '';
        if (!quote || !author) return;
        items.push({ quote, author, role: role || undefined });
    });

    if (items.length > 0) return items;

    return [
        { quote: 'This reads like a premium product page instead of a generic marketing theme. The trust is immediate.', author: 'Liam Hart', role: 'Verified Customer' },
        { quote: 'The repeated CTAs and review density make the page feel proven without becoming cluttered.', author: 'Nina Cole', role: 'Verified Customer' },
        { quote: 'Exactly the kind of long-form storefront rhythm you want for a flagship book or founder offer.', author: 'Marcus Vale', role: 'Verified Customer' },
    ];
}

export default function TestimonialsV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'What readers are saying';
    const title = (content.title as string) || 'Dense proof blocks that feel editorial, not decorative.';
    const subtitle = (content.subtitle as string) || 'This section is designed as a review wall: strong headings, longer copy, and compact author metadata that reads cleanly on mobile.';
    const items = normalizeTestimonials(content as Record<string, unknown>);
    const ctaText = (content.ctaText as string) || 'Discover The Books';
    const ctaLink = ((content.ctaLink as string) || '#offers').trim() || '#offers';
    const sectionBackground = readSectionBackground(styles, '#f7f1e7');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#4f4338' : headingColor;
    const buttonBackground = readPrimaryButtonBackground(styles, '#1f160f');
    const buttonLabel = readPrimaryButtonText(styles, '#ffffff');

    return (
        <section className="fusion13-testimonials" id="reviews">
            <style>{`
                .fusion13-testimonials { background: ${sectionBackground}; padding: clamp(56px, 9vw, 96px) 16px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-testimonials__shell { max-width: 1180px; margin: 0 auto; }
                .fusion13-testimonials__heading { max-width: 760px; margin-bottom: 26px; }
                .fusion13-testimonials__eyebrow { margin: 0; color: #9a592b; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-testimonials__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2.1rem, 4.2vw, 3.8rem); line-height: 1.03; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-testimonials__subtitle { margin: 14px 0 0; color: ${bodyColor}; font-size: 17px; line-height: 1.75; }
                .fusion13-testimonials__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
                .fusion13-testimonials__card { border-radius: 26px; border: 1px solid #decfbc; background: #fffaf2; padding: 22px; box-shadow: 0 18px 38px rgba(52, 39, 28, 0.08); }
                .fusion13-testimonials__stars { color: #1f160f; font-size: 13px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
                .fusion13-testimonials__quote { margin: 16px 0 0; color: ${headingColor}; font-size: 17px; line-height: 1.8; }
                .fusion13-testimonials__author { margin: 16px 0 0; color: ${headingColor}; font-size: 15px; font-weight: 800; }
                .fusion13-testimonials__role { margin: 4px 0 0; color: ${bodyColor}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .fusion13-testimonials__cta { margin-top: 22px; min-height: 50px; padding: 0 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: ${buttonBackground}; color: ${buttonLabel}; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
                @media (max-width: 980px) { .fusion13-testimonials__grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="fusion13-testimonials__shell">
                <div className="fusion13-testimonials__heading">
                    <p className="fusion13-testimonials__eyebrow">{eyebrow}</p>
                    <h2 className="fusion13-testimonials__title">{title}</h2>
                    <p className="fusion13-testimonials__subtitle">{subtitle}</p>
                </div>

                <div className="fusion13-testimonials__grid">
                    {items.map((item, index) => (
                        <article key={`${item.author}-${index}`} className="fusion13-testimonials__card">
                            <div className="fusion13-testimonials__stars">Excellent 5</div>
                            <p className="fusion13-testimonials__quote">{item.quote}</p>
                            <p className="fusion13-testimonials__author">{item.author}</p>
                            {item.role ? <p className="fusion13-testimonials__role">{item.role}</p> : null}
                        </article>
                    ))}
                </div>

                <a className="fusion13-testimonials__cta" href={ctaLink}>{ctaText}</a>
            </div>
        </section>
    );
}
