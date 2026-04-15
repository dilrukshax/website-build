'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';

export default function ContactV5({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Contact Us';
    const subtitle = (content.subtitle as string) || 'Signal Horizon v5';
    const submitText = (content.ctaText as string) || 'Send Message';

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
            {status === 'success' ? <div style={{ color: '#16a34a', fontSize: '13px' }}>Inquiry submitted successfully.</div> : null}
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical' }} />
            <button type="submit" disabled={status === 'loading'} style={{ minHeight: '44px', borderRadius: '10px', border: 'none', background: tokens.primary, color: '#fff', fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
                {status === 'loading' ? 'Submitting...' : submitText}
            </button>
        </form>
    );

    return (
        <section id="contact" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'grid', gap: '12px', gridTemplateColumns: '0.9fr 1.1fr' }}>
        <article><h2 style={{ margin: 0, color: titleColor }}>{title}</h2><p style={{ margin: '8px 0 0 0', color: muted }}>{subtitle}</p></article>
        {formBlock}
    </div>

        </section>
    );
}
