'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';

const DEFAULT_PRODUCTS = [
    {
        title: 'Launch Master Kit',
        desc: 'A complete launch toolkit with templates, automations, and setup walkthroughs.',
        badge: 'Launch',
    },
    {
        title: 'Scale Operator Pack',
        desc: 'Execution package for teams optimizing performance and operational reliability.',
        badge: 'Scale',
    },
    {
        title: 'Creator Revenue Stack',
        desc: 'Product stack built for creators packaging offers and retention journeys.',
        badge: 'Revenue',
    },
];

export default function ProductV5({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Revenue-Ready Product Catalog';
    const subtitle = (content.subtitle as string) || 'Showcase your sellable products with strong visual contrast and clear pricing.';
    const showPrice = (styles?.showPrice as boolean) !== false;

    const fallbackProducts = normalizeFallbackProducts(content, DEFAULT_PRODUCTS);
    const { products } = usePublicProducts(context);
    const dynamicProducts = mapDynamicProducts(products, showPrice);
    const visibleProducts = resolveVisibleProducts({
        content,
        dynamicProducts,
        fallbackProducts,
        defaultFeaturedCount: 6,
    });

    return (
        <>
            <style>{`
                .theme-v5-products {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};
                    --v5-glow: ${tokens.primary ? `${tokens.primary}26` : 'rgba(234,179,8,0.15)'};

                    background: var(--v5-bg);
                    color: var(--v5-text);
                    padding: 110px 20px;
                }
                .theme-v5-products-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .theme-v5-products-head {
                    text-align: center;
                    max-width: 760px;
                    margin: 0 auto 48px;
                }
                .theme-v5-products-head h2 {
                    margin: 0 0 14px;
                    font-size: clamp(32px, 4vw, 46px);
                    line-height: 1.15;
                    font-weight: 800;
                    color: var(--v5-primary);
                }
                .theme-v5-products-head p {
                    margin: 0;
                    opacity: 0.82;
                    font-size: 18px;
                    line-height: 1.6;
                }
                .theme-v5-products-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 22px;
                }
                .theme-v5-product-card {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--v5-primary);
                    background: var(--v5-secondary);
                    box-shadow: 0 12px 32px var(--v5-glow);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .theme-v5-product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px var(--v5-glow);
                }
                .theme-v5-product-media {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    display: block;
                }
                .theme-v5-product-content {
                    padding: 20px;
                }
                .theme-v5-product-badge {
                    display: inline-block;
                    margin-bottom: 10px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid var(--v5-primary);
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 5px 10px;
                }
                .theme-v5-product-content h3 {
                    margin: 0 0 10px;
                    font-size: 20px;
                }
                .theme-v5-product-content p {
                    margin: 0;
                    opacity: 0.85;
                    line-height: 1.65;
                }
                .theme-v5-product-price {
                    margin-top: 16px;
                    color: var(--v5-accent);
                    font-size: 16px;
                    font-weight: 800;
                }
                @media (max-width: 960px) {
                    .theme-v5-products-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 640px) {
                    .theme-v5-products {
                        padding: 84px 16px;
                    }
                    .theme-v5-products-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <section className="theme-v5-products" style={{ fontFamily: tokens.font }}>
                <div className="theme-v5-products-inner">
                    <div className="theme-v5-products-head">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    {visibleProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.7 }}>No products are available right now.</div>
                    ) : (
                        <div className="theme-v5-products-grid">
                            {visibleProducts.map((product, index) => (
                                <article key={product.id || `${product.title}-${index}`} className="theme-v5-product-card">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.title} className="theme-v5-product-media" />
                                    ) : (
                                        <div
                                            className="theme-v5-product-media"
                                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.16), var(--v5-secondary))' }}
                                        />
                                    )}
                                    <div className="theme-v5-product-content">
                                        {product.badge && <span className="theme-v5-product-badge">{product.badge}</span>}
                                        <h3>{product.title}</h3>
                                        <p>{product.desc}</p>
                                        {product.priceText && <div className="theme-v5-product-price">{product.priceText}</div>}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
