import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function ContactV1({ content, styles, tokens }: ThemeComponentProps) {
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: tokens.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>Send a Message</h3>
                                <input type="text" placeholder="Your Name" style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.backgroundColor = '#fff'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; }} />
                                <input type="email" placeholder="Your Email" style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.backgroundColor = '#fff'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; }} />
                                <textarea placeholder="Your Message" rows={5} style={{ padding: '16px 20px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f9fafb', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.backgroundColor = '#fff'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; }} />
                                <button style={{ padding: '16px 32px', backgroundColor: tokens.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}>
                                    Send Message
                                </button>
                            </div>
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
