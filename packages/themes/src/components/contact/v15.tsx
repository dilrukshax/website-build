'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { useContactInquiryForm } from '../shared/public-web';

export default function ContactV15({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'stay in touch';
    const subtitle = (content.subtitle as string) || 'If a post resonates, send me a note.';
    const email = (content.email as string) || 'hello@trainofthought.example';
    const phone = (content.phone as string) || '+1 (800) 555-1049';
    const buttonText = (content.ctaText as string) || 'Send Message';

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
        <section
            style={{
                background: '#f2f1ec',
                padding: 'clamp(60px, 9vw, 102px) 16px',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'clamp(20px, 4vw, 52px)',
                    alignItems: 'start',
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            color: '#67645d',
                            fontSize: '12px',
                            letterSpacing: '0.13em',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                        }}
                    >
                        Contact
                    </p>
                    <h2
                        style={{
                            margin: '12px 0 0',
                            color: '#191919',
                            textTransform: 'lowercase',
                            fontSize: 'clamp(34px, 5.8vw, 58px)',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h2>
                    <p style={{ margin: '16px 0 0', color: '#4f4c45', fontSize: '16px', lineHeight: 1.8 }}>{subtitle}</p>

                    <div style={{ marginTop: '24px', display: 'grid', gap: '10px' }}>
                        <a href={`mailto:${email}`} style={{ color: '#1c1c1c', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>{email}</a>
                        <a href={`tel:${phone}`} style={{ color: '#1c1c1c', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>{phone}</a>
                    </div>
                </div>

                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        await submit();
                    }}
                    style={{
                        background: '#fdfcf9',
                        border: '1px solid #d8d5cb',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'grid',
                        gap: '12px',
                    }}
                >
                    {status === 'error' && (
                        <div style={{ borderRadius: '10px', padding: '10px 12px', backgroundColor: '#fde8e8', color: '#991b1b', fontWeight: 600, fontSize: '13px' }}>
                            {errorMessage}
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ borderRadius: '10px', padding: '10px 12px', backgroundColor: '#e7f7ec', color: '#166534', fontWeight: 600, fontSize: '13px' }}>
                            Message received. Thank you for writing.
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                            placeholder="First name"
                            style={inputStyle}
                        />
                        <input
                            type="text"
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                            placeholder="Last name"
                            style={inputStyle}
                        />
                    </div>

                    <input
                        type="email"
                        value={formEmail}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email address"
                        style={inputStyle}
                    />

                    <input
                        type="text"
                        value={formPhone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Phone (optional)"
                        style={inputStyle}
                    />

                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Your message"
                        rows={5}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            marginTop: '4px',
                            border: 'none',
                            borderRadius: '999px',
                            background: '#111111',
                            color: '#f8f8f8',
                            padding: '12px 18px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.72 : 1,
                        }}
                    >
                        {isSubmitting ? 'Sending...' : buttonText}
                    </button>
                </form>
            </div>
        </section>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '10px',
    border: '1px solid #d7d4ca',
    background: '#ffffff',
    padding: '11px 12px',
    fontSize: '14px',
    color: '#191919',
    fontFamily: 'inherit',
};
