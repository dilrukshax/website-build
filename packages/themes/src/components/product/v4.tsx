'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';

const DEFAULT_PRODUCTS = [
    { title: 'Concierge Edition', desc: 'An elevated product package curated for premium clients.' },
    { title: 'Collectors Set', desc: 'Limited set designed for intentional, high-value presentation.' },
    { title: 'Executive Collection', desc: 'Refined product line with tailored consultation support.' },
];

export default function ProductV4({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Signature Products';
    const subtitle = (content.subtitle as string) || 'A refined catalog tailored for premium experiences.';
    const showPrice = (styles?.showPrice as boolean) !== false;

    const fallbackProducts = normalizeFallbackProducts(content, DEFAULT_PRODUCTS);
    const { products } = usePublicProducts(context);
    const dynamicProducts = mapDynamicProducts(products, showPrice);
    const visibleProducts = resolveVisibleProducts({
        content,
        dynamicProducts,
        fallbackProducts,
        defaultFeaturedCount: 3,
    });
    const primary = tokens.primary || '#a16207';
    const sectionBg = tokens.background || '#fcfaf7';
    const borderTint = `${primary}45`;
    const shadowTint = `${primary}1f`;

    return (
        <section style={{ background: sectionBg, padding: 'clamp(72px, 11vw, 110px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 7vw, 48px)' }}>
                    <p style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '11px', color: primary, fontWeight: 700 }}>
                        Collection
                    </p>
                    <h2 style={{ margin: '0 0 10px', color: '#1f2937', fontSize: 'clamp(30px, 8vw, 40px)', fontWeight: 700 }}>{title}</h2>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: 'clamp(14px, 3.4vw, 17px)' }}>{subtitle}</p>
                </div>

                {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>No products are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gap: 'clamp(12px, 3.8vw, 22px)', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
                        {visibleProducts.map((product, index) => (
                            <article
                                key={product.id || `${product.title}-${index}`}
                                style={{
                                    borderRadius: '2px',
                                    border: `1px solid ${borderTint}`,
                                    background: '#ffffff',
                                    overflow: 'hidden',
                                    boxShadow: `0 12px 32px ${shadowTint}`,
                                }}
                            >
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        style={{ width: '100%', height: 'clamp(170px, 40vw, 220px)', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ height: 'clamp(170px, 40vw, 220px)', background: `linear-gradient(135deg, ${tokens.secondary || '#f5f5f4'} 0%, #ffffff 100%)` }} />
                                )}
                                <div style={{ padding: 'clamp(14px, 4vw, 22px)' }}>
                                    <h3 style={{ margin: '0 0 10px', fontSize: 'clamp(18px, 5vw, 22px)', color: '#111827', fontWeight: 600 }}>{product.title}</h3>
                                    <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.7, fontSize: 'clamp(14px, 3.2vw, 16px)' }}>{product.desc}</p>
                                    {product.priceText && (
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${borderTint}`, color: primary, fontWeight: 700 }}>
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
