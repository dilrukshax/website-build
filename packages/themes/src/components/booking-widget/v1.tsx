'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';
import { getReadableTextColor } from '../shared/color-contrast';

export default function BookingWidgetV1({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Book Your Spot';
    const subtitle = content.subtitle as string;
    const helperText = content.helperText as string;
    const successTitle = content.successTitle as string || 'Booking Confirmed';
    const successMessage = content.successMessage as string || 'Thank you. Your booking has been created.';
    const ctaText = content.ctaText as string || 'Book Now';
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
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnPrimary = getReadableTextColor(tokens.primary, tokens.background, 4.5);

    if (isSuccess) {
        return (
            <section style={{ backgroundColor: tokens.background, padding: '80px 24px', fontFamily: tokens.font }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ecfdf5', borderRadius: '16px', border: '1px solid #86efac', padding: '36px', textAlign: 'center' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '10px', fontSize: '30px', color: '#166534' }}>{successTitle}</h2>
                    <p style={{ margin: 0, color: '#166534' }}>{successMessage}</p>
                </div>
            </section>
        );
    }

    return (
        <section style={{ backgroundColor: tokens.background, padding: '80px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '42px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: textOnWhiteSurface, marginBottom: '10px', textAlign: 'center' }}>{title}</h2>
                {subtitle && <p style={{ marginTop: 0, marginBottom: '8px', textAlign: 'center', color: '#4b5563' }}>{subtitle}</p>}
                {helperText && <p style={{ marginTop: 0, marginBottom: '26px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>{helperText}</p>}

                {status === 'error' && (
                    <div style={{ marginBottom: '16px', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
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
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnWhiteSurface, marginBottom: '8px' }}>Service</label>
                            <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
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

                    {selectedService && (
                        <div style={{ borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatServicePrice(selectedService.price, selectedService.currency)}</span>
                            <span style={{ color: '#475569', fontWeight: 600 }}>{formatServiceDuration(selectedService.duration)}</span>
                        </div>
                    )}

                    {showDatePicker && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnWhiteSurface, marginBottom: '8px' }}>Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnWhiteSurface, marginBottom: '8px' }}>Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{ flex: '1 1 200px', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{ flex: '1 1 200px', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ flex: '1 1 230px', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <input
                            type="text"
                            placeholder="Phone (Optional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ flex: '1 1 200px', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <textarea
                        rows={3}
                        placeholder="Notes (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            backgroundColor: tokens.primary,
                            color: textOnPrimary,
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.75 : 1,
                            marginTop: '8px',
                        }}
                    >
                        {isSubmitting ? 'Booking...' : ctaText}
                    </button>
                </form>
            </div>
        </section>
    );
}
