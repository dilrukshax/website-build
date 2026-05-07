'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asString } from './shared';

type Lesson = {
    number: string;
    title: string;
    description: string;
};

function normalizeItems(content: Record<string, unknown>): Lesson[] {
    const source = Array.isArray(content.items) ? content.items : [];
    return source
        .map((item, index) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = asString(record.title);
            const description = asString(record.description);
            if (!title || !description) return null;
            return {
                number: asString(record.number, `${index + 1}`),
                title,
                description,
            };
        })
        .filter((item): item is Lesson => item !== null);
}

export default function ServicesV14({ content }: ThemeComponentProps) {
    const title = asString(content.title, 'What $100m leads will teach you');
    const subtitle = asString(
        content.subtitle,
        'Alex Hormozi reveals his proven strategies for customer acquisition. His companies use these exact methods to generate 20,000+ new leads per day across sixteen different industries.',
    );
    const items = normalizeItems(content);

    return (
        <section className="section_what_teach harmozi-vsl-source">
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
                                {items.map((item) => (
                                    <div key={`${item.number}-${item.title}`} className="layout279_item">
                                        <div className="margin-bottom margin-small">
                                            <div className="icon-1x1-medium background-color-white icon-step">
                                                <h3 className="heading-style-h5">{item.number}</h3>
                                            </div>
                                        </div>
                                        <div className="margin-bottom margin-xsmall">
                                            <h3 className="heading-style-h5 text-color-white">{item.title}</h3>
                                        </div>
                                        <p className="text-color-white">{item.description}</p>
                                    </div>
                                ))}
                                <a href="https://shop.acquisition.com/products/single-hardback" className="button is-alternate max-width-full w-button">
                                    <span>DISCOVER THE BOOK</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
