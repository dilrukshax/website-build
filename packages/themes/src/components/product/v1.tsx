'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { usePublicProducts } from '../shared/public-web';
import { mapDynamicProducts, normalizeFallbackProducts, resolveVisibleProducts } from './shared';
import { getReadableTextColor } from '../shared/color-contrast';

const DEFAULT_PRODUCTS = [
    { title: 'Starter Care Kit', desc: 'A practical starter pack for everyday routines.' },
    { title: 'Premium Bundle', desc: 'High-performing essentials bundled for long-term value.' },
    { title: 'Signature Formula', desc: 'Customer-favorite product crafted for consistent results.' },
];

export default function ProductV1({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Featured Products';
    const subtitle = (content.subtitle as string) || 'Explore products currently available in our catalog.';
    const ctaText = (content.ctaText as string) || '';
    const ctaLink = (content.ctaLink as string) || '#contact';
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
    const textOnSectionSurface = getReadableTextColor('#f8fafc', tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnPrimary = getReadableTextColor(tokens.primary, '#ffffff', 4.5);
    const cardBorderColor = `${tokens.primary}40`;
    const cardShadowColor = `${tokens.primary}20`;
    const mutedTextColor = getReadableTextColor('#f8fafc', '#64748b', 4.5);

    return (
        <section style={{ background: '#f8fafc', padding: '96px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '54px' }}>
                    <h2 style={{ margin: '0 0 10px', color: textOnSectionSurface, fontSize: '36px', fontWeight: 800 }}>{title}</h2>
                    <p style={{ margin: 0, color: mutedTextColor, fontSize: '17px' }}>{subtitle}</p>
                    {ctaText && (
                        <div style={{ marginTop: '22px' }}>
                            <a
                                href={ctaLink}
                                style={{
                                    display: 'inline-block',
                                    textDecoration: 'none',
                                    padding: '11px 22px',
                                    borderRadius: '10px',
                                    background: tokens.primary,
                                    color: textOnPrimary,
                                    fontWeight: 700,
                                }}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>

                {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>No products are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                        {visibleProducts.map((product, index) => (
                            <article
                                key={product.id || `${product.title}-${index}`}
                                style={{
                                    borderRadius: '14px',
                                    border: `1px solid ${cardBorderColor}`,
                                    background: '#fff',
                                    overflow: 'hidden',
                                    boxShadow: `0 10px 24px ${cardShadowColor}`,
                                }}
                            >
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ height: '180px', background: '#e2e8f0' }} />
                                )}
                                <div style={{ padding: '20px', borderTop: `3px solid ${tokens.primary}` }}>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '19px', color: textOnWhiteSurface }}>{product.title}</h3>
                                    <p style={{ margin: 0, color: mutedTextColor, fontSize: '14px', lineHeight: 1.6 }}>{product.desc}</p>
                                    {product.priceText && (
                                        <p style={{ margin: '14px 0 0', color: tokens.primary, fontWeight: 800 }}>{product.priceText}</p>
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
