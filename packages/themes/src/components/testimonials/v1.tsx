import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TestimonialsV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'What People Say';
    const subtitle = content.subtitle as string || 'Don\'t just take our word for it';
    const testimonials = (content.testimonials as { quote: string, author: string, role: string }[]) || [
        { quote: "The best experience I've ever had. Truly exceptional from start to finish.", author: "Jane Doe", role: "Design Director" },
        { quote: "Minimal, clean, and blazingly fast. It changed the way we work entirely.", author: "John Smith", role: "Software Engineer" },
        { quote: "Unparalleled attention to detail and a seamless straightforward user journey.", author: "Emily Rose", role: "Product Manager" },
    ];

    return (
        <section style={{ backgroundColor: '#f9fafb', padding: '120px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, color: tokens.text, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
                    {testimonials.map((testimonial, i) => (
                        <div key={i} style={{ backgroundColor: tokens.background, padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ color: tokens.primary, fontSize: '48px', lineHeight: 1, height: '32px', marginBottom: '16px' }}>"</div>
                            <p style={{ fontSize: '18px', color: tokens.text, lineHeight: 1.6, marginBottom: '32px', fontStyle: 'italic' }}>
                                {testimonial.quote}
                            </p>
                            <div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: tokens.text, marginBottom: '4px' }}>{testimonial.author}</h4>
                                <p style={{ fontSize: '14px', color: '#6b7280' }}>{testimonial.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
