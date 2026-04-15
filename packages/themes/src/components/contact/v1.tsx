'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';
import { getReadableTextColor } from '../shared/color-contrast';

export default function ContactV1({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Get in Touch';
    const subtitle = content.subtitle as string || 'We would love to hear from you';
    const address = content.address as string;
    const email = content.email as string || 'hello@example.com';
    const phone = content.phone as string || '+1 (555) 123-4567';
    const mapEmbedUrl = content.mapEmbedUrl as string;
    const showMap = (styles.showMap as boolean) !== false;
    const showForm = (content.showForm as boolean) !== false;
    const submitText = content.ctaText as string || 'Send Message';

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
        reset,
    } = useContactInquiryForm(context);

    const isSubmitting = status === 'loading';
    const isSuccess = status === 'success';
    const textOnSectionSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnInputSurface = getReadableTextColor(tokens.background, tokens.text, 4.5);
    const textOnPrimary = getReadableTextColor(tokens.primary, tokens.background, 4.5);

    return (
        <>
            <style>{`
                .theme-v1-contact-row {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .theme-v1-contact-row > div {
                    flex: 1 1 240px;
                    min-width: 0;
                }
                .theme-v1-contact-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                @media (max-width: 720px) {
                    .theme-v1-contact-row > div {
                        flex-basis: 100%;
                    }
                    .theme-v1-contact-actions > button {
                        width: 100%;
                    }
                }
            `}</style>
            <section style={{ backgroundColor: '#ffffff', padding: 'clamp(72px, 12vw, 120px) 16px', fontFamily: tokens.font }}>
                <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, color: textOnSectionSurface, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(15px, 3.4vw, 18px)', color: '#6b7280', marginBottom: 'clamp(34px, 8vw, 64px)' }}>{subtitle}</p>

                    {showForm && (
                        <form
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await submit();
                            }}
                        >
                            {status === 'error' && (
                                <div style={{ borderRadius: '8px', padding: '12px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>
                                    {errorMessage}
                                </div>
                            )}

                            {isSuccess && (
                                <div style={{ borderRadius: '8px', padding: '12px 14px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }}>
                                    Thank you. Your inquiry has been sent.
                                </div>
                            )}

                            <div className="theme-v1-contact-row">
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnSectionSurface, marginBottom: '8px' }}>First Name</label>
                                    <input
                                        type="text"
                                        placeholder="Jane"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: textOnInputSurface, fontSize: '16px', backgroundColor: tokens.background, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnSectionSurface, marginBottom: '8px' }}>Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: textOnInputSurface, fontSize: '16px', backgroundColor: tokens.background, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div className="theme-v1-contact-row">
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnSectionSurface, marginBottom: '8px' }}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={formEmail}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: textOnInputSurface, fontSize: '16px', backgroundColor: tokens.background, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnSectionSurface, marginBottom: '8px' }}>Phone (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="+1 555 123 4567"
                                        value={formPhone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: textOnInputSurface, fontSize: '16px', backgroundColor: tokens.background, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: textOnSectionSurface, marginBottom: '8px' }}>Message</label>
                                <textarea
                                    rows={5}
                                    placeholder="How can we help you?"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: textOnInputSurface, fontSize: '16px', backgroundColor: tokens.background, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                                />
                            </div>

                            <div className="theme-v1-contact-actions">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: tokens.primary,
                                        color: textOnPrimary,
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.75 : 1,
                                    }}
                                >
                                    {isSubmitting ? 'Sending...' : submitText}
                                </button>

                                {isSuccess && (
                                    <button
                                        type="button"
                                        onClick={reset}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: `1px solid ${tokens.primary}`,
                                            backgroundColor: '#fff',
                                            color: tokens.primary,
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Send Another
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '64px', flexWrap: 'wrap' }}>
                        {address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '20px' }}>📍</span>
                                <span style={{ color: '#374151', fontSize: '16px', fontWeight: 500 }}>{address}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>✉️</span>
                            <a href={`mailto:${email}`} style={{ color: tokens.primary, textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{email}</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>📞</span>
                            <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} style={{ color: tokens.primary, textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>{phone}</a>
                        </div>
                    </div>

                    {showMap && mapEmbedUrl && (
                        <div style={{ marginTop: '48px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <iframe
                                src={mapEmbedUrl}
                                width="100%"
                                height="300"
                                style={{ border: 0 }}
                                loading="lazy"
                                title="Location map"
                            />
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
