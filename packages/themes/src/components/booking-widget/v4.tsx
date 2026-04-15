'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';

export default function BookingWidgetV4({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Reserve Your Experience';
    const subtitle = content.subtitle as string;
    const helperText = content.helperText as string;
    const successTitle = content.successTitle as string || 'Reservation Submitted';
    const successMessage = content.successMessage as string || 'Our concierge will contact you with confirmation details.';
    const ctaText = content.ctaText as string || 'Confirm Availability';
    const showServices = typeof content.showServices === 'boolean'
        ? content.showServices
        : (styles.showServices as boolean) !== false;
    const showDatePicker = typeof content.showDatePicker === 'boolean'
        ? content.showDatePicker
        : (styles.showDatePicker as boolean) !== false;

    const {
        services,
        servicesLoading,
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

    const isSubmitting = status === 'loading';
    const isSuccess = status === 'success';

    if (isSuccess) {
        return (
            <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) clamp(16px, 4vw, 32px)', fontFamily: tokens.font }}>
                <div style={{ maxWidth: '980px', margin: '0 auto', border: `1px solid ${tokens.primary}55`, padding: 'clamp(20px, 5vw, 34px)', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '10px', fontSize: 'clamp(24px, 7vw, 34px)', color: '#0f172a', fontWeight: 400, letterSpacing: '0.06em' }}>{successTitle}</h2>
                    <p style={{ margin: 0, color: '#334155', letterSpacing: '0.03em' }}>{successMessage}</p>
                </div>
            </section>
        );
    }

    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) clamp(16px, 4vw, 32px)', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '44px' }}>
                    <span style={{ fontSize: '12px', letterSpacing: '0.4em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>{title}</span>
                    <div style={{ width: '40px', height: '1px', backgroundColor: tokens.primary }} />
                </div>
                {subtitle && <p style={{ marginTop: 0, marginBottom: '8px', color: '#374151' }}>{subtitle}</p>}
                {helperText && <p style={{ marginTop: 0, marginBottom: '24px', color: '#6b7280', fontSize: '14px' }}>{helperText}</p>}

                {status === 'error' && (
                    <div style={{ marginBottom: '16px', border: '1px solid #fecaca', backgroundColor: '#fff1f2', color: '#9f1239', padding: '12px 14px', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {errorMessage}
                    </div>
                )}

                <form
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(14px, 4vw, 28px)', alignItems: 'flex-end', borderBottom: `1px solid ${tokens.primary}20`, paddingBottom: 'clamp(28px, 8vw, 60px)' }}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await submit();
                    }}
                >
                    {showServices && (
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Service</label>
                            <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="">{servicesLoading ? 'Loading services...' : 'Select a service'}</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {showDatePicker && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Arrival Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Arrival Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Phone (Optional)</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Notes (Optional)</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}`, fontSize: '15px', fontWeight: 300, backgroundColor: 'transparent', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                    </div>

                    {selectedService && (
                        <div style={{ gridColumn: '1 / -1', color: '#475569', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <span>{formatServicePrice(selectedService.price, selectedService.currency)}</span>
                            <span>{formatServiceDuration(selectedService.duration)}</span>
                        </div>
                    )}

                    <div style={{ gridColumn: '1 / -1' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: 'transparent',
                                color: tokens.primary,
                                border: `1px solid ${tokens.primary}`,
                                fontSize: '11px',
                                fontWeight: 500,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.75 : 1,
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : ctaText}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
