'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import {
    readPrimaryButtonBackground,
    readPrimaryButtonText,
    readSecondaryButtonBackground,
    readSecondaryButtonText,
    readSectionBackground,
    readSectionText,
} from '../shared/style-overrides';

type HeroBadge = {
    label: string;
};

function normalizeBadges(content: Record<string, unknown>): HeroBadge[] {
    const source = Array.isArray(content.badges) ? content.badges : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            return label ? { label } : null;
        })
        .filter((item): item is HeroBadge => item !== null);

    if (items.length > 0) return items.slice(0, 2);

    return [
        { label: 'Rated 4.9/5 by readers' },
        { label: 'Sold in 80+ countries' },
    ];
}

export default function HeroV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'World-record business education';
    const title = (content.title as string) || 'Build a storefront page that feels like a best-selling product launch.';
    const subtitle = (content.subtitle as string) || 'A clean editorial layout for books, flagship offers, and stacked bundles, with the trust markers and repeated calls to action that make a product page feel proven.';
    const primaryCtaText = (content.primaryCtaText as string) || 'Get The Book';
    const primaryCtaLink = ((content.primaryCtaLink as string) || '#offers').trim() || '#offers';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See Reviews';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#reviews').trim() || '#reviews';
    const ratingText = (content.ratingText as string) || 'Rated 4.9 / 5 on major marketplaces';
    const proofText = (content.proofText as string) || 'Sold over 800,000+ copies worldwide';
    const productLabel = (content.productLabel as string) || 'Featured Release';
    const productTitle = (content.productTitle as string) || 'Evergreen Demand Playbook';
    const productSubtitle = (content.productSubtitle as string) || 'Hardcover Edition';
    const productImageUrl = (content.productImageUrl as string) || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80';
    const productAccentImageUrl = (content.productAccentImageUrl as string) || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80';
    const badges = normalizeBadges(content as Record<string, unknown>);
    const sectionBackground = readSectionBackground(styles, '#f7f1e7');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#4f4338' : headingColor;
    const primaryButtonBg = readPrimaryButtonBackground(styles, '#1f160f');
    const primaryButtonLabel = readPrimaryButtonText(styles, '#ffffff');
    const secondaryButtonBg = readSecondaryButtonBackground(styles, '#fffaf2');
    const secondaryButtonLabel = readSecondaryButtonText(styles, '#1f160f');

    return (
        <section className="fusion13-hero" id="hero">
            <style>{`
                .fusion13-hero { background: linear-gradient(180deg, ${sectionBackground} 0%, #f4ecdf 100%); padding: clamp(52px, 9vw, 96px) 16px 56px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-hero__grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, 420px); gap: clamp(24px, 4vw, 56px); align-items: center; }
                .fusion13-hero__copy { max-width: 680px; }
                .fusion13-hero__eyebrow { margin: 0; color: #9b5a2d; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-hero__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2.8rem, 6vw, 5.4rem); line-height: 0.98; letter-spacing: -0.05em; font-weight: 800; }
                .fusion13-hero__subtitle { margin: 18px 0 0; color: ${bodyColor}; font-size: 18px; line-height: 1.75; max-width: 56ch; }
                .fusion13-hero__rating { margin: 24px 0 0; color: ${headingColor}; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-hero__actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
                .fusion13-hero__button { min-height: 50px; padding: 0 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 14px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .fusion13-hero__button:hover { transform: translateY(-1px); }
                .fusion13-hero__button--primary { background: ${primaryButtonBg}; color: ${primaryButtonLabel}; box-shadow: 0 16px 30px rgba(31, 22, 15, 0.18); }
                .fusion13-hero__button--secondary { background: ${secondaryButtonBg}; border: 1px solid #dbc9b0; color: ${secondaryButtonLabel}; }
                .fusion13-hero__proof { margin-top: 26px; color: ${bodyColor}; font-size: 15px; font-weight: 700; }
                .fusion13-hero__badges { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
                .fusion13-hero__badge { display: inline-flex; align-items: center; min-height: 38px; padding: 0 14px; border-radius: 999px; background: #fff8ee; border: 1px solid #dfcfbc; color: #3f3328; font-size: 13px; font-weight: 700; }
                .fusion13-hero__visual { position: relative; min-height: 540px; }
                .fusion13-hero__accent-card, .fusion13-hero__book-card { border-radius: 28px; border: 1px solid #dcccb8; background: #fffdf9; box-shadow: 0 24px 60px rgba(52, 39, 28, 0.12); overflow: hidden; }
                .fusion13-hero__book-card { position: relative; z-index: 2; padding: 20px; }
                .fusion13-hero__book-cover { width: 100%; aspect-ratio: 0.76; object-fit: cover; border-radius: 22px; display: block; background: #ead9c0; }
                .fusion13-hero__book-meta { display: grid; gap: 6px; margin-top: 16px; }
                .fusion13-hero__product-label { margin: 0; color: #8f5328; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-hero__product-title { margin: 0; color: ${headingColor}; font-size: 28px; line-height: 1.06; letter-spacing: -0.03em; font-weight: 800; }
                .fusion13-hero__product-subtitle { margin: 0; color: ${bodyColor}; font-size: 15px; line-height: 1.6; }
                .fusion13-hero__accent-card { position: absolute; right: -14px; bottom: 26px; width: min(60%, 250px); padding: 10px; z-index: 3; background: #fff7eb; }
                .fusion13-hero__accent-image { width: 100%; aspect-ratio: 1.18; object-fit: cover; border-radius: 18px; display: block; background: #dfcfbc; }
                @media (max-width: 980px) { .fusion13-hero__grid { grid-template-columns: 1fr; } .fusion13-hero__visual { min-height: 0; max-width: 440px; } }
                @media (max-width: 640px) { .fusion13-hero { padding-top: 34px; } .fusion13-hero__subtitle { font-size: 16px; } .fusion13-hero__actions { flex-direction: column; } .fusion13-hero__button { width: 100%; } .fusion13-hero__visual { max-width: none; } .fusion13-hero__accent-card { position: static; width: 100%; margin-top: 14px; } }
            `}</style>

            <div className="fusion13-hero__grid">
                <div className="fusion13-hero__copy">
                    <p className="fusion13-hero__eyebrow">{eyebrow}</p>
                    <h1 className="fusion13-hero__title">{title}</h1>
                    <p className="fusion13-hero__subtitle">{subtitle}</p>
                    <p className="fusion13-hero__rating">{ratingText}</p>

                    <div className="fusion13-hero__actions">
                        <a className="fusion13-hero__button fusion13-hero__button--primary" href={primaryCtaLink}>{primaryCtaText}</a>
                        <a className="fusion13-hero__button fusion13-hero__button--secondary" href={secondaryCtaLink}>{secondaryCtaText}</a>
                    </div>

                    <p className="fusion13-hero__proof">{proofText}</p>
                    <div className="fusion13-hero__badges">
                        {badges.map((badge, index) => (
                            <span key={`${badge.label}-${index}`} className="fusion13-hero__badge">{badge.label}</span>
                        ))}
                    </div>
                </div>

                <div className="fusion13-hero__visual">
                    <div className="fusion13-hero__book-card">
                        <img className="fusion13-hero__book-cover" src={productImageUrl} alt={productTitle} />
                        <div className="fusion13-hero__book-meta">
                            <p className="fusion13-hero__product-label">{productLabel}</p>
                            <p className="fusion13-hero__product-title">{productTitle}</p>
                            <p className="fusion13-hero__product-subtitle">{productSubtitle}</p>
                        </div>
                    </div>

                    <div className="fusion13-hero__accent-card">
                        <img className="fusion13-hero__accent-image" src={productAccentImageUrl} alt={`${productTitle} companion`} />
                    </div>
                </div>
            </div>
        </section>
    );
}
