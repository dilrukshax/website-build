'use client';

import React, { useState, useEffect } from 'react';
import type { ThemeComponentProps } from '../../types';

interface Service {
    id: string;
    name: string;
    price: string;
    currency: string;
    duration: number;
}

type BookingWidgetVariant = 'classic' | 'split' | 'compact';

function resolveVariant(styles: Record<string, unknown>): BookingWidgetVariant {
    const variant = typeof styles.variant === 'string' ? styles.variant.toLowerCase() : '';
    const layout = typeof styles.layout === 'string' ? styles.layout.toLowerCase() : '';

    if (variant === 'split' || layout === 'split') return 'split';
    if (variant === 'compact' || layout === 'compact') return 'compact';
    return 'classic';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function isPreviewRuntime(): boolean {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
}

function buildWebApiUrl(path: string): string {
    return isPreviewRuntime() ? `${API_BASE_URL}${path}` : path;
}

function buildLegacyPreviewHeaders(
    context?: ThemeComponentProps['context'],
    options?: { isEditor?: boolean },
): HeadersInit | undefined {
    if (!context?.tenantId || !context?.instanceId) {
        return undefined;
    }

    if (!isPreviewRuntime() && !options?.isEditor) {
        return undefined;
    }

    return {
        'x-tenant-id': context.tenantId,
        'x-instance-id': context.instanceId,
    };
}

export default function BookingWidgetV1({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = content.title as string || 'Book an Appointment';
    const subtitle = content.subtitle as string;
    const ctaText = content.ctaText as string || 'Book Now';
    const helperText = content.helperText as string;
    const highlightTitle = content.highlightTitle as string || 'Why book with us';
    const highlightPoints = Array.isArray(content.highlightPoints)
        ? content.highlightPoints.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4)
        : [];
    const successTitle = content.successTitle as string || 'Booking Confirmed!';

    const showServices = typeof content.showServices === 'boolean'
        ? content.showServices
        : (styles.showServices as boolean) !== false;
    const showDatePicker = typeof content.showDatePicker === 'boolean'
        ? content.showDatePicker
        : (styles.showDatePicker as boolean) !== false;
    const variant = resolveVariant(styles);
    const isSplit = variant === 'split';
    const isCompact = variant === 'compact';

    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00'); // default time
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleServiceSelect = (event: Event) => {
            const detail = (event as CustomEvent<{ serviceId?: string }>).detail;
            const serviceId = detail?.serviceId;
            if (serviceId) {
                setPendingServiceId(serviceId);
            }
        };

        window.addEventListener('be:select-service', handleServiceSelect as EventListener);
        return () => {
            window.removeEventListener('be:select-service', handleServiceSelect as EventListener);
        };
    }, []);

    // Fetch services on mount if we have context
    useEffect(() => {
        if (isPreviewRuntime() && (!context?.tenantId || !context?.instanceId)) return;
        
        const fetchServices = async () => {
            try {
                const res = await fetch(buildWebApiUrl('/web/services'), {
                    headers: buildLegacyPreviewHeaders(context, { isEditor }),
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setServices(data.data.items || data.data);
                }
            } catch (err) {
                console.error('Failed to load services', err);
            }
        };

        fetchServices();
    }, [context]);

    useEffect(() => {
        if (!pendingServiceId) return;
        if (services.some((service) => service.id === pendingServiceId)) {
            setSelectedServiceId(pendingServiceId);
            setPendingServiceId(null);
        }
    }, [pendingServiceId, services]);

    const handleBook = async () => {
        if (isEditor) {
            setStatus('error');
            setErrorMessage('Booking submissions are disabled in builder preview.');
            return;
        }

        if (isPreviewRuntime() && (!context?.tenantId || !context?.instanceId)) {
            setErrorMessage('Unable to create booking at this time (missing site context).');
            return;
        }

        if (!selectedServiceId || (showDatePicker && !date) || !firstName.trim() || !lastName.trim() || !email.trim()) {
            setErrorMessage('Please fill out all fields.');
            return;
        }

        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return;

        setStatus('loading');
        setErrorMessage('');

        const bookingDate = showDatePicker
            ? date
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
        const startDateTime = new Date(`${bookingDate}T${time}:00`);
        if (Number.isNaN(startDateTime.getTime())) {
            setStatus('error');
            setErrorMessage('Please select a valid booking date and time.');
            return;
        }
        const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

        try {
            const previewHeaders = buildLegacyPreviewHeaders(context, { isEditor });
            const res = await fetch(buildWebApiUrl('/web/bookings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(previewHeaders || {}),
                },
                body: JSON.stringify({
                    serviceId: selectedServiceId,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    customer: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        email: email.trim().toLowerCase(),
                        phone: phone.trim() || undefined,
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(data.error?.message || 'Failed to complete booking.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('An unexpected error occurred. Please try again.');
        }
    };

    const sectionStyle: React.CSSProperties = {
        padding: isCompact ? '64px 16px' : '80px 24px',
        backgroundColor: tokens.background,
        fontFamily: tokens.font,
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 600,
        color: tokens.text,
        marginBottom: '6px',
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: isCompact ? '10px 12px' : '12px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '15px',
        outline: 'none',
        backgroundColor: '#ffffff',
    };

    if (status === 'success') {
        return (
            <section id="booking-widget-section" style={sectionStyle}>
                <div style={{
                    maxWidth: isSplit ? '840px' : isCompact ? '480px' : '600px',
                    margin: '0 auto',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    padding: isCompact ? '32px 24px' : '48px 40px',
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>{successTitle}</h2>
                    <p style={{ color: '#6b7280' }}>
                        {content.successMessage as string || `Thank you ${firstName}, your appointment has been successfully booked.`}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section id="booking-widget-section" style={sectionStyle}>
            <div style={isSplit ? {
                maxWidth: '1024px',
                margin: '0 auto',
                display: 'grid',
                gap: '24px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                alignItems: 'stretch',
            } : {
                maxWidth: isCompact ? '520px' : '640px',
                margin: '0 auto',
            }}>
                {isSplit && (
                    <div style={{
                        borderRadius: '14px',
                        padding: '32px',
                        background: `linear-gradient(140deg, ${tokens.primary}, ${tokens.secondary})`,
                        color: '#ffffff',
                        boxShadow: '0 14px 30px rgba(15, 23, 42, 0.18)',
                    }}>
                        <h2 style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1.15, marginBottom: '12px' }}>{title}</h2>
                        {subtitle && <p style={{ fontSize: '17px', opacity: 0.95, marginBottom: '18px' }}>{subtitle}</p>}
                        {helperText && (
                            <p style={{ fontSize: '14px', opacity: 0.95, marginBottom: '22px' }}>{helperText}</p>
                        )}
                        {highlightPoints.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '10px' }}>
                                    {highlightTitle}
                                </h3>
                                <ul style={{ margin: 0, paddingInlineStart: '18px', display: 'grid', gap: '8px' }}>
                                    {highlightPoints.map((point, index) => (
                                        <li key={`${point}-${index}`} style={{ fontSize: '14px', lineHeight: 1.4 }}>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: isCompact ? '24px' : '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isCompact ? '16px' : '20px',
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                }}>
                    {!isSplit && (
                        <div style={{ textAlign: 'center', marginBottom: isCompact ? '8px' : '12px' }}>
                            <h2 style={{ fontSize: isCompact ? '30px' : '36px', fontWeight: 700, color: tokens.text, marginBottom: subtitle ? '10px' : 0 }}>{title}</h2>
                            {subtitle && <p style={{ fontSize: isCompact ? '16px' : '18px', color: '#6b7280' }}>{subtitle}</p>}
                            {helperText && (
                                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                                    {helperText}
                                </p>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
                            {errorMessage}
                        </div>
                    )}
                    
                    {showServices && (
                        <div>
                            <label style={labelStyle}>Select Service</label>
                            <select
                                value={selectedServiceId} 
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                style={fieldStyle}
                            >
                                <option value="">Choose a service...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.price} {s.currency})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {showDatePicker && (
                        <div style={{
                            display: 'grid',
                            gap: '16px',
                            gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
                        }}>
                            <div>
                                <label style={labelStyle}>Select Date</label>
                                <input
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={fieldStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Select Time</label>
                                <input
                                    type="time" 
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={fieldStyle}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gap: '16px',
                        gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                    }}>
                        <div>
                            <label style={labelStyle}>First Name</label>
                            <input
                                type="text" 
                                placeholder="John" 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input
                                type="text" 
                                placeholder="Doe" 
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email" 
                            placeholder="john@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={fieldStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Phone (Optional)</label>
                        <input
                            type="tel"
                            placeholder="+1-555-0199"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={fieldStyle}
                        />
                    </div>

                    <button
                        onClick={handleBook}
                        disabled={status === 'loading' || isEditor}
                        style={{
                            padding: isCompact ? '12px 20px' : '14px 32px',
                            backgroundColor: tokens.primary,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: status === 'loading' || isEditor ? 'not-allowed' : 'pointer',
                            marginTop: '8px',
                            opacity: status === 'loading' || isEditor ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {status === 'loading' ? 'Booking...' : isEditor ? 'Preview Mode' : ctaText}
                    </button>
                </div>
            </div>
        </section>
    );
}
