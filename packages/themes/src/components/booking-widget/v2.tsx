'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';

export default function BookingWidgetV2({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Initialize Sequence';
    const subtitle = content.subtitle as string;
    const helperText = content.helperText as string;
    const successTitle = content.successTitle as string || 'Sequence Confirmed';
    const successMessage = content.successMessage as string || 'Your booking signal was accepted.';
    const ctaText = content.ctaText as string || 'Execute Booking';
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
            <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 10vw, 100px) 16px', fontFamily: tokens.font }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', borderRadius: '20px', border: `1px solid ${tokens.accent}55`, background: 'rgba(16,185,129,0.08)', padding: 'clamp(20px, 5vw, 34px)', textAlign: 'center' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '10px', fontSize: 'clamp(24px, 7vw, 30px)', color: '#bbf7d0' }}>{successTitle}</h2>
                    <p style={{ margin: 0, color: '#d1fae5' }}>{successMessage}</p>
                </div>
            </section>
        );
    }

    return (
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 10vw, 100px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: `1px solid ${tokens.primary}40`, padding: 'clamp(18px, 4.8vw, 40px)', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)` }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: tokens.accent, boxShadow: `0 0 10px ${tokens.accent}` }} />
                    <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
                </div>
                {subtitle && <p style={{ marginTop: 0, marginBottom: '8px', color: 'rgba(255,255,255,0.72)' }}>{subtitle}</p>}
                {helperText && <p style={{ marginTop: 0, marginBottom: '20px', color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>{helperText}</p>}

                {status === 'error' && (
                    <div style={{ marginBottom: '16px', borderRadius: '10px', padding: '12px 14px', backgroundColor: 'rgba(239,68,68,0.18)', color: '#fecaca', fontWeight: 600 }}>
                        {errorMessage}
                    </div>
                )}

                <form
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await submit();
                    }}
                >
                    {showServices && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: tokens.primary, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Service</label>
                            <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '15px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                            >
                                <option value="">{servicesLoading ? 'Loading services...' : 'Select a service'}</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id} style={{ backgroundColor: '#020617' }}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedService && (
                        <div style={{ borderRadius: '12px', border: `1px solid ${tokens.primary}25`, backgroundColor: 'rgba(15,23,42,0.45)', padding: '10px 12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#fff', fontWeight: 700 }}>{formatServicePrice(selectedService.price, selectedService.currency)}</span>
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{formatServiceDuration(selectedService.duration)}</span>
                        </div>
                    )}

                    {showDatePicker && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '15px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                            />
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '15px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="FIRST NAME"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{ flex: '1 1 180px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em' }}
                        />
                        <input
                            type="text"
                            placeholder="LAST NAME"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{ flex: '1 1 180px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ flex: '1 1 220px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em' }}
                        />
                        <input
                            type="text"
                            placeholder="PHONE (OPTIONAL)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ flex: '1 1 220px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.08em' }}
                        />
                    </div>

                    <textarea
                        rows={3}
                        placeholder="NOTES (OPTIONAL)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${tokens.primary}30`, fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical', letterSpacing: '0.08em' }}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '18px 24px',
                            background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})`,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 800,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginTop: '4px',
                            opacity: isSubmitting ? 0.75 : 1,
                        }}
                    >
                        {isSubmitting ? 'Executing...' : ctaText}
                    </button>
                </form>
            </div>
        </section>
    );
}
