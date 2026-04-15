import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TestimonialsV4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Words of Distinction';
    const subtitle = content.subtitle as string || 'Reflections from our esteemed clientele';
    const testimonials = (content.testimonials as { quote: string, author: string, role: string }[]) || [
        { quote: "An experience defined by understated elegance and absolute perfection.", author: "Lord Archibald", role: "Patron" },
        { quote: "There is no substitute for the level of care and sophistication provided here.", author: "Lady Beatrice", role: "Collector" },
    ];

    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 10vw, 120px)' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '0.24em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '18px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.05em', margin: 0 }}>
                        {title}
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 7vw, 72px)' }}>
                    {testimonials.map((testimonial, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: 'clamp(18px, 6vw, 60px)',
                            borderTop: `1px solid ${tokens.primary}20`,
                            borderBottom: i === testimonials.length - 1 ? `1px solid ${tokens.primary}20` : 'none',
                        }}>
                            <span style={{ fontSize: 'clamp(40px, 10vw, 60px)', color: tokens.primary, lineHeight: 0.5, opacity: 0.5, fontFamily: tokens.font }}>
                                "
                            </span>
                            <p style={{ fontSize: 'clamp(16px, 4.4vw, 24px)', color: '#1a1a1a', lineHeight: 1.8, fontStyle: 'italic', fontWeight: 300, maxWidth: '800px', margin: 'clamp(16px, 5vw, 40px) 0' }}>
                                {testimonial.quote}
                            </p>
                            <h4 style={{ fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 400, color: '#1a1a1a', letterSpacing: '0.08em', marginBottom: '8px' }}>{testimonial.author}</h4>
                            <p style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#666', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{testimonial.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
