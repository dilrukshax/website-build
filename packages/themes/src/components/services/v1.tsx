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

export default function ServicesV1({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = content.title as string || 'Our Services';
    const subtitle = content.subtitle as string;
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string;
    const showAllServices = (content.showAllServices as boolean) === true;
    const featuredCountRaw = content.featuredCount as number | string | undefined;
    const featuredCount = Math.max(1, Number(featuredCountRaw) || 3);
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const selectButtonText = (content.selectButtonText as string) || 'Select Service';
    const showPrice = styles.showPrice !== false;
    const showDuration = styles.showDuration !== false;
    const tenantId = context?.tenantId;
    const instanceId = context?.instanceId;

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isPreviewRuntime() && (!tenantId || !instanceId)) {
            setIsLoading(false);
            setServices([]);
            return;
        }

        let isCancelled = false;

        const fetchServices = async () => {
            try {
                setIsLoading(true);
                const cacheBuster = Date.now().toString(36);
                const res = await fetch(`${buildWebApiUrl('/web/services')}?_cb=${cacheBuster}`, {
                    cache: 'no-store',
                    headers: buildLegacyPreviewHeaders(tenantId, instanceId, { isEditor }),
                });
                const payload = await res.json() as PublicServicesResponse;
                const data = Array.isArray(payload.data) ? payload.data as PublicService[] : [];

                if (!isCancelled) {
                    setServices(data.map(mapPublicServiceToItem));
                }
            } catch (error) {
                console.error('Failed to load services section data', error);
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

    const emptyMessage = 'No active services found. Add services from the Services tab.';

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

    return (
        <section style={{ padding: '96px 24px', backgroundColor: '#f9fafb', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '800px', marginInline: 'auto' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: tokens.text, marginBottom: '16px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '20px', color: '#4b5563', lineHeight: 1.6 }}>{subtitle}</p>}
                    {ctaText && ctaLink && (
                        <div style={{ marginTop: '32px' }}>
                            <a
                                href={ctaLink}
                                style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: tokens.primary, color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    {isLoading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                            Loading services...
                        </div>
                    ) : visibleServices.length > 0 ? visibleServices.map((svc) => (
                        <div
                            key={svc.id}
                            style={{
                                backgroundColor: tokens.background,
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                transition: 'all 0.3s ease',
                                border: '1px solid #f3f4f6',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                e.currentTarget.style.borderColor = tokens.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                e.currentTarget.style.borderColor = '#f3f4f6';
                            }}
                        >
                            <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: 700, color: tokens.text, marginBottom: '12px', lineHeight: 1.3 }}>{svc.name}</h3>
                                {svc.description && <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.6, flex: 1 }}>{svc.description}</p>}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                    {showPrice && svc.price && <span style={{ fontSize: '20px', fontWeight: 800, color: tokens.primary }}>{svc.price}</span>}
                                    {showDuration && svc.duration && <span style={{ fontSize: '15px', fontWeight: 500, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '9999px' }}>{svc.duration}</span>}
                                </div>
                                {showSelectButton && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectService(svc.id)}
                                        style={{
                                            marginTop: '18px',
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: `1px solid ${tokens.primary}`,
                                            backgroundColor: 'transparent',
                                            color: tokens.primary,
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = tokens.primary;
                                            e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = tokens.primary;
                                        }}
                                    >
                                        {selectButtonText}
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                            {emptyMessage}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
