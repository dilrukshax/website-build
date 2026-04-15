'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';

export default function ContactV6({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Talk to the Growth Team';
    const subtitle = (content.subtitle as string) || 'Contact';
    const submitText = (content.ctaText as string) || 'Send Request';
    const showForm = (content.showForm as boolean) !== false;

    const {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        phone,
        setPhone,
        message,
        setMessage,
        status,
        errorMessage,
        submit,
    } = useContactInquiryForm(context);

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
            {status === 'success' ? <div style={{ color: '#16a34a', fontSize: '13px' }}>Inquiry submitted successfully.</div> : null}
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box' }} />
            <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: `1px solid ${inputBorder}`, boxSizing: 'border-box', resize: 'vertical' }} />
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
                {status === 'loading' ? 'Submitting...' : submitText}
            </button>
        </form>
    );

    return (
        <section id="contact" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
                    <h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(28px, 5vw, 42px)' }}>{title}</h2>
                    <p style={{ margin: '8px 0 0 0', color: muted }}>
                        Share your goals and current funnel blockers. We will reply with a practical action path.
                    </p>
                </div>
                {showForm ? formBlock : null}
            </div>
        </section>
    );
}
