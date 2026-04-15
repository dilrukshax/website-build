'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';

const DEFAULT_PRODUCTS = [
    { title: 'Core Engine License', desc: 'Advanced module for teams shipping high-frequency updates.' },
    { title: 'Analytics Pack', desc: 'Deep reporting and behavior insights for growth experiments.' },
    { title: 'Automation Toolkit', desc: 'Trigger-based workflows to remove repetitive operations.' },
    { title: 'Support Upgrade', desc: 'Priority handling and implementation assistance for launches.' },
];

export default function ProductV2({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Product Stack';
    const subtitle = (content.subtitle as string) || 'Each product module is designed to integrate cleanly with your workflow.';
    const showPrice = (styles?.showPrice as boolean) !== false;

    const fallbackProducts = normalizeFallbackProducts(content, DEFAULT_PRODUCTS);
    const { products } = usePublicProducts(context);
    const dynamicProducts = mapDynamicProducts(products, showPrice);
    const visibleProducts = resolveVisibleProducts({
        content,
        dynamicProducts,
        fallbackProducts,
        defaultFeaturedCount: 4,
    });

    return (
        <section style={{ background: '#050a16', padding: 'clamp(68px, 10vw, 96px) 16px', fontFamily: tokens.font, color: '#dbeafe' }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ marginBottom: 'clamp(22px, 6vw, 40px)' }}>
                    <p style={{ margin: '0 0 10px', color: '#60a5fa', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '12px' }}>
                        Product Catalog
                    </p>
                    <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, color: '#f8fafc' }}>{title}</h2>
                    <p style={{ margin: 0, maxWidth: '760px', color: '#94a3b8', fontSize: 'clamp(14px, 3.4vw, 16px)' }}>{subtitle}</p>
                </div>

                {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>No products are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gap: 'clamp(12px, 3.2vw, 16px)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        {visibleProducts.map((product, index) => (
                            <article
                                key={product.id || `${product.title}-${index}`}
                                style={{
                                    borderRadius: '14px',
                                    border: '1px solid rgba(96, 165, 250, 0.25)',
                                    background: 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.95))',
                                    overflow: 'hidden',
                                }}
                            >
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        style={{ width: '100%', height: 'clamp(140px, 36vw, 170px)', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ height: 'clamp(140px, 36vw, 170px)', background: 'radial-gradient(circle at top right, rgba(96,165,250,0.25), rgba(15,23,42,0.9))' }} />
                                )}
                                <div style={{ padding: 'clamp(14px, 3.6vw, 18px)' }}>
                                    <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: 'clamp(16px, 4.5vw, 18px)' }}>{product.title}</h3>
                                    <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, fontSize: '14px' }}>{product.desc}</p>
                                    {product.priceText && (
                                        <div style={{ marginTop: '14px', display: 'inline-block', borderRadius: '999px', background: 'rgba(96,165,250,0.18)', color: '#bfdbfe', padding: '6px 10px', fontWeight: 700, fontSize: '13px' }}>
                                            {product.priceText}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
