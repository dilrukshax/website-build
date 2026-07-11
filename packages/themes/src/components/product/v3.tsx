'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';

const DEFAULT_PRODUCTS = [
    { title: 'Color Boost Kit', desc: 'Bright accent palette and style presets for fresh campaigns.', badge: 'Design' },
    { title: 'Launch Planner', desc: 'Guided setup templates for coordinated releases.', badge: 'Ops' },
    { title: 'Creator Bundle', desc: 'Pre-configured assets for creators selling digital products.', badge: 'Growth' },
    { title: 'Team Pass', desc: 'Collaboration add-on for distributed teams.', badge: 'Team' },
];

export default function ProductV3({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Featured Products';
    const subtitle = (content.subtitle as string) || 'Products sync automatically from your CMS product catalog.';
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

    const primary = tokens.primary || '#ef4444';
    const secondary = tokens.secondary || '#fee2e2';
    const accent = tokens.accent || '#22d3ee';

    return (
        <section style={{ backgroundColor: tokens.background, padding: 'clamp(68px, 11vw, 120px) 16px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: 'clamp(36px, 7vw, 64px)',
                        position: 'relative',
                        display: 'inline-block',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '-36px',
                            width: '76px',
                            height: '76px',
                            backgroundColor: secondary,
                            borderRadius: '50%',
                            zIndex: -1,
                        }}
                    />
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(30px, 9vw, 56px)',
                            fontWeight: 900,
                            WebkitTextStroke: `2px ${primary}`,
                            color: 'transparent',
                            letterSpacing: '2px',
                            textShadow: `4px 4px 0 ${accent}`,
                        }}
                    >
                        {title}
                    </h2>
                    <p
                        style={{
                            marginTop: '16px',
                            marginBottom: 0,
                            fontSize: 'clamp(14px, 3.3vw, 20px)',
                            fontWeight: 700,
                            color: primary,
                            backgroundColor: secondary,
                            padding: '8px 18px',
                            borderRadius: '100px',
                            display: 'inline-block',
                            transform: 'rotate(-3deg)',
                        }}
                    >
                        {subtitle}
                    </p>
                </div>

                {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#4b5563', fontWeight: 700 }}>No products are available right now.</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 4vw, 32px)', justifyContent: 'center' }}>
                        {visibleProducts.map((product, index) => (
                            <article
                                key={product.id || `${product.title}-${index}`}
                                style={{
                                    position: 'relative',
                                    flex: '1 1 260px',
                                    maxWidth: '360px',
                                    borderRadius: '32px',
                                    background: '#ffffff',
                                    border: `4px solid ${primary}`,
                                    overflow: 'hidden',
                                    boxShadow: `8px 8px 0 ${primary}`,
                                    transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                    transform: `rotate(${index % 2 === 0 ? '-2deg' : '2deg'})`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'rotate(0deg) translateY(-10px) scale(1.04)';
                                    e.currentTarget.style.boxShadow = `12px 12px 0 ${accent}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? '-2deg' : '2deg'}) translateY(0) scale(1)`;
                                    e.currentTarget.style.boxShadow = `8px 8px 0 ${primary}`;
                                }}
                            >
                                {product.badge && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            zIndex: 2,
                                            borderRadius: '999px',
                                            background: primary,
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            padding: '4px 8px',
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {product.badge}
                                    </span>
                                )}
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ height: '180px', background: `linear-gradient(135deg, ${secondary} 0%, ${accent} 100%)` }} />
                                )}
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ margin: '0 0 10px', color: primary, fontSize: '24px', fontWeight: 900, lineHeight: 1.2 }}>{product.title}</h3>
                                    <p style={{ margin: 0, color: '#334155', fontSize: '16px', lineHeight: 1.6, fontWeight: 500 }}>{product.desc}</p>
                                    {product.priceText && (
                                        <p style={{ margin: '14px 0 0', color: primary, fontWeight: 900, fontSize: '18px' }}>{product.priceText}</p>
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
