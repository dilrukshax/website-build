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

export default function ProductV6({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Offer Stack';
    const subtitle = (content.subtitle as string) || 'Productized Revenue Assets';
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

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#566071';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const card = '#ffffff';
    const border = '#e9ddc9';

    return (
        <section id="products" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                </div>
                <div style={{ marginTop: '12px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {visible.map((product, i) => (
                        <article
                            key={product.id || i}
                            style={{
                                border: `1px solid ${border}`,
                                background: card,
                                borderRadius: '18px',
                                overflow: 'hidden',
                                boxShadow: '0 15px 30px rgba(25, 29, 36, 0.08)',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    height: '3px',
                                    background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
                                }}
                            />
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '180px', background: `linear-gradient(135deg, ${tokens.secondary || '#ffe9c9'} 0%, #ffffff 100%)` }} />
                            )}
                            <div style={{ padding: '14px' }}>
                                {product.badge ? (
                                    <p style={{ margin: 0, color: primary, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {product.badge}
                                    </p>
                                ) : null}
                                <h3 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: '22px' }}>{product.title}</h3>
                                <p style={{ margin: '8px 0 0 0', color: muted, lineHeight: 1.6 }}>{product.desc}</p>
                                {product.priceText ? <p style={{ margin: '10px 0 0 0', color: primary, fontWeight: 800 }}>{product.priceText}</p> : null}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
