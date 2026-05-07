'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString } from './shared';

type AudienceCard = {
    title: string;
    description: string;
    imageUrl?: string;
};

function normalizeCards(content: Record<string, unknown>): AudienceCard[] {
    const source = Array.isArray(content.cards) ? content.cards : [];
    const items: AudienceCard[] = [];

    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const title = asString(record.title);
        const description = asString(record.description);
        if (!title || !description) return;
        items.push({
            title,
            description,
            imageUrl: asString(record.imageUrl) || undefined,
        });
    });

    return items;
}

export default function TeamV14({ content }: ThemeComponentProps) {
    const title = asString(content.title, 'PERFECT FOR business owners, New entrepreneurs & marketeers');
    const subtitle = asString(
        content.subtitle,
        '$100m Leads is the perfect choice whether you already have a business, but are looking to increase the amount of leads you get. If you start from scratch, this book will be your exact roadmap to your first paying customers/clients!',
    );
    const cards = normalizeCards(content);

    return (
        <section className="section_perfect harmozi-vsl-source">
            <div className="padding-global">
                <div className="container-large">
                    <div className="padding-section-large">
                        <div className="layout279_component">
                            <div className="margin-bottom margin-xxlarge">
                                <div className="w-layout-grid layout279_content">
                                    <div className="layout279_content-left">
                                        <h3 className="text-color-white">{title}</h3>
                                    </div>
                                    <div className="layout279_content-right">
                                        <p className="text-color-white">{subtitle}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-layout-grid layout279_list">
                                {cards.map((card) => (
                                    <div key={card.title} className="layout279_item">
                                        <div className="margin-bottom margin-small">
                                            {card.imageUrl ? <img src={card.imageUrl} loading="lazy" alt="" className="icon-1x1-medium" /> : null}
                                        </div>
                                        <div className="margin-bottom margin-xsmall">
                                            <h5 className="heading-style-h6 text-color-white">{card.title}</h5>
                                        </div>
                                        <div className="text-color-white">
                                            <p>{card.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="layout279_background-image-wrapper">
                <div className="image-overlay-layer"></div>
                <img src={asset('cdn/shop/t/15/assets/placeholder-imagehc086.svg?v=87916137838594299251762187179')} loading="lazy" alt="" className="layout279_background-image" />
            </div>
            <style>{`
                .section_perfect .layout279_item > .text-color-white > p {
                    color: white;
                }
            `}</style>
        </section>
    );
}
