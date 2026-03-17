'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface ServiceItem {
    id: string;
    name: string;
    description?: string;
    price?: string;
    duration?: string;
}

interface PublicService {
    id: string;
    name: string;
    description?: string | null;
    price?: number | string;
    currency?: string | null;
    duration?: number | null;
}

interface PublicServicesResponse {
    success?: boolean;
    data?: unknown;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function buildWebApiUrl(path: string): string {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/')) {
        return `${API_BASE_URL}${path}`;
    }

    return path;
}

function buildLegacyPreviewHeaders(
    tenantId?: string,
    instanceId?: string,
    options?: { isEditor?: boolean },
): HeadersInit | undefined {
    if (!tenantId || !instanceId) {
        return undefined;
    }

    const inPreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
    if (!inPreview && !options?.isEditor) {
        return undefined;
    }

    return {
        'x-tenant-id': tenantId,
        'x-instance-id': instanceId,
    };
}

function isPreviewRuntime(): boolean {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
}

const SERVICES_V2_STYLES = `
.be-services-v2 {
    position: relative;
    overflow: hidden;
}

.be-services-v2__card {
    animation: be-services-v2-rise 420ms ease both;
    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background-color 220ms ease;
}

.be-services-v2__card:hover {
    transform: translateY(-4px);
}

.be-services-v2__spotlight {
    animation: be-services-v2-fade 320ms ease;
}

.be-services-v2__pulse {
    animation: be-services-v2-pulse 1.8s ease-in-out infinite;
}

@keyframes be-services-v2-rise {
    0% {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes be-services-v2-fade {
    0% {
        opacity: 0;
        transform: translateY(8px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes be-services-v2-pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.16);
        opacity: 0.72;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@media (max-width: 1024px) {
    .be-services-v2__grid {
        grid-template-columns: 1fr !important;
    }
}
`;

function formatPrice(price: number | string | undefined, currency: string | null | undefined): string | undefined {
    const numericPrice = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(numericPrice)) {
        return undefined;
    }

    const currencyCode = (currency || 'USD').toUpperCase();
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericPrice);
    } catch {
        return `${numericPrice.toFixed(2)} ${currencyCode}`;
    }
}

function mapPublicServiceToItem(service: PublicService): ServiceItem {
    return {
        id: service.id,
        name: service.name,
        description: service.description || undefined,
        price: formatPrice(service.price, service.currency),
        duration: typeof service.duration === 'number' ? `${service.duration} min` : undefined,
    };
}

