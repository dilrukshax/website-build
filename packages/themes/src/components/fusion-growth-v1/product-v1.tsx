'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readPrimaryButtonBackground, readPrimaryButtonText, readSectionBackground, readSectionText } from '../shared/style-overrides';

type OfferCard = {
    badge?: string;
    title: string;
    subtitle: string;
    price: string;
    ctaText?: string;
    ctaLink?: string;
    imageUrl?: string;
};

function normalizeOffers(content: Record<string, unknown>): OfferCard[] {
    const source = Array.isArray(content.items) ? content.items : Array.isArray(content.products) ? content.products : [];
    const items: OfferCard[] = [];
    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const title = typeof record.title === 'string' ? record.title.trim() : '';
        const subtitle = typeof record.subtitle === 'string'
            ? record.subtitle.trim()
            : typeof record.desc === 'string'
                ? record.desc.trim()
                : '';
        const price = typeof record.price === 'string'
            ? record.price.trim()
            : typeof record.priceText === 'string'
                ? record.priceText.trim()
                : '';
        const badge = typeof record.badge === 'string' ? record.badge.trim() : '';
        const ctaText = typeof record.ctaText === 'string' ? record.ctaText.trim() : '';
        const ctaLink = typeof record.ctaLink === 'string' ? record.ctaLink.trim() : '';
        const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl.trim() : '';
        if (!title || !subtitle || !price) return;
        items.push({
            title,
            subtitle,
            price,
            badge: badge || undefined,
            ctaText: ctaText || undefined,
            ctaLink: ctaLink || undefined,
            imageUrl: imageUrl || undefined,
        });
    });

    if (items.length > 0) return items;

    return [
        {
            badge: 'New Release',
            title: 'Demand Blueprint',
            subtitle: 'Hardcover Edition',
            price: '$29.99',
            ctaText: 'Get The Book',
            ctaLink: '#top',
            imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
        },
        {
            badge: 'Best Value',
            title: 'Demand Blueprint',
            subtitle: '3 Book Bundle',
            price: '$89.97',
            ctaText: 'Get The Bundle',
            ctaLink: '#top',
            imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
        },
        {
            badge: 'Team Pack',
            title: 'Demand Blueprint',
            subtitle: '10 Book Bundle',
            price: '$299.90',
            ctaText: 'Buy For Teams',
            ctaLink: '#top',
            imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
        },
    ];
}

export default function ProductV13({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Choose your edition';
    const title = (content.title as string) || 'A storefront grid built for flagship products and bundle offers.';
    const subtitle = (content.subtitle as string) || 'Use three clean buying paths with strong badges, cover imagery, and repeated call-to-action buttons.';
    const offers = normalizeOffers(content as Record<string, unknown>);
    const sectionBackground = readSectionBackground(styles, '#f7f1e7');
    const headingColor = readSectionText(styles, '#1f160f');
    const bodyColor = headingColor === '#1f160f' ? '#4f4338' : headingColor;
    const buttonBackground = readPrimaryButtonBackground(styles, '#1f160f');
    const buttonLabel = readPrimaryButtonText(styles, '#ffffff');

    return (
        <section className="fusion13-product" id="offers">
            <style>{`
                .fusion13-product { background: ${sectionBackground}; padding: clamp(56px, 9vw, 96px) 16px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-product__shell { max-width: 1180px; margin: 0 auto; }
                .fusion13-product__heading { max-width: 760px; margin-bottom: 26px; }
                .fusion13-product__eyebrow { margin: 0; color: #9a592b; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-product__title { margin: 12px 0 0; color: ${headingColor}; font-size: clamp(2.1rem, 4.2vw, 3.9rem); line-height: 1.03; letter-spacing: -0.04em; font-weight: 800; }
                .fusion13-product__subtitle { margin: 14px 0 0; color: ${bodyColor}; font-size: 17px; line-height: 1.75; }
                .fusion13-product__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
                .fusion13-product__card { display: grid; gap: 0; border-radius: 28px; border: 1px solid #dcccb8; background: #fffdf9; overflow: hidden; box-shadow: 0 24px 56px rgba(52, 39, 28, 0.12); }
                .fusion13-product__image { width: 100%; aspect-ratio: 1.22; object-fit: cover; display: block; background: #e5d6c4; }
                .fusion13-product__body { padding: 20px; }
                .fusion13-product__badge { display: inline-flex; align-items: center; min-height: 30px; padding: 0 10px; border-radius: 999px; background: #fff3e4; border: 1px solid #e4cfb4; color: #935425; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .fusion13-product__card-title { margin: 14px 0 0; color: ${headingColor}; font-size: 28px; line-height: 1.04; letter-spacing: -0.03em; font-weight: 800; }
                .fusion13-product__card-subtitle { margin: 8px 0 0; color: ${bodyColor}; font-size: 15px; line-height: 1.65; }
                .fusion13-product__price { margin: 16px 0 0; color: ${headingColor}; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
                .fusion13-product__button { margin-top: 16px; min-height: 46px; padding: 0 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: ${buttonBackground}; color: ${buttonLabel}; text-decoration: none; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
                @media (max-width: 980px) { .fusion13-product__grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="fusion13-product__shell">
                <div className="fusion13-product__heading">
                    <p className="fusion13-product__eyebrow">{eyebrow}</p>
                    <h2 className="fusion13-product__title">{title}</h2>
                    <p className="fusion13-product__subtitle">{subtitle}</p>
                </div>

                <div className="fusion13-product__grid">
                    {offers.map((offer, index) => (
                        <article key={`${offer.title}-${index}`} className="fusion13-product__card">
                            <img className="fusion13-product__image" src={offer.imageUrl || 'https://placehold.co/520x360/e5d6c4/22160d?text=Offer'} alt={offer.title} />
                            <div className="fusion13-product__body">
                                {offer.badge ? <span className="fusion13-product__badge">{offer.badge}</span> : null}
                                <h3 className="fusion13-product__card-title">{offer.title}</h3>
                                <p className="fusion13-product__card-subtitle">{offer.subtitle}</p>
                                <p className="fusion13-product__price">{offer.price}</p>
                                <a className="fusion13-product__button" href={offer.ctaLink || '#top'}>{offer.ctaText || 'Buy Now'}</a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
