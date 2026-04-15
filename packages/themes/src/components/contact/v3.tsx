'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';
import { getReadableTextColor } from '../shared/color-contrast';

export default function ContactV3({ content, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Say Hello!';
    const subtitle = content.subtitle as string || 'Do not be shy, drop us a line.';
    const email = content.email as string || 'happy@company.com';
    const phone = content.phone as string || '+1 (800) YAY-WOO';
    const submitText = content.ctaText as string || 'Send It Over!';

    const {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email: formEmail,
        setEmail,
        phone: formPhone,
        setPhone,
        message,
        setMessage,
        status,
        errorMessage,
        submit,
    } = useContactInquiryForm(context);

    const isSubmitting = status === 'loading';
    const textOnSectionSurface = getReadableTextColor(tokens.secondary, tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnPrimary = getReadableTextColor(tokens.primary, '#ffffff', 4.5);
    const textOnAccent = getReadableTextColor(tokens.accent, '#ffffff', 4.5);
    const secondaryHeadlineColor = getReadableTextColor(tokens.secondary, tokens.primary, 3);

    return (
        <section style={{ backgroundColor: tokens.secondary, padding: '140px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
                <div style={{ flex: '1 1 400px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', backgroundColor: tokens.primary, borderRadius: '50px', zIndex: 0, opacity: 0.2 }} />
                        <h2 style={{ fontSize: '64px', fontWeight: 900, color: textOnSectionSurface, letterSpacing: '-2px', position: 'relative', zIndex: 1, transform: 'rotate(-4deg)' }}>{title}</h2>
                    </div>
                    <p style={{ fontSize: '24px', color: secondaryHeadlineColor, fontWeight: 800, marginTop: '24px', transform: 'rotate(2deg)' }}>{subtitle}</p>

                    <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
                        <a href={`mailto:${email}`} style={{ display: 'inline-block', color: textOnWhiteSurface, fontSize: '24px', fontWeight: 900, textDecoration: 'none', backgroundColor: '#fff', padding: '16px 32px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, boxShadow: `8px 8px 0 ${tokens.accent}`, transform: 'rotate(-2deg)' }}>
                            {email}
                        </a>
                        <a href={`tel:${phone}`} style={{ display: 'inline-block', color: textOnAccent, fontSize: '24px', fontWeight: 900, textDecoration: 'none', backgroundColor: tokens.accent, padding: '16px 32px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, boxShadow: `8px 8px 0 ${tokens.primary}`, transform: 'rotate(2deg)' }}>
                            {phone}
                        </a>
                    </div>
                </div>

                <div style={{ flex: '1 1 450px' }}>
                    <form
                        style={{
                            backgroundColor: '#fff',
                            padding: '48px 40px',
                            borderRadius: '40px',
                            border: `6px solid ${textOnWhiteSurface}`,
                            boxShadow: `16px 16px 0 ${tokens.primary}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transform: 'rotate(1deg)',
                        }}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await submit();
                        }}
                    >
                        <h3 style={{ fontSize: '32px', fontWeight: 900, color: textOnWhiteSurface, marginBottom: '4px', letterSpacing: '-1px' }}>Send a Postcard</h3>

                        {status === 'error' && (
                            <div style={{ borderRadius: '16px', padding: '12px 14px', border: `3px solid ${textOnWhiteSurface}`, backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 800 }}>
                                {errorMessage}
                            </div>
                        )}

                        {status === 'success' && (
                            <div style={{ borderRadius: '16px', padding: '12px 14px', border: `3px solid ${textOnWhiteSurface}`, backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800 }}>
                                Message delivered. We will get back to you soon.
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ flex: '1 1 170px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ flex: '1 1 170px', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <input
                            type="email"
                            placeholder="Your Email"
                            value={formEmail}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, outline: 'none', boxSizing: 'border-box' }}
                        />

                        <input
                            type="text"
                            placeholder="Phone (Optional)"
                            value={formPhone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', padding: '16px 18px', borderRadius: '100px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, outline: 'none', boxSizing: 'border-box' }}
                        />

                        <textarea
                            rows={4}
                            placeholder="What is up?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: `4px solid ${textOnWhiteSurface}`, fontSize: '17px', fontWeight: 700, color: textOnWhiteSurface, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '20px',
                                backgroundColor: tokens.primary,
                                color: textOnPrimary,
                                border: `4px solid ${textOnWhiteSurface}`,
                                borderRadius: '100px',
                                fontSize: '20px',
                                fontWeight: 900,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                boxShadow: `0 6px 0 ${textOnWhiteSurface}`,
                                marginTop: '8px',
                                opacity: isSubmitting ? 0.75 : 1,
                            }}
                        >
                            {isSubmitting ? 'Sending...' : submitText}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
