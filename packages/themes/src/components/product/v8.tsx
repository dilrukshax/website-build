'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';

const DEFAULT_PRODUCTS = [
    { title: 'Conversion Stack', desc: 'A complete offer + page setup.', badge: 'Offer 01' },
    { title: 'Retention Booster', desc: 'Lifecycle and onboarding sequence pack.', badge: 'Offer 02' },
    { title: 'Growth Sprint', desc: 'Implementation support with optimization loop.', badge: 'Offer 03' },
];

export default function ProductV8({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Products';
    const subtitle = (content.subtitle as string) || 'Salesforce Pipeline v8';
    const showPrice = (styles?.showPrice as boolean) !== false;

    const fallbackProducts = normalizeFallbackProducts(content as Record<string, unknown>, DEFAULT_PRODUCTS);
    const { products } = usePublicProducts(context);
    const dynamicProducts = mapDynamicProducts(products, showPrice);
    const visible = resolveVisibleProducts({
        content: content as Record<string, unknown>,
        dynamicProducts,
        fallbackProducts,
        defaultFeaturedCount: 3,
    });

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="products" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1040px', margin: '0 auto' }}><h2 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{title}</h2><div style={{ marginTop: '10px', display: 'flex', gap: '10px', overflowX: 'auto' }}>{visible.map((product, i) => <article key={product.id || i} style={{ flex: '0 0 280px', border, background: card, borderRadius: '14px', padding: '12px' }}><h3 style={{ margin: 0, color: titleColor }}>{product.title}</h3><p style={{ margin: '8px 0 0 0', color: muted }}>{product.desc}</p></article>)}</div></div>
        </section>
    );
}
