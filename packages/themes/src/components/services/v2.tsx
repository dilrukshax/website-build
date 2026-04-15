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
        { title: 'Data Analytics', desc: 'Uncover hidden patterns in your data streams.' },
        { title: 'Neural Networking', desc: 'Predictive modeling powered by cutting-edge AI.' },
        { title: 'Cyber Security', desc: 'Impenetrable defense architectures for your systems.' },
        { title: 'Cloud Infrastructure', desc: 'Scalable, resilient cloud deployments.' },
    ];
}

export default function ServicesV2({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Core Capabilities';
    const subtitle = content.subtitle as string || 'Empowering your digital transformation';
    const spotlightTitle = content.spotlightTitle as string;
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
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 12vw, 140px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '100%', background: `linear-gradient(to bottom, transparent, ${tokens.primary}40, transparent)`, zIndex: 0 }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 9vw, 100px)' }}>
                    {spotlightTitle && (
                        <div style={{ fontSize: '12px', color: tokens.accent, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>
                            {spotlightTitle}
                        </div>
                    )}
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 900, color: '#fff', textShadow: `0 0 20px ${tokens.primary}`, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(13px, 3.2vw, 18px)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>
                </div>

                {visibleServices.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                        {(content.emptyTitle as string) || 'No services are active right now.'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(16px, 3.5vw, 28px)' }}>
                        {visibleServices.map((service, i) => (
                            <div
                                key={service.id || `${service.title}-${i}`}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    backdropFilter: 'blur(10px)',
                                    border: `1px solid ${tokens.primary}30`,
                                    borderRadius: '24px',
                                    padding: 'clamp(20px, 4.8vw, 36px)',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.borderColor = tokens.accent;
                                    e.currentTarget.style.boxShadow = `0 0 30px ${tokens.accent}40`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = `${tokens.primary}30`;
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: tokens.primary, marginBottom: '20px' }}>{service.title}</h3>
                                <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: 1.7 }}>{service.desc}</p>

                                {(service.priceText || service.durationText) && (
                                    <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {service.priceText && (
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: tokens.accent }}>
                                                {service.priceText}
                                            </span>
                                        )}
                                        {service.durationText && (
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.95)' }}>
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
                                            marginTop: '20px',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            color: '#fff',
                                            background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})`,
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
