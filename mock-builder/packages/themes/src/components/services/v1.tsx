import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface ServiceItem {
    name: string;
    description?: string;
    price?: string;
    duration?: string;
    imageUrl?: string;
}

export default function ServicesV1({ content, styles, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Our Services';
    const subtitle = content.subtitle as string;
    const ctaText = content.ctaText as string;
    const ctaLink = content.ctaLink as string;
    const services = (content.services as ServiceItem[]) || [];
    const showPrice = styles.showPrice !== false;
    const showDuration = styles.showDuration !== false;

    return (
        <section style={{ padding: '96px 24px', backgroundColor: '#f9fafb', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '800px', marginInline: 'auto' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: tokens.text, marginBottom: '16px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '20px', color: '#4b5563', lineHeight: 1.6 }}>{subtitle}</p>}
                    {ctaText && ctaLink && (
                        <div style={{ marginTop: '32px' }}>
                            <a 
                                href={ctaLink} 
                                style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: tokens.primary, color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`, gap: '32px' }}>
                    {services.length > 0 ? services.map((svc, i) => (
                        <div 
                            key={i} 
                            style={{ 
                                backgroundColor: tokens.background, 
                                borderRadius: '16px', 
                                overflow: 'hidden', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                transition: 'all 0.3s ease',
                                border: '1px solid #f3f4f6',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                e.currentTarget.style.borderColor = tokens.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                e.currentTarget.style.borderColor = '#f3f4f6';
                            }}
                        >
                            {svc.imageUrl && (
                                <img src={svc.imageUrl} alt={svc.name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                            )}
                            <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: 700, color: tokens.text, marginBottom: '12px', lineHeight: 1.3 }}>{svc.name}</h3>
                                {svc.description && <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.6, flex: 1 }}>{svc.description}</p>}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                    {showPrice && svc.price && <span style={{ fontSize: '20px', fontWeight: 800, color: tokens.primary }}>{svc.price}</span>}
                                    {showDuration && svc.duration && <span style={{ fontSize: '15px', fontWeight: 500, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: 'full' }}>{svc.duration}</span>}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: `1 / -1`, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                            Add services to display them here
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
