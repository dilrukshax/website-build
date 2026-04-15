'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';

export default function ContactV4({ content, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Private Inquiries';
    const subtitle = content.subtitle as string || 'Discreet communications for discerning clients.';
    const email = content.email as string || 'concierge@opulence.com';
    const phone = content.phone as string || 'Consultation via private line';
    const address = content.address as string;
    const submitText = content.ctaText as string || 'Submit Request';

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

    return (
        <section style={{ backgroundColor: '#f8fafc', padding: 'clamp(72px, 11vw, 120px) 16px clamp(80px, 13vw, 140px)', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 6vw, 80px)' }}>
                <div style={{ flex: '1 1 400px' }}>
                    <span style={{ fontSize: '12px', letterSpacing: '0.4em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '32px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.05em', margin: '0 0 clamp(30px, 8vw, 64px) 0' }}>{title}</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Direct Communication</span>
                            <a href={`mailto:${email}`} style={{ marginTop: '8px', color: '#0f172a', textDecoration: 'none', fontSize: 'clamp(16px, 4.8vw, 20px)', fontWeight: 700 }}>{email}</a>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Vocal Consultation</span>
                            <a href={`tel:${phone}`} style={{ marginTop: '8px', color: '#0f172a', textDecoration: 'none', fontSize: 'clamp(16px, 4.8vw, 20px)', fontWeight: 700 }}>{phone}</a>
                        </div>
                        {address && (
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Office Location</span>
                                <span style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: 300, letterSpacing: '0.05em' }}>{address}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ flex: '1 1 450px' }}>
                    <form
                        style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 4.6vw, 30px)' }}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await submit();
                        }}
                    >
                        {status === 'error' && (
                            <div style={{ border: '1px solid #fecaca', backgroundColor: '#fff1f2', color: '#b91c1c', padding: '12px 14px', fontSize: '13px', letterSpacing: '0.04em' }}>
                                {errorMessage}
                            </div>
                        )}

                        {status === 'success' && (
                            <div style={{ border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', padding: '12px 14px', fontSize: '13px', letterSpacing: '0.04em' }}>
                                Request submitted successfully. Our concierge will contact you.
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '14px 0', border: 'none', borderBottom: '1px solid #1a1a1a20', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ flex: '1 1 220px', padding: '14px 0', border: 'none', borderBottom: '1px solid #1a1a1a20', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }}
                            />
                        </div>

                        <input
                            type="email"
                            placeholder="Email Address"
                            value={formEmail}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '16px 0', border: 'none', borderBottom: '1px solid #1a1a1a20', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }}
                        />

                        <input
                            type="text"
                            placeholder="Phone (Optional)"
                            value={formPhone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', padding: '16px 0', border: 'none', borderBottom: '1px solid #1a1a1a20', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }}
                        />

                        <textarea
                            rows={4}
                            placeholder="Subject of Inquiry"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: '100%', padding: '16px 0', border: 'none', borderBottom: '1px solid #1a1a1a20', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent', resize: 'vertical' }}
                        />

                        <div style={{ marginTop: '16px' }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    padding: '12px 22px',
                                    border: `1px solid ${tokens.primary}`,
                                    backgroundColor: 'transparent',
                                    color: tokens.primary,
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.75 : 1,
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : submitText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
