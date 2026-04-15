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

export default function ProductV10({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Products';
    const subtitle = (content.subtitle as string) || 'Aurora Atelier v10';
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
            <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}><article style={{ border, background: card, borderRadius: '14px', padding: '12px' }}><h2 style={{ margin: 0, color: titleColor }}>{title}</h2><p style={{ margin: '8px 0 0 0', color: muted }}>{subtitle}</p></article><div style={{ display: 'grid', gap: '8px' }}>{visible.map((product, i) => <article key={product.id || i} style={{ border, borderRadius: '10px', padding: '10px' }}><h3 style={{ margin: 0, color: titleColor }}>{product.title}</h3><p style={{ margin: '6px 0 0 0', color: muted }}>{product.desc}</p></article>)}</div></div>
        </section>
    );
}