function withAlpha(hexOrColor: string, alpha: number): string {
    const normalized = hexOrColor.trim().replace('#', '');
    const full = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(full)) {
        return hexOrColor;
    }

    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ServicesV2({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = (content.title as string) || 'Featured Services';
    const subtitle = (content.subtitle as string) || 'Explore top services with instant pricing and duration.';
    const ctaText = content.ctaText as string | undefined;
    const ctaLink = content.ctaLink as string | undefined;
    const showAllServices = (content.showAllServices as boolean) === true;
    const featuredCountRaw = content.featuredCount as number | string | undefined;
    const featuredCount = Math.max(1, Number(featuredCountRaw) || 4);
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const selectButtonText = (content.selectButtonText as string) || 'Select Service';
    const spotlightTitle = (content.spotlightTitle as string) || 'Spotlight';
    const emptyTitle = (content.emptyTitle as string) || 'No services available yet';
    const emptyDescription = (content.emptyDescription as string) || 'Add active services from the CMS to render this section.';

    const showPrice = styles.showPrice !== false;
    const showDuration = styles.showDuration !== false;
    const autoRotate = styles.autoRotate !== false;
    const paddingPreset = (styles.padding as string) || 'large';
    const tenantId = context?.tenantId;
    const instanceId = context?.instanceId;

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [pauseRotation, setPauseRotation] = useState(false);

    useEffect(() => {
        if (isPreviewRuntime() && (!tenantId || !instanceId)) {
            setIsLoading(false);
            setServices([]);
            setActiveServiceId(null);
            return;
        }

        let isCancelled = false;

        const fetchServices = async () => {
            try {
                setIsLoading(true);
                const cacheBuster = Date.now().toString(36);
                const response = await fetch(`${buildWebApiUrl('/web/services')}?_cb=${cacheBuster}`, {
                    cache: 'no-store',
                    headers: buildLegacyPreviewHeaders(tenantId, instanceId, { isEditor }),
                });
                const payload = await response.json() as PublicServicesResponse;
                const data = Array.isArray(payload.data) ? payload.data as PublicService[] : [];
                if (!isCancelled) {
                    setServices(data.map(mapPublicServiceToItem));
                }
            } catch (error) {
                console.error('Failed to load services for ServicesV2', error);
                if (!isCancelled) {
                    setServices([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        void fetchServices();

        return () => {
            isCancelled = true;
        };
    }, [instanceId, tenantId]);

    const visibleServices = useMemo(() => {
        if (showAllServices) {
            return services;
        }
        return services.slice(0, featuredCount);
    }, [featuredCount, services, showAllServices]);

    useEffect(() => {
        if (visibleServices.length === 0) {
            setActiveServiceId(null);
            return;
        }

        if (!activeServiceId || !visibleServices.some((service) => service.id === activeServiceId)) {
            setActiveServiceId(visibleServices[0]!.id);
        }
    }, [activeServiceId, visibleServices]);

    useEffect(() => {
        if (isEditor || !autoRotate || pauseRotation || visibleServices.length < 2) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setActiveServiceId((prev) => {
                if (!prev) {
                    return visibleServices[0]!.id;
                }
                const currentIndex = visibleServices.findIndex((service) => service.id === prev);
                const nextIndex = currentIndex === -1
                    ? 0
                    : (currentIndex + 1) % visibleServices.length;
                return visibleServices[nextIndex]!.id;
            });
        }, 3200);

        return () => window.clearInterval(interval);
    }, [autoRotate, isEditor, pauseRotation, visibleServices]);

    const activeService = useMemo(() => {
        if (visibleServices.length === 0) {
            return null;
        }

        return visibleServices.find((service) => service.id === activeServiceId) || visibleServices[0]!;
    }, [activeServiceId, visibleServices]);

    const emptyMessage = `${emptyTitle}. ${emptyDescription}`;

    const handleSelectService = (serviceId: string) => {
        if (typeof window === 'undefined') return;

        window.dispatchEvent(new CustomEvent('be:select-service', {
            detail: { serviceId },
        }));

        const bookingWidget = document.getElementById('booking-widget-section');
        if (bookingWidget) {
            bookingWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const sectionPadding = {
        small: '64px 24px',
        medium: '88px 24px',
        large: '112px 24px',
    }[paddingPreset] || '112px 24px';

    const fontStack = `${tokens.font}, "Manrope", "Sora", "Avenir Next", sans-serif`;

    return (
        <section
            className="be-services-v2"
            style={{
                padding: sectionPadding,
                fontFamily: fontStack,
                backgroundColor: withAlpha(tokens.background, 1),
                color: tokens.text,
            }}
        >
            <style>{SERVICES_V2_STYLES}</style>

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `radial-gradient(62% 74% at 8% 10%, ${withAlpha(tokens.primary, 0.13)} 0%, transparent 70%), radial-gradient(48% 60% at 92% 5%, ${withAlpha(tokens.secondary, 0.12)} 0%, transparent 70%), linear-gradient(180deg, ${withAlpha(tokens.accent, 0.05)} 0%, transparent 55%)`,
                }}
            />

            <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: 38, maxWidth: 760 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 14px',
                            borderRadius: 9999,
                            backgroundColor: withAlpha(tokens.secondary, 0.12),
                            color: tokens.secondary,
                            border: `1px solid ${withAlpha(tokens.secondary, 0.25)}`,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            marginBottom: 16,
                        }}
                    >
                        <span
                            className="be-services-v2__pulse"
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 9999,
                                backgroundColor: tokens.accent,
                            }}
                        />
                        Animated services template
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(2rem, 4.8vw, 3.3rem)',
                            lineHeight: 1.14,
                            letterSpacing: '-0.03em',
                            fontWeight: 850,
                        }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            style={{
                                margin: '14px 0 0 0',
                                fontSize: 'clamp(1rem, 1.9vw, 1.15rem)',
                                lineHeight: 1.72,
                                color: withAlpha(tokens.text, 0.73),
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </header>

                {isLoading ? (
                    <div
                        style={{
                            borderRadius: 20,
                            border: `1px solid ${withAlpha(tokens.primary, 0.16)}`,
                            padding: '28px 24px',
                            color: withAlpha(tokens.text, 0.6),
                            backgroundColor: withAlpha(tokens.background, 0.72),
                        }}
                    >
                        Loading services...
                    </div>
                ) : visibleServices.length === 0 ? (
                    <div
                        style={{
                            borderRadius: 20,
                            border: `1px solid ${withAlpha(tokens.primary, 0.16)}`,
                            padding: '28px 24px',
                            color: withAlpha(tokens.text, 0.6),
                            backgroundColor: withAlpha(tokens.background, 0.72),
                        }}
                    >
                        {emptyMessage}
                    </div>
                ) : (
                    <div
                        className="be-services-v2__grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.05fr 0.95fr',
                            gap: 24,
                            alignItems: 'stretch',
                        }}
                        onMouseEnter={() => setPauseRotation(true)}
                        onMouseLeave={() => setPauseRotation(false)}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gap: 14,
                                alignContent: 'start',
                            }}
                        >
                            {visibleServices.map((service, index) => {
                                const active = service.id === activeService?.id;
                                return (
                                    <button
                                        key={service.id}
                                        type="button"
                                        className="be-services-v2__card"
                                        onClick={() => setActiveServiceId(service.id)}
                                        onMouseEnter={() => setActiveServiceId(service.id)}
                                        style={{
                                            animationDelay: `${index * 72}ms`,
                                            textAlign: 'left',
                                            borderRadius: 18,
                                            border: `1px solid ${active ? withAlpha(tokens.primary, 0.5) : withAlpha(tokens.text, 0.12)}`,
                                            background: active
                                                ? `linear-gradient(135deg, ${withAlpha(tokens.primary, 0.14)}, ${withAlpha(tokens.secondary, 0.12)})`
                                                : withAlpha(tokens.background, 0.82),
                                            boxShadow: active
                                                ? `0 20px 40px ${withAlpha(tokens.primary, 0.2)}`
                                                : `0 10px 24px ${withAlpha(tokens.text, 0.06)}`,
                                            padding: '18px 18px 16px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: 20,
                                                    lineHeight: 1.2,
                                                    letterSpacing: '-0.015em',
                                                    color: active ? tokens.primary : tokens.text,
                                                }}
                                            >
                                                {service.name}
                                            </h3>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: active ? '#ffffff' : withAlpha(tokens.text, 0.6),
                                                    backgroundColor: active ? tokens.primary : withAlpha(tokens.text, 0.1),
                                                    borderRadius: 9999,
                                                    padding: '6px 10px',
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {active ? 'Active' : 'Preview'}
                                            </span>
                                        </div>
                                        {service.description && (
                                            <p
                                                style={{
                                                    margin: '10px 0 0 0',
                                                    color: withAlpha(tokens.text, 0.72),
                                                    lineHeight: 1.62,
                                                    fontSize: 14,
                                                }}
                                            >
                                                {service.description}
                                            </p>
                                        )}
                                        <div style={{ marginTop: 13, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {showPrice && service.price && (
                                                <span
                                                    style={{
                                                        borderRadius: 9999,
                                                        backgroundColor: withAlpha(tokens.secondary, 0.16),
                                                        color: tokens.secondary,
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        padding: '7px 10px',
                                                    }}
                                                >
                                                    {service.price}
                                                </span>
                                            )}
                                            {showDuration && service.duration && (
                                                <span
                                                    style={{
                                                        borderRadius: 9999,
                                                        backgroundColor: withAlpha(tokens.text, 0.08),
                                                        color: withAlpha(tokens.text, 0.76),
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        padding: '7px 10px',
                                                    }}
                                                >
                                                    {service.duration}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <aside
                            key={activeService?.id || 'spotlight-empty'}
                            className="be-services-v2__spotlight"
                            style={{
                                borderRadius: 22,
                                border: `1px solid ${withAlpha(tokens.primary, 0.22)}`,
                                background: `linear-gradient(145deg, ${withAlpha(tokens.background, 0.93)}, ${withAlpha(tokens.primary, 0.07)})`,
                                boxShadow: `0 26px 48px ${withAlpha(tokens.primary, 0.15)}`,
                                padding: '24px 22px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 7,
                                        borderRadius: 9999,
                                        backgroundColor: withAlpha(tokens.primary, 0.14),
                                        color: tokens.primary,
                                        border: `1px solid ${withAlpha(tokens.primary, 0.25)}`,
                                        padding: '7px 12px',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <span className="be-services-v2__pulse" style={{ width: 7, height: 7, borderRadius: 9999, backgroundColor: tokens.accent }} />
                                    {spotlightTitle}
                                </div>
                                <h3
                                    style={{
                                        margin: '14px 0 0 0',
                                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        color: tokens.text,
                                    }}
                                >
                                    {activeService?.name || 'Select a service'}
                                </h3>
                                {activeService?.description && (
                                    <p
                                        style={{
                                            margin: '12px 0 0 0',
                                            color: withAlpha(tokens.text, 0.72),
                                            fontSize: 15,
                                            lineHeight: 1.72,
                                        }}
                                    >
                                        {activeService.description}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {showPrice && activeService?.price && (
                                        <span
                                            style={{
                                                borderRadius: 12,
                                                backgroundColor: withAlpha(tokens.secondary, 0.16),
                                                color: tokens.secondary,
                                                padding: '10px 12px',
                                                fontWeight: 800,
                                                fontSize: 15,
                                            }}
                                        >
                                            {activeService.price}
                                        </span>
                                    )}
                                    {showDuration && activeService?.duration && (
                                        <span
                                            style={{
                                                borderRadius: 12,
                                                backgroundColor: withAlpha(tokens.text, 0.09),
                                                color: withAlpha(tokens.text, 0.72),
                                                padding: '10px 12px',
                                                fontWeight: 700,
                                                fontSize: 15,
                                            }}
                                        >
                                            {activeService.duration}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {showSelectButton && activeService && (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectService(activeService.id)}
                                            style={{
                                                borderRadius: 12,
                                                border: `1px solid ${tokens.primary}`,
                                                background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                fontSize: 14,
                                                padding: '11px 16px',
                                                cursor: 'pointer',
                                                boxShadow: `0 14px 24px ${withAlpha(tokens.primary, 0.22)}`,
                                            }}
                                        >
                                            {selectButtonText}
                                        </button>
                                    )}
                                    {ctaText && ctaLink && (
                                        <a
                                            href={ctaLink}
                                            style={{
                                                borderRadius: 12,
                                                border: `1px solid ${withAlpha(tokens.text, 0.2)}`,
                                                backgroundColor: withAlpha(tokens.background, 0.82),
                                                color: tokens.text,
                                                fontWeight: 700,
                                                fontSize: 14,
                                                padding: '11px 16px',
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {ctaText}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}
