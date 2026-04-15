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
    description: string;
    priceText?: string;
    durationText?: string;
    stat?: string;
    eyebrow?: string;
}

function normalizeServiceCards(content: Record<string, unknown>): DisplayService[] {
    const fromContent = Array.isArray(content.items)
        ? content.items
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                const description = typeof record.description === 'string' 
                    ? record.description.trim() 
                    : typeof record.desc === 'string' 
                        ? record.desc.trim() 
                        : '';
                const stat = typeof record.stat === 'string' ? record.stat.trim() : '';
                const eyebrow = typeof record.eyebrow === 'string' ? record.eyebrow.trim() : '';

                if (!title || !description) {
                    return null;
                }

                return {
                    title,
                    description,
                    stat: stat || undefined,
                    eyebrow: eyebrow || undefined,
                } as DisplayService;
            })
            .filter((item): item is DisplayService => item !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        {
            title: 'Lead Capture, Segmentation & Nurturing Workflows',
            description: 'Custom forms natively segment and score leads based on input, connecting directly to CRM.',
            eyebrow: 'System',
        },
        {
            title: 'Sales pages with RTL Integration',
            description: 'Fast-loading page templates with built-in analytics, tracking and conversion metrics.',
            eyebrow: 'Design',
        },
        {
            title: 'Low/ticket to Mid-Ticket Offer Setup',
            description: 'Full flow defined for seamless upsells and cross-sells straight to profitability.',
            eyebrow: 'Pricing',
        },
        {
            title: 'High-Ticket Booking & Application Funnel',
            description: 'Qualify and book directly on calendar. Only serious buyers enter your pipeline.',
            eyebrow: 'Acquisition',
        },
        {
            title: 'Email automation sequences (Onboarding/Cart)',
            description: 'Campaigns automatically trigger abandoned cart recovery or client onboarding series.',
            eyebrow: 'Retention',
        },
        {
            title: 'Fully branded Member/Community Portal',
            description: 'Everything built and hosted inside beautifully designed spaces for customers.',
            eyebrow: 'Delivery',
        },
    ];
}

