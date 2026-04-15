'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';

export default function BookingWidgetV9({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Book an Appointment';
    const subtitle = (content.subtitle as string) || 'Velocity VSL v9';
    const ctaText = (content.ctaText as string) || 'Submit Booking';

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

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    const formBlock = (
        <form
            style={{ marginTop: '12px', border, background: card, borderRadius: '14px', padding: '12px', display: 'grid', gap: '10px', textAlign: 'left' }}
            onSubmit={async (event) => {
                event.preventDefault();
                await submit();
            }}
        >
            {status === 'error' ? <div style={{ color: '#ef4444', fontSize: '13px' }}>{errorMessage}</div> : null}
            {status === 'success' ? <div style={{ color: '#16a34a', fontSize: '13px' }}>Booking submitted successfully.</div> : null}
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                <option value="">Select a service</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical' }} />
            {selectedService ? <p style={{ margin: 0, color: titleColor, fontWeight: 700 }}>{formatServicePrice(selectedService.price, selectedService.currency)} · {formatServiceDuration(selectedService.duration)}</p> : null}
            <button type="submit" disabled={status === 'loading'} style={{ minHeight: '44px', borderRadius: '10px', border: 'none', background: tokens.primary, color: '#fff', fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
                {status === 'loading' ? 'Submitting...' : ctaText}
            </button>
        </form>
    );

    return (
        <section id="booking-widget" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
        {formBlock}
    </div>

        </section>
    );
}
