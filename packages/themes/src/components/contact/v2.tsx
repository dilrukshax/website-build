'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';

export default function ContactV2({ content, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Initiate Connection';
    const subtitle = content.subtitle as string || 'Establish a secure uplink with our operators.';
    const email = content.email as string || 'contact@neon.io';
    const phone = content.phone as string || '+1 888 000 0000';
    const address = content.address as string;
    const submitText = content.ctaText as string || 'Transmit Data';

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
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 12vw, 140px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${tokens.primary}40, transparent)`, zIndex: 0 }} />

            <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 6vw, 64px)' }}>
                <div style={{ flex: '1 1 400px' }}>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 900, color: '#fff', textShadow: `0 0 15px ${tokens.primary}60`, marginBottom: '16px', letterSpacing: '-1px' }}>{title}</h2>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '54px' }}>{subtitle}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '12px', color: tokens.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>COMMS PROTOCOL (EMAIL)</span>
                            <a href={`mailto:${email}`} style={{ color: '#fff', fontSize: 'clamp(18px, 6vw, 24px)', fontWeight: 800, textDecoration: 'none' }}>{email}</a>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '12px', color: tokens.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>VOICE CHANNEL</span>
                            <a href={`tel:${phone}`} style={{ color: '#fff', fontSize: 'clamp(18px, 6vw, 24px)', fontWeight: 800, textDecoration: 'none' }}>{phone}</a>
                        </div>
                        {address && (
                            <div>
                                <span style={{ display: 'block', fontSize: '12px', color: tokens.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>PHYSICAL NODE</span>
                                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>{address}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ flex: '1 1 450px' }}>
                    <form
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${tokens.primary}30`,
                            borderRadius: '24px',
                            padding: 'clamp(18px, 5vw, 40px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await submit();
                        }}
                    >
                        {status === 'error' && (
                            <div style={{ borderRadius: '10px', padding: '10px 12px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#fecaca', fontWeight: 600 }}>
                                {errorMessage}
                            </div>
                        )}

                        {status === 'success' && (
                            <div style={{ borderRadius: '10px', padding: '10px 12px', backgroundColor: 'rgba(34,197,94,0.18)', color: '#bbf7d0', fontWeight: 600 }}>
                                Transmission received. We will contact you soon.
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="FIRST NAME"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ flex: '1 1 180px', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}40`, fontSize: '14px', backgroundColor: 'transparent', color: '#fff', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box' }}
                            />
                            <input
                                type="text"
                                placeholder="LAST NAME"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ flex: '1 1 180px', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}40`, fontSize: '14px', backgroundColor: 'transparent', color: '#fff', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box' }}
                            />
                        </div>

                        <input
                            type="email"
                            placeholder="ADDRESS (EMAIL)"
                            value={formEmail}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}40`, fontSize: '14px', backgroundColor: 'transparent', color: '#fff', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box' }}
                        />

                        <input
                            type="text"
                            placeholder="PHONE (OPTIONAL)"
                            value={formPhone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}40`, fontSize: '14px', backgroundColor: 'transparent', color: '#fff', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box' }}
                        />

                        <textarea
                            rows={4}
                            placeholder="TRANSMISSION (MESSAGE)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: '100%', padding: '14px 0', border: 'none', borderBottom: `1px solid ${tokens.primary}40`, fontSize: '14px', backgroundColor: 'transparent', color: '#fff', outline: 'none', letterSpacing: '0.1em', boxSizing: 'border-box', resize: 'vertical' }}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '18px',
                                marginTop: '14px',
                                border: 'none',
                                borderRadius: '100px',
                                background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})`,
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s',
                                opacity: isSubmitting ? 0.75 : 1,
                            }}
                        >
                            {isSubmitting ? 'Transmitting...' : submitText}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
