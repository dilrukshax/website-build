'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readPrimaryButtonBackground, readPrimaryButtonText, readSectionBackground, readSectionText } from '../shared/style-overrides';

type FooterCard = {
    title: string;
    subtitle: string;
    ctaText?: string;
    ctaLink?: string;
    imageUrl?: string;
};

function normalizeCards(content: Record<string, unknown>): FooterCard[] {
    const source = Array.isArray(content.cards) ? content.cards : [];
    const items: FooterCard[] = [];
    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        const subtitle = typeof record.subtitle === 'string' ? record.subtitle.trim() : '';
        const ctaText = typeof record.ctaText === 'string' ? record.ctaText.trim() : '';
        const ctaLink = typeof record.ctaLink === 'string' ? record.ctaLink.trim() : '';
        const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl.trim() : '';
        if (!title || !subtitle) return;
        items.push({
            title,
            subtitle,
            ctaText: ctaText || undefined,
            ctaLink: ctaLink || undefined,
            imageUrl: imageUrl || undefined,
        });
    });

    if (items.length > 0) return items;

    return [
        {
            title: 'Offer Architecture',
            subtitle: 'Structure a product so the buying decision feels obvious.',
            ctaText: 'Buy The Book',
            ctaLink: '#offers',
            imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=80',
        },
        {
            title: 'Demand Systems',
            subtitle: 'Turn cold traffic into qualified buyers with clear proof and repeated CTAs.',
            ctaText: 'Discover The Series',
            ctaLink: '#hero',
            imageUrl: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
        },
    ];
}

export default function FooterV13({ content, styles, tokens }: ThemeComponentProps) {
    const brandName = (content.brandName as string) || (content.businessName as string) || 'Acquisition Press';
    const heading = (content.heading as string) || 'A footer that closes like a premium catalog page.';
    const body = (content.body as string) || 'Use an editorial brand summary plus a pair of series cards to end the storefront with one more credibility signal and one more buying path.';
    const ctaText = (content.ctaText as string) || 'Read The Series';
    const ctaLink = ((content.ctaLink as string) || '#offers').trim() || '#offers';
    const copyrightText = (content.copyrightText as string) || `Copyright ${new Date().getFullYear()} ${brandName}`;
    const cards = normalizeCards(content as Record<string, unknown>);
    const sectionBackground = readSectionBackground(styles, '#1f160f');
    const headingColor = readSectionText(styles, '#fff8f0');
    const bodyColor = headingColor === '#fff8f0' ? '#dbcbb8' : headingColor;
    const buttonBackground = readPrimaryButtonBackground(styles, '#fff7eb');
    const buttonLabel = readPrimaryButtonText(styles, '#1f160f');

    return (
        <footer className="fusion13-footer" id="footer">
            <style>{`
                .fusion13-footer { background: ${sectionBackground}; color: ${headingColor}; padding: clamp(56px, 9vw, 96px) 16px 30px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-footer__shell { max-width: 1180px; margin: 0 auto; }
                .fusion13-footer__top { display: grid; grid-template-columns: minmax(0, 1.1fr) auto; gap: 24px; align-items: end; padding-bottom: 24px; border-bottom: 1px solid rgba(255, 245, 232, 0.14); }
                .fusion13-footer__brand { margin: 0; font-size: 42px; line-height: 0.96; letter-spacing: -0.05em; font-weight: 800; }
                .fusion13-footer__heading { margin: 18px 0 0; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.02; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-footer__body { margin: 14px 0 0; color: ${bodyColor}; font-size: 16px; line-height: 1.8; max-width: 60ch; }
                .fusion13-footer__cta { min-height: 50px; padding: 0 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: ${buttonBackground}; color: ${buttonLabel}; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
                .fusion13-footer__cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
                .fusion13-footer__card { border-radius: 28px; overflow: hidden; border: 1px solid rgba(255, 245, 232, 0.14); background: rgba(255, 255, 255, 0.06); }
                .fusion13-footer__image { width: 100%; aspect-ratio: 1.48; object-fit: cover; display: block; background: #6d5844; }
                .fusion13-footer__card-body { padding: 18px; }
                .fusion13-footer__card-title { margin: 0; color: ${headingColor}; font-size: 28px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 800; }
                .fusion13-footer__card-copy { margin: 10px 0 0; color: ${bodyColor}; font-size: 15px; line-height: 1.7; }
                .fusion13-footer__card-link { display: inline-flex; align-items: center; margin-top: 14px; color: ${headingColor}; text-decoration: none; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
                .fusion13-footer__bottom { margin-top: 18px; color: ${bodyColor}; font-size: 13px; }
                @media (max-width: 900px) { .fusion13-footer__top, .fusion13-footer__cards { grid-template-columns: 1fr; } }
                @media (max-width: 640px) { .fusion13-footer__brand { font-size: 32px; } .fusion13-footer__cta { width: 100%; } }
            `}</style>

            <div className="fusion13-footer__shell">
                <div className="fusion13-footer__top">
                    <div>
                        <p className="fusion13-footer__brand">{brandName}</p>
                        <h2 className="fusion13-footer__heading">{heading}</h2>
                        <p className="fusion13-footer__body">{body}</p>
                    </div>
                    <a className="fusion13-footer__cta" href={ctaLink}>{ctaText}</a>
                </div>

                <div className="fusion13-footer__cards">
                    {cards.map((card, index) => (
                        <article key={`${card.title}-${index}`} className="fusion13-footer__card">
                            <img className="fusion13-footer__image" src={card.imageUrl || 'https://placehold.co/640x420/6d5844/fff8f0?text=Series'} alt={card.title} />
                            <div className="fusion13-footer__card-body">
                                <h3 className="fusion13-footer__card-title">{card.title}</h3>
                                <p className="fusion13-footer__card-copy">{card.subtitle}</p>
                                <a className="fusion13-footer__card-link" href={card.ctaLink || '#offers'}>{card.ctaText || 'Discover More'}</a>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="fusion13-footer__bottom">{copyrightText}</div>
            </div>
        </footer>
    );
}
