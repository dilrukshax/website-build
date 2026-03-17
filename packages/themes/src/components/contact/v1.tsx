'use client';

import React, { FormEvent, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function isPreviewRuntime(): boolean {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
}

function buildWebApiUrl(path: string): string {
    return isPreviewRuntime() ? `${API_BASE_URL}${path}` : path;
}

function buildLegacyPreviewHeaders(
    context?: ThemeComponentProps['context'],
    options?: { isEditor?: boolean },
): HeadersInit | undefined {
    if (!context?.tenantId || !context?.instanceId) {
        return undefined;
    }

    if (!isPreviewRuntime() && !options?.isEditor) {
        return undefined;
    }

    return {
        'x-tenant-id': context.tenantId,
        'x-instance-id': context.instanceId,
    };
}

function normalizePageSlug(input?: string): string | undefined {
    if (!input) return undefined;
    let slug = input.trim();
    if (!slug) return undefined;
    if (!slug.startsWith('/')) slug = `/${slug}`;
    slug = slug.replace(/\/+$/, '').toLowerCase();
    return slug || '/';
}

export default function ContactV1({ content, styles, tokens, context, isEditor }: ThemeComponentProps) {
    const title = content.title as string || 'Contact Us';
    const subtitle = content.subtitle as string;
    const address = content.address as string;
    const phone = content.phone as string;
    const email = content.email as string;
    const showForm = content.showForm !== false;
    const mapEmbedUrl = content.mapEmbedUrl as string;
    const showMap = styles.showMap !== false;
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string;

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isEditor) {
            setStatus('error');
            setErrorMessage('Form submissions are disabled in builder preview.');
            return;
        }

        if (isPreviewRuntime() && (!context?.tenantId || !context?.instanceId)) {
            setStatus('error');
            setErrorMessage('Unable to submit inquiry at this time.');
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !contactEmail.trim() || !message.trim()) {
            setStatus('error');
            setErrorMessage('Please fill out first name, last name, email, and message.');
            return;
        }

        setStatus('submitting');
        setErrorMessage('');

        const inferredSlug = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const sourcePageSlug = normalizePageSlug(context?.pageSlug || inferredSlug);

        try {
            const previewHeaders = buildLegacyPreviewHeaders(context, { isEditor });
            const response = await fetch(buildWebApiUrl('/web/inquiries'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(previewHeaders || {}),
                },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: contactEmail.trim().toLowerCase(),
                    phone: contactPhone.trim() || undefined,
                    message: message.trim(),
                    sourceType: 'contact_form',
                    sourcePageSlug,
                }),
            });

            const payload = await response.json() as {
                success?: boolean;
                error?: { message?: string };
            };

            if (response.ok && payload.success) {
                setStatus('success');
                setFirstName('');
                setLastName('');
                setContactEmail('');
                setContactPhone('');
                setMessage('');
                return;
            }

            setStatus('error');
            setErrorMessage(payload.error?.message || 'Failed to submit inquiry. Please try again.');
        } catch {
            setStatus('error');
            setErrorMessage('Failed to submit inquiry. Please try again.');
        }
    }

    return (
        <section style={{ padding: '96px 24px', backgroundColor: tokens.background, fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '800px', marginInline: 'auto' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: tokens.text, marginBottom: '16px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '20px', color: '#4b5563', lineHeight: 1.6 }}>{subtitle}</p>}
                </div>
                <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {address && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', backgroundColor: tokens.primary + '1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.primary, flexShrink: 0, fontSize: '24px' }}>📍</div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>Visit Us</h3>
                                        <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: 1.6 }}>{address}</p>
                                    </div>
                                </div>
                            )}
                            {phone && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', backgroundColor: tokens.primary + '1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.primary, flexShrink: 0, fontSize: '24px' }}>📞</div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>Call Us</h3>
                                        <a href={`tel:${phone}`} style={{ color: tokens.primary, fontSize: '16px', textDecoration: 'none', fontWeight: 500 }}>{phone}</a>
                                    </div>
                                </div>
                            )}
                            {email && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', backgroundColor: tokens.primary + '1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.primary, flexShrink: 0, fontSize: '24px' }}>✉️</div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>Email Us</h3>
                                        <a href={`mailto:${email}`} style={{ color: tokens.primary, fontSize: '16px', textDecoration: 'none', fontWeight: 500 }}>{email}</a>
                                    </div>
                                </div>
                            )}
                            {!address && !phone && !email && (
                                <p style={{ color: '#9ca3af', fontSize: '16px' }}>Add your contact information</p>
                            )}
                        </div>
                        {showMap && mapEmbedUrl && (
                            <div style={{ marginTop: '48px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                                <iframe src={mapEmbedUrl} width="100%" height="300" style={{ border: 0 }} loading="lazy" title="Location map" />
                            </div>
                        )}
                    </div>
                    {showForm && (
                        <div style={{ flex: 1, minWidth: '340px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: tokens.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>Send a Message</h3>
                                {status === 'success' && (
                                    <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '14px' }}>
                                        Inquiry submitted successfully. We will contact you soon.
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '14px' }}>
                                        {errorMessage}
                                    </div>
                                )}
                                {isEditor && (
                                    <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '13px' }}>
                                        Preview mode: form submissions are disabled in the builder.
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        style={{ flex: 1, minWidth: '150px', padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        style={{ flex: 1, minWidth: '150px', padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none' }}
                                    />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none' }}
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone (Optional)"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none' }}
                                />
                                <textarea
                                    placeholder="Your Message"
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', resize: 'vertical', outline: 'none' }}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'submitting' || isEditor}
                                    style={{
                                        padding: '16px 32px',
                                        backgroundColor: tokens.primary,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        cursor: status === 'submitting' || isEditor ? 'not-allowed' : 'pointer',
                                        opacity: status === 'submitting' || isEditor ? 0.7 : 1,
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    {status === 'submitting' ? 'Sending...' : isEditor ? 'Preview Mode' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
                {ctaText && ctaLink && (
                    <div style={{ textAlign: 'center', marginTop: '48px' }}>
                        <a
                            href={ctaLink}
                            style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: tokens.primary, color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '15px', transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {ctaText}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
