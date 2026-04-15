'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import {
    formatServiceDuration,
    formatServicePrice,
    rememberSelectedService,
    usePublicServices,
} from '../shared/public-web';

interface DisplayService {
    id?: string;
    title: string;
    desc: string;
    priceText?: string;
    durationText?: string;
}

function normalizeFallbackServices(content: Record<string, unknown>): DisplayService[] {
    const fromContent = Array.isArray(content.servicesList)
        ? content.servicesList
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                const desc = typeof record.desc === 'string'
                    ? record.desc.trim()
                    : typeof record.description === 'string'
                        ? record.description.trim()
                        : '';
                if (!title) return null;
                return { title, desc: desc || 'Service details available on request.' } as DisplayService;
            })
            .filter((service): service is DisplayService => service !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        { title: 'Web Design', desc: 'Beautiful, responsive sites that convert visitors to customers.' },
        { title: 'SEO Optimization', desc: 'Climb the search rankings and outpace your competition.' },
        { title: 'Brand Strategy', desc: 'Define your voice and establish a powerful presence.' },
    ];
}

export default function ServicesV1({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Our Services';
    const subtitle = content.subtitle as string || 'What we can do for you';
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string || '#booking-widget';
    const showAllServices = (content.showAllServices as boolean) !== false;
    const featuredCountRaw = Number(content.featuredCount ?? 3);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0 ? Math.floor(featuredCountRaw) : 3;
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const selectButtonText = content.selectButtonText as string || 'Select Service';
    const showPrice = (styles.showPrice as boolean) !== false;
    const showDuration = (styles.showDuration as boolean) !== false;

    const fallbackServices = normalizeFallbackServices(content);
    const { services } = usePublicServices(context);
    const dynamicServices: DisplayService[] = services.map((service) => ({
        id: service.id,
        title: service.name,
        desc: service.description?.trim() || 'Service details available on request.',
        priceText: showPrice ? formatServicePrice(service.price, service.currency) : undefined,
        durationText: showDuration ? formatServiceDuration(service.duration) : undefined,
    }));

    const sourceServices = dynamicServices.length > 0 ? dynamicServices : fallbackServices;
    const visibleServices = showAllServices ? sourceServices : sourceServices.slice(0, featuredCount);

    return (
        <section style={{ backgroundColor: '#f9fafb', padding: 'clamp(64px, 10vw, 100px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(42px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, color: tokens.text, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(15px, 3.5vw, 18px)', color: '#6b7280' }}>{subtitle}</p>
                    {ctaText && (
                        <div style={{ marginTop: '24px' }}>
                            <a
                                href={ctaLink}
                                style={{
                                    display: 'inline-block',
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    backgroundColor: tokens.primary,
                                    color: '#ffffff',
                                }}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>

                {visibleServices.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>No services are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(16px, 4vw, 32px)' }}>
                        {visibleServices.map((service, i) => (
                            <div
                                key={service.id || `${service.title}-${i}`}
                                style={{
                                    backgroundColor: tokens.background,
                                    padding: 'clamp(20px, 4vw, 36px)',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                    border: '1px solid #e5e7eb',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', backgroundColor: `${tokens.primary}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                    <div style={{ width: '24px', height: '24px', backgroundColor: tokens.primary, borderRadius: '4px' }} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: tokens.text, marginBottom: '16px' }}>{service.title}</h3>
                                <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: 1.6 }}>{service.desc}</p>

                                {(service.priceText || service.durationText) && (
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {service.priceText && (
                                            <span style={{ fontSize: '14px', color: tokens.primary, fontWeight: 700 }}>{service.priceText}</span>
                                        )}
                                        {service.durationText && (
                                            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>{service.durationText}</span>
                                        )}
                                    </div>
                                )}

                                {showSelectButton && service.id && (
                                    <a
                                        href="#booking-widget"
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '22px',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            backgroundColor: `${tokens.primary}12`,
                                            color: tokens.primary,
                                        }}
                                        onClick={() => {
                                            rememberSelectedService(service.id!);
                                        }}
                                    >
                                        {selectButtonText}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
