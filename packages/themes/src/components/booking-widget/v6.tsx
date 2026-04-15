'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';

export default function BookingWidgetV6({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Book a Revenue Mapping Call';
    const subtitle = (content.subtitle as string) || 'Next Step';
    const ctaText = (content.ctaText as string) || 'Confirm Booking';

    const {
        services,
        selectedServiceId,
        setSelectedServiceId,
        selectedService,
        date,
        setDate,
        time,
        setTime,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        phone,
        setPhone,
        notes,
        setNotes,
        status,
        errorMessage,
        submit,
    } = useBookingForm(context);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#586273';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const card = '#ffffff';
    const border = '#e9ddc9';
    const inputBorder = '#dacdb8';

    const formBlock = (
        <form
            style={{
                marginTop: '12px',
                border: `1px solid ${border}`,
                background: card,
                borderRadius: '18px',
                padding: '16px',
                display: 'grid',
                gap: '10px',
                textAlign: 'left',
                boxShadow: '0 14px 30px rgba(25, 29, 36, 0.08)',
            }}
            onSubmit={async (event) => {
                event.preventDefault();
                await submit();
            }}
        >
            {status === 'error' ? <div style={{ color: '#ef4444', fontSize: '13px' }}>{errorMessage}</div> : null}
            {status === 'success' ? <div style={{ color: '#16a34a', fontSize: '13px' }}>Booking submitted successfully.</div> : null}
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }}>
                <option value="">Select a service</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box', resize: 'vertical' }} />
            {selectedService ? <p style={{ margin: 0, color: titleColor, fontWeight: 700 }}>{formatServicePrice(selectedService.price, selectedService.currency)} · {formatServiceDuration(selectedService.duration)}</p> : null}
            <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                    minHeight: '44px',
                    borderRadius: '11px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                    color: '#fff',
                    fontWeight: 760,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 18px rgba(255, 106, 61, 0.28)',
                }}
            >
                {status === 'loading' ? 'Submitting...' : ctaText}
            </button>
        </form>
    );

    return (
        <section id="booking-widget" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <aside
                    style={{
                        border: `1px solid ${border}`,
                        background: `linear-gradient(180deg, #171f2d 0%, #232f42 100%)`,
                        borderRadius: '18px',
                        padding: '16px',
                        boxShadow: '0 14px 30px rgba(25, 29, 36, 0.2)',
                    }}
                >
                    <p style={{ margin: 0, color: '#f4c27c', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: '#fff', fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                    <p style={{ margin: '8px 0 0 0', color: '#d0dae8', lineHeight: 1.6 }}>
                        Pick the service and slot that fits your team. We keep this intake short so action can start quickly.
                    </p>
                    {selectedService ? <p style={{ margin: '10px 0 0 0', color: '#fff', fontWeight: 760 }}>{formatServicePrice(selectedService.price, selectedService.currency)} · {formatServiceDuration(selectedService.duration)}</p> : null}
                </aside>
                {formBlock}
            </div>
        </section>
    );
}
