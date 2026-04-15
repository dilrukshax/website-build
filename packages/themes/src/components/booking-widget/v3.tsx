'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, useBookingForm } from '../shared/public-web';
import { getReadableTextColor } from '../shared/color-contrast';

export default function BookingWidgetV3({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || "Let's Go!";
    const subtitle = content.subtitle as string;
    const helperText = content.helperText as string;
    const successTitle = content.successTitle as string || 'Booked!';
    const successMessage = content.successMessage as string || 'Your spot is locked in.';
    const ctaText = content.ctaText as string || 'Find the Magic';
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
    const textOnSectionSurface = getReadableTextColor(tokens.secondary, tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnAccent = getReadableTextColor(tokens.accent, '#ffffff', 4.5);
    const textOnPrimary = getReadableTextColor(tokens.primary, '#ffffff', 4.5);

    if (isSuccess) {
        return (
            <section style={{ backgroundColor: tokens.background, padding: '100px 24px', fontFamily: tokens.font }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', borderRadius: '28px', border: `5px solid ${textOnSectionSurface}`, boxShadow: `10px 10px 0 ${tokens.primary}`, backgroundColor: '#dcfce7', padding: '32px', textAlign: 'center' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '34px', color: '#14532d', fontWeight: 900 }}>{successTitle}</h2>
                    <p style={{ margin: 0, color: '#166534', fontWeight: 700 }}>{successMessage}</p>
                </div>
            </section>
        );
    }

    return (
        <section style={{ backgroundColor: tokens.background, padding: '100px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: tokens.secondary, borderRadius: '40px', padding: '48px', border: `6px solid ${textOnSectionSurface}`, boxShadow: `12px 12px 0 ${tokens.primary}`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-24px', left: '48px', backgroundColor: tokens.accent, color: textOnAccent, padding: '12px 24px', borderRadius: '100px', border: `4px solid ${textOnSectionSurface}`, fontWeight: 900, fontSize: '20px', transform: 'rotate(-4deg)' }}>
                    Book your spot
                </div>
                <h2 style={{ fontSize: '48px', fontWeight: 900, color: textOnSectionSurface, marginBottom: '8px', textAlign: 'center', letterSpacing: '-2px', marginTop: '24px' }}>{title}</h2>
                {subtitle && <p style={{ marginTop: 0, marginBottom: '8px', textAlign: 'center', color: '#334155', fontWeight: 700 }}>{subtitle}</p>}
                {helperText && <p style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#475569', fontSize: '14px', fontWeight: 700 }}>{helperText}</p>}

                {status === 'error' && (
                    <div style={{ marginBottom: '16px', borderRadius: '16px', border: `4px solid ${textOnSectionSurface}`, backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 800, padding: '12px 14px' }}>
                        {errorMessage}
                    </div>
                )}

                <form
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await submit();
                    }}
                >
                    {showServices && (
                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            style={{ width: '100%', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        >
                            <option value="">{servicesLoading ? 'Loading services...' : 'Choose a service'}</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {selectedService && (
                        <div style={{ borderRadius: '18px', border: `4px solid ${textOnWhiteSurface}`, backgroundColor: '#fff', padding: '10px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 900, color: tokens.primary }}>{formatServicePrice(selectedService.price, selectedService.currency)}</span>
                            <span style={{ fontWeight: 800, color: '#475569' }}>{formatServiceDuration(selectedService.duration)}</span>
                        </div>
                    )}

                    {showDatePicker && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{ flex: '1 1 180px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{ flex: '1 1 180px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <input
                            type="text"
                            placeholder="Phone (Optional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <textarea
                        rows={3}
                        placeholder="Notes (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', padding: '16px 18px', borderRadius: '24px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '16px', fontWeight: 700, color: textOnWhiteSurface, backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '22px 24px',
                            backgroundColor: tokens.primary,
                            color: textOnPrimary,
                            border: `4px solid ${textOnSectionSurface}`,
                            borderRadius: '100px',
                            fontSize: '20px',
                            fontWeight: 900,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: `0 6px 0 ${textOnSectionSurface}`,
                            opacity: isSubmitting ? 0.75 : 1,
                        }}
                    >
                        {isSubmitting ? 'Booking...' : ctaText}
                    </button>
                </form>
            </div>
        </section>
    );
}
