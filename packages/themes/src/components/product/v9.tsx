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

export default function ProductV9({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Products';
    const subtitle = (content.subtitle as string) || 'Velocity VSL v9';
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

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section id="products" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gap: '10px' }}>{visible.map((product, i) => <article key={product.id || i} style={{ border, background: card, borderRadius: '12px', padding: '10px', display: 'grid', gridTemplateColumns: '32px 1fr', gap: '8px' }}><span style={{ width: '32px', height: '32px', borderRadius: '999px', background: tokens.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</span><div><h3 style={{ margin: 0, color: titleColor }}>{product.title}</h3><p style={{ margin: '6px 0 0 0', color: muted }}>{product.desc}</p></div></article>)}</div>
        </section>
    );
}