export default function ServicesV5({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Get a Complete Funnel Ecosystem, Without Lifting a Finger';
    const subtitle = (content.subtitle as string) || 'We build out every element needed to scale your digital products, so you can just launch.';
    
    // Booking integration parameters
    const showAllServices = (content.showAllServices as boolean) !== false;
    const featuredCountRaw = Number(content.featuredCount ?? 6);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0 ? Math.floor(featuredCountRaw) : 6;
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const selectButtonText = (content.selectButtonText as string) || '+ Select Module';
    const bottomCtaText = (content.bottomCtaText as string) || (content.ctaText as string) || 'Book Your Setup Call';
    const bottomCtaLink = (content.bottomCtaLink as string) || (content.ctaLink as string) || '#booking-widget';
    
    const showPrice = (styles?.showPrice as boolean) !== false;
    const showDuration = (styles?.showDuration as boolean) !== false;
    const sectionFont = tokens.font || '"Inter", sans-serif';

    const fallbackServices = normalizeServiceCards(content);
    const { services } = usePublicServices(context);
    
    const dynamicServices: DisplayService[] = services.map((service) => ({
        id: service.id,
        title: service.name,
        description: service.description?.trim() || 'Service details available on request.',
        priceText: showPrice ? formatServicePrice(service.price, service.currency) : undefined,
        durationText: showDuration ? formatServiceDuration(service.duration) : undefined,
        eyebrow: 'Service', 
    }));

    const hasCustomCardContent = Array.isArray(content.items) && fallbackServices.length > 0;
    const sourceServices = hasCustomCardContent
        ? fallbackServices
        : dynamicServices.length > 0
            ? dynamicServices
            : fallbackServices;
    const visibleServices = showAllServices ? sourceServices : sourceServices.slice(0, featuredCount);

    return (
        <>
            <style>{`
                .theme-v5-services {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};
                    --v5-glow: ${tokens.primary ? tokens.primary + '26' : 'rgba(234, 179, 8, 0.15)'};

                    background: var(--v5-bg);
                    color: var(--v5-text);
                    padding: 120px 20px;
                }
                .theme-v5-services-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .theme-v5-services-head {
                    text-align: center;
                    max-width: 760px;
                    margin: 0 auto 56px;
                }
                .theme-v5-services-head h2 {
                    margin: 0 0 16px;
                    font-size: clamp(32px, 4vw, 48px);
                    line-height: 1.15;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: var(--v5-primary);
                }
                .theme-v5-services-head p {
                    margin: 0;
                    opacity: 0.8;
                    font-size: 18px;
                    line-height: 1.6;
                }
                .theme-v5-services-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 24px;
                }
                .theme-v5-service-card {
                    position: relative;
                    min-height: 250px;
                    padding: 32px 24px;
                    border-radius: 12px;
                    background: var(--v5-secondary);
                    border: 1px solid var(--v5-primary);
                    box-shadow: 0 8px 32px var(--v5-glow);
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .theme-v5-service-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px var(--v5-glow);
                }
                .theme-v5-service-icon {
                    width: 36px;
                    height: 36px;
                    margin-bottom: 24px;
                    color: var(--v5-primary);
                }
                .theme-v5-service-title {
                    margin: 0 0 14px;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 1.3;
                }
                .theme-v5-service-description {
                    margin: 0;
                    opacity: 0.8;
                    font-size: 15px;
                    line-height: 1.6;
                    flex-grow: 1;
                }
                .theme-v5-service-stat {
                    display: inline-flex;
                    align-items: center;
                    margin-top: 22px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 600;
                    align-self: flex-start;
                }
                .theme-v5-service-props {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                .theme-v5-service-price {
                    color: #fff;
                    font-weight: 700;
                    font-size: 15px;
                }
                .theme-v5-service-duration {
                    opacity: 0.7;
                    font-weight: 600;
                    font-size: 14px;
                }
                .theme-v5-service-select {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 0;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--v5-primary);
                    margin-top: 24px;
                    align-self: flex-start;
                    transition: opacity 0.2s ease;
                }
                .theme-v5-service-select:hover {
                    opacity: 0.8;
                    text-decoration: underline;
                }
                .theme-v5-services-bottom {
                    display: flex;
                    justify-content: center;
                    margin-top: 64px;
                }
                .theme-v5-services-primary-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 64px;
                    padding: 16px 40px;
                    border-radius: 999px;
                    font-size: 18px;
                    font-weight: 800;
                    text-decoration: none;
                    text-transform: uppercase;
                    background: var(--v5-accent);
                    color: #ffffff;
                    box-shadow: 0 12px 28px rgba(220, 38, 38, 0.35);
                    transition: transform 0.2s ease, filter 0.2s ease;
                }
                .theme-v5-services-primary-cta:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }

                @media (max-width: 960px) {
                    .theme-v5-services-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 640px) {
                    .theme-v5-services {
                        padding: 80px 16px;
                    }
                    .theme-v5-services-grid {
                        grid-template-columns: 1fr;
                    }
                    .theme-v5-services-primary-cta {
                        width: 100%;
                    }
                }
            `}</style>

            <section className="theme-v5-services" id="features" style={{ fontFamily: sectionFont }}>
                <div className="theme-v5-services-inner">
                    <div className="theme-v5-services-head">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    {visibleServices.length === 0 ? (
                        <div style={{ opacity: 0.7, textAlign: 'center' }}>No services are available right now.</div>
                    ) : (
                        <div className="theme-v5-services-grid">
                            {visibleServices.map((item, i) => (
                                <article key={item.id || `${item.title}-${i}`} className="theme-v5-service-card">
                                    <svg className="theme-v5-service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <h3 className="theme-v5-service-title">{item.title}</h3>
                                    <p className="theme-v5-service-description">{item.description}</p>
                                    
                                    {(item.priceText || item.durationText) && (
                                        <div className="theme-v5-service-props">
                                            {item.priceText && <span className="theme-v5-service-price">{item.priceText}</span>}
                                            {item.durationText && <span className="theme-v5-service-duration">{item.durationText}</span>}
                                        </div>
                                    )}

                                    {item.stat && <span className="theme-v5-service-stat">{item.stat}</span>}

                                    {showSelectButton && item.id && (
                                        <a
                                            href="#booking-widget"
                                            className="theme-v5-service-select"
                                            onClick={() => {
                                                rememberSelectedService(item.id!);
                                            }}
                                        >
                                            {selectButtonText}
                                        </a>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="theme-v5-services-bottom">
                        <a href={bottomCtaLink} className="theme-v5-services-primary-cta">
                            {bottomCtaText}
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
