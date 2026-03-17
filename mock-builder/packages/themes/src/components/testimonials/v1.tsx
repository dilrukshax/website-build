import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface Testimonial {
    name: string;
    role?: string;
    text: string;
    avatarUrl?: string;
    rating?: number;
}

export default function TestimonialsV1({ content, styles, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'What Our Clients Say';
    const testimonials = (content.testimonials as Testimonial[]) || [];
    const showRating = styles.showRating !== false;

    return (
        <section style={{ padding: '80px 24px', backgroundColor: '#f9fafb', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 700, color: tokens.text, textAlign: 'center', marginBottom: '48px' }}>
                    {title}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {testimonials.length > 0 ? testimonials.map((t, i) => (
                        <div key={i} style={{ backgroundColor: tokens.background, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            {showRating && t.rating && (
                                <div style={{ marginBottom: '12px', color: '#f59e0b', fontSize: '18px' }}>
                                    {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                                </div>
                            )}
                            <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>
                                &ldquo;{t.text}&rdquo;
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {t.avatarUrl ? (
                                    <img src={t.avatarUrl} alt={t.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: tokens.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '16px' }}>
                                        {t.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontWeight: 600, color: tokens.text, fontSize: '14px' }}>{t.name}</div>
                                    {t.role && <div style={{ fontSize: '13px', color: '#9ca3af' }}>{t.role}</div>}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                            Add testimonials to display them here
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
