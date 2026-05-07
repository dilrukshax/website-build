'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type Highlight = {
    label: string;
};

function normalizeHighlights(content: Record<string, unknown>): Highlight[] {
    const source = Array.isArray(content.highlights) ? content.highlights : Array.isArray(content.logos) ? content.logos : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = typeof record.label === 'string'
                ? record.label.trim()
                : typeof record.name === 'string'
                    ? record.name.trim()
                    : '';
            return label ? { label } : null;
        })
        .filter((item): item is Highlight => item !== null);

    if (items.length > 0) return items;

    return [
        { label: 'Sold over 800,000+ copies worldwide' },
        { label: 'No. 1 best-selling series' },
        { label: 'Rated 4.9 / 5 by readers' },
    ];
}

export default function LogosV13({ content, tokens }: ThemeComponentProps) {
    const items = normalizeHighlights(content as Record<string, unknown>);

    return (
        <section className="fusion13-highlights" aria-label="Store highlights">
            <style>{`
                .fusion13-highlights { background: #f4ecdf; padding: 0 16px 52px; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-highlights__rail { max-width: 1180px; margin: 0 auto; border: 1px solid #dfcfbc; border-radius: 22px; background: #fffaf2; box-shadow: 0 18px 36px rgba(52, 39, 28, 0.08); padding: 16px 20px; }
                .fusion13-highlights__track { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
                .fusion13-highlights__item { min-height: 64px; display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 16px; background: #fff; border: 1px solid #eadcc9; color: #3e3327; font-size: 14px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 10px 14px; }
                @media (max-width: 840px) { .fusion13-highlights__track { display: flex; overflow-x: auto; scrollbar-width: none; } .fusion13-highlights__track::-webkit-scrollbar { display: none; } .fusion13-highlights__item { min-width: 280px; } }
            `}</style>

            <div className="fusion13-highlights__rail">
                <div className="fusion13-highlights__track">
                    {items.map((item, index) => (
                        <div key={`${item.label}-${index}`} className="fusion13-highlights__item">{item.label}</div>
                    ))}
                </div>
            </div>
        </section>
    );
}
