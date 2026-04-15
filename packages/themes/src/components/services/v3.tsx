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
        { title: 'Magic Design', desc: 'Interfaces so bouncy you will want to hug them.' },
        { title: 'Super Speed', desc: 'Websites that load faster than a speeding bullet.' },
        { title: 'Big Brain Code', desc: 'Smart algorithms doing all the heavy lifting.' },
        { title: 'Happy Support', desc: 'We are always here with a smile to help you out.' },
    ];
}

export default function ServicesV3({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'What we play with!';
    const subtitle = content.subtitle as string || 'Our superpowers at your service';
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
        <section style={{ backgroundColor: tokens.background, padding: 'clamp(68px, 11vw, 120px) 16px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 7vw, 80px)', position: 'relative', display: 'inline-block', left: '50%', transform: 'translateX(-50%)' }}>
                    <div style={{ position: 'absolute', top: '-20px', left: '-40px', width: '80px', height: '80px', backgroundColor: tokens.secondary, borderRadius: '50%', zIndex: -1 }} />
                    <h2 style={{ fontSize: 'clamp(30px, 9vw, 56px)', fontWeight: 900, WebkitTextStroke: `2px ${tokens.primary}`, color: 'transparent', letterSpacing: '2px', textShadow: `4px 4px 0 ${tokens.accent}` }}>
                        {title}
                    </h2>
                    <p style={{ fontSize: 'clamp(14px, 3.3vw, 20px)', fontWeight: 700, color: tokens.primary, marginTop: '16px', backgroundColor: tokens.secondary, padding: '8px 18px', borderRadius: '100px', display: 'inline-block', transform: 'rotate(-3deg)' }}>
                        {subtitle}
                    </p>
                </div>

                {visibleServices.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#4b5563', fontWeight: 700 }}>No services are available right now.</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 4vw, 32px)', justifyContent: 'center' }}>
                        {visibleServices.map((service, i) => (
                            <div
                                key={service.id || `${service.title}-${i}`}
                                style={{
                                    flex: '1 1 260px',
                                    backgroundColor: '#fff',
                                    padding: 'clamp(18px, 5vw, 32px)',
                                    borderRadius: '32px',
                                    border: `4px solid ${tokens.primary}`,
                                    boxShadow: `8px 8px 0 ${tokens.primary}`,
                                    transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                    transform: `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'rotate(0deg) translateY(-10px) scale(1.05)';
                                    e.currentTarget.style.boxShadow = `12px 12px 0 ${tokens.accent}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-2deg' : '2deg'}) translateY(0) scale(1)`;
                                    e.currentTarget.style.boxShadow = `8px 8px 0 ${tokens.primary}`;
                                }}
                            >
                                <h3 style={{ fontSize: '24px', fontWeight: 900, color: tokens.primary, marginBottom: '16px', lineHeight: 1.2 }}>{service.title}</h3>
                                <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: 1.6, fontWeight: 500 }}>{service.desc}</p>

                                {(service.priceText || service.durationText) && (
                                    <div style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {service.priceText && (
                                            <span style={{ fontSize: '14px', color: tokens.primary, fontWeight: 800 }}>{service.priceText}</span>
                                        )}
                                        {service.durationText && (
                                            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 700 }}>{service.durationText}</span>
                                        )}
                                    </div>
                                )}

                                {showSelectButton && service.id && (
                                    <a
                                        href="#booking-widget"
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '18px',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: `3px solid ${tokens.primary}`,
                                            textDecoration: 'none',
                                            color: tokens.primary,
                                            fontWeight: 900,
                                            fontSize: '14px',
                                            backgroundColor: tokens.secondary,
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
