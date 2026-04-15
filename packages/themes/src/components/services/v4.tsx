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
        { title: 'Bespoke Curation', desc: 'Tailored perfectly to your exacting standards and desires.' },
        { title: 'Global Access', desc: 'Unparalleled entry to the finest establishments worldwide.' },
        { title: 'Dedicated Concierge', desc: 'Around-the-clock attention from industry-leading professionals.' },
    ];
}

export default function ServicesV4({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Our Expertise';
    const subtitle = content.subtitle as string || 'Exceptional standards across every discipline';
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
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) clamp(16px, 4vw, 32px)', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(44px, 9vw, 100px)' }}>
                    <span style={{ fontSize: '12px', letterSpacing: '0.3em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '24px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.05em' }}>
                        {title}
                    </h2>
                </div>

                {visibleServices.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666' }}>No services are available right now.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', backgroundColor: `${tokens.primary}30` }}>
                        {visibleServices.map((service, i) => (
                            <div
                                key={service.id || `${service.title}-${i}`}
                                style={{ backgroundColor: '#fff', padding: 'clamp(24px, 6vw, 64px) clamp(18px, 5vw, 48px)', textAlign: 'center', transition: 'background-color 0.4s ease' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fafafa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fff';
                                }}
                            >
                                <div style={{ width: '1px', height: '40px', backgroundColor: tokens.primary, margin: '0 auto 32px auto' }} />
                                <h3 style={{ fontSize: '20px', fontWeight: 400, color: '#1a1a1a', marginBottom: '24px', letterSpacing: '0.1em' }}>{service.title}</h3>
                                <p style={{ fontSize: '15px', color: '#666', lineHeight: 2, fontWeight: 300 }}>{service.desc}</p>

                                {(service.priceText || service.durationText) && (
                                    <div style={{ marginTop: '18px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {service.priceText && (
                                            <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: tokens.primary, textTransform: 'uppercase', fontWeight: 600 }}>
                                                {service.priceText}
                                            </span>
                                        )}
                                        {service.durationText && (
                                            <span style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#666', textTransform: 'uppercase', fontWeight: 500 }}>
                                                {service.durationText}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {showSelectButton && service.id && (
                                    <a
                                        href="#booking-widget"
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '26px',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${tokens.primary}`,
                                            textDecoration: 'none',
                                            color: tokens.primary,
                                            fontSize: '12px',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
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
