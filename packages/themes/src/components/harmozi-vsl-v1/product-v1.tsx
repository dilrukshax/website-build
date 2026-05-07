'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString } from './shared';

type ProductCard = {
    badge?: string;
    imageUrl?: string;
    ratingText?: string;
    title: string;
    description: string;
    price?: string;
    ctaText: string;
    ctaLink: string;
    featured?: boolean;
};

function normalizeItems(content: Record<string, unknown>): ProductCard[] {
    const source = Array.isArray(content.items) ? content.items : [];
    const items: ProductCard[] = [];

    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const title = asString(record.title);
        const description = asString(record.description);
        const ctaText = asString(record.ctaText);
        const ctaLink = asString(record.ctaLink);
        if (!title || !description || !ctaText || !ctaLink) return;

        items.push({
            badge: asString(record.badge) || undefined,
            imageUrl: asString(record.imageUrl) || undefined,
            ratingText: asString(record.ratingText) || undefined,
            title,
            description,
            price: asString(record.price) || undefined,
            ctaText,
            ctaLink,
            featured: Boolean(record.featured),
        });
    });

    return items;
}

export default function ProductV14({ content }: ThemeComponentProps) {
    const variant = asString(content.variant, 'packs');
    const title = asString(
        content.title,
        variant === 'series'
            ? 'THE $100m series LEARN TO Create offers & generate leads'
            : 'LEArn how to GET STRANGERS to BUY YOUR STUFF',
    );
    const eyebrow = asString(content.eyebrow, variant === 'packs' ? '2023 NEW RELEASE: $100m leads' : '');
    const items = normalizeItems(content);

    return (
        <section className="other_books_section harmozi-vsl-source" id={variant === 'series' ? 'series' : 'offers'}>
            <div className="padding-global">
                <div className="container-large">
                    <div className="padding-section-medium">
                        <div className="layout242_component">
                            <div className="margin-bottom margin-xxlarge align-center text-align-center">
                                <div className={`${variant === 'series' ? 'max-width-full' : 'max-width-large align-center text-align-center'}`}>
                                    {eyebrow ? (
                                        <div className="badge background-color-purple">
                                            <img src={asset('cdn/shop/t/15/assets/icon-white-1hbf07.svg?v=96165811441556886041762187167')} loading="lazy" alt="" className="icon-1x1-xsmall" />
                                            <p className="text-size-medium text-style-allcaps">
                                                <strong className="text-color-white">{eyebrow}</strong>
                                            </p>
                                        </div>
                                    ) : null}
                                    <h3>{title}</h3>
                                </div>
                            </div>
                            <div className="w-layout-grid layout242_list">
                                {items.map((item, index) => (
                                    <div key={`${item.title}-${index}`} className={`layout242_item ${item.featured ? 'featured' : ''}`}>
                                        {item.badge ? (
                                            <div className="badge background-color-purple badge_card">
                                                <p className="text-size-medium text-style-allcaps text-weight-semibold text-color-white">{item.badge}</p>
                                            </div>
                                        ) : null}
                                        <div className={`margin-bottom margin-small ${variant === 'series' ? 'text-align-center' : ''}`}>
                                            {item.imageUrl ? (
                                                <img className={variant === 'series' ? 'image-width-book' : 'image-full-w'} src={item.imageUrl} alt="" loading="lazy" />
                                            ) : null}
                                        </div>
                                        <div className="margin-bottom margin-small">
                                            {item.ratingText ? (
                                                <div className="star-wrapper no-padding">
                                                    <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img smaller" />
                                                    <div className="text-weight-semibold text-style-allcaps text-size-small center-mobile">{item.ratingText}</div>
                                                </div>
                                            ) : null}
                                            <h3 className={variant === 'series' ? 'text-size-regular text-align-center margin-bottom margin-xsmall' : 'heading-style-h6 text-align-center'}>{item.title}</h3>
                                        </div>
                                        {item.price ? <h3 className="text-size-regular text-color-purple text-align-center">{item.price}</h3> : null}
                                        {!item.price ? <p className="text-size-regular text-align-center">{item.description}</p> : null}
                                        {item.price ? null : <div className="text-size-regular text-align-center">{item.description}</div>}
                                        <div className="margin-top margin-medium max-width-full">
                                            <a href={item.ctaLink} className={`button ${item.featured || variant === 'series' ? '' : 'is-tertiary'} max-width-full w-button`}>
                                                <span>{item.ctaText}</span>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
