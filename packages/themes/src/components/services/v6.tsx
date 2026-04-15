'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, rememberSelectedService, usePublicServices } from '../shared/public-web';

type DisplayService = {
    id?: string;
    title: string;
    description: string;
    priceText?: string;
    durationText?: string;
    badge?: string;
};

function normalizeFallback(content: Record<string, unknown>): DisplayService[] {
    const fromContent = Array.isArray(content.items)
        ? content.items
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                const description = typeof record.description === 'string' ? record.description.trim() : '';
                const badge = typeof record.badge === 'string' ? record.badge.trim() : '';
                return title && description ? ({ title, description, badge: badge || undefined } as DisplayService) : null;
            })
            .filter((item): item is DisplayService => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [
        { title: 'Offer Positioning Sprint', description: 'Translate your offer into sharp buyer-facing messaging and page hierarchy.', badge: 'Strategy' },
        { title: 'Lead Capture Architecture', description: 'Deploy forms, segmentation, and tracking to capture high-intent visitors.', badge: 'Acquisition' },
        { title: 'Automation & Follow-up', description: 'Connect booking events to email/SMS sequences that keep pipeline velocity high.', badge: 'Ops' },
    ];
}

export default function ServicesV6({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Revenue Modules Built for Execution';
    const subtitle = (content.subtitle as string) || 'Acquisition Workflow';
    const showAllServices = (content.showAllServices as boolean) !== false;
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const featuredCountRaw = Number(content.featuredCount ?? 6);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0 ? Math.floor(featuredCountRaw) : 6;
    const selectButtonText = (content.selectButtonText as string) || 'Use This Module';

    const fallbackServices = normalizeFallback(content as Record<string, unknown>);
    const { services } = usePublicServices(context);

    const dynamicServices: DisplayService[] = services.map((service) => ({
        id: service.id,
        title: service.name,
        description: service.description?.trim() || 'Service details available on request.',
        priceText: formatServicePrice(service.price, service.currency),
        durationText: formatServiceDuration(service.duration),
        badge: 'Service',
    }));

    const source = dynamicServices.length > 0 ? dynamicServices : fallbackServices;
    const visible = showAllServices ? source : source.slice(0, featuredCount);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#586273';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';

    return (
        <section id="services" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                </div>

                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    {visible.map((item, i) => (
                        <article
                            key={item.id || i}
                            style={{
                                border: '1px solid #e8dcc7',
                                background: '#fff',
                                borderRadius: '18px',
                                padding: '18px',
                                boxShadow: '0 16px 34px rgba(25, 29, 36, 0.08)',
                                display: 'grid',
                                gap: '8px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                    height: '3px',
                                    background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
                                }}
                            />
                            {item.badge ? (
                                <p style={{ margin: 0, color: primary, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {item.badge}
                                </p>
                            ) : null}
                            <h3 style={{ margin: 0, color: titleColor, fontSize: '22px', lineHeight: 1.2 }}>{item.title}</h3>
                            <p style={{ margin: 0, color: muted, lineHeight: 1.6 }}>{item.description}</p>
                            {item.priceText || item.durationText ? (
                                <p style={{ margin: '2px 0 0 0', color: titleColor, fontWeight: 700 }}>
                                    {item.priceText || ''}
                                    {item.priceText && item.durationText ? ' · ' : ''}
                                    {item.durationText || ''}
                                </p>
                            ) : null}
                            {showSelectButton && item.id ? (
                                <a
                                    href="#booking-widget"
                                    onClick={() => rememberSelectedService(item.id || '')}
                                    style={{
                                        marginTop: '4px',
                                        width: 'fit-content',
                                        display: 'inline-flex',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        fontWeight: 760,
                                        background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                                        borderRadius: '11px',
                                        padding: '8px 13px',
                                        boxShadow: '0 10px 18px rgba(255, 106, 61, 0.28)',
                                    }}
                                >
                                    {selectButtonText}
                                </a>
                            ) : null}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
