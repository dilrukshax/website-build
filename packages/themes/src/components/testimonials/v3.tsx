import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TestimonialsV3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Loud & Proud';
    const subtitle = content.subtitle as string || 'Hear from our lovely fans!';
    const testimonials = (content.testimonials as { quote: string, author: string, role: string }[]) || [
        { quote: "OMG! I can't believe how fun and simple this is! It's like a game but it's real life!", author: "Samantha Joy", role: "Super Fan" },
        { quote: "Every time I use this platform, I have a huge smile on my face. Highly highly recommend to everyone.", author: "Marcus Light", role: "Adventurer" },
        { quote: "Vibrant, cool, and works perfectly. The best choice I made all year.", author: "Kelly Sunshine", role: "Photographer" },
    ];

    return (
        <section style={{ backgroundColor: tokens.background, padding: '120px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '56px', fontWeight: 900, color: tokens.text, letterSpacing: '-2px', textShadow: `4px 4px 0 ${tokens.secondary}`, transform: 'rotate(-2deg)' }}>{title}</h2>
                    <br />
                    <span style={{ fontSize: '24px', color: tokens.primary, fontWeight: 800, transform: 'rotate(2deg)', display: 'inline-block', marginTop: '16px' }}>{subtitle}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
                    {testimonials.map((testimonial, i) => (
                        <div key={i} style={{ 
                            flex: '1 1 300px',
                            backgroundColor: tokens.secondary,
                            padding: '40px',
                            borderRadius: '40px', 
                            border: `6px solid ${tokens.text}`,
                            boxShadow: `12px 12px 0 ${tokens.text}`,
                            position: 'relative',
                            transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            transform: `rotate(${i % 2 === 0 ? '-2deg' : '4deg'})`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = `rotate(0deg) scale(1.05) translateY(-10px)`;
                            e.currentTarget.style.boxShadow = `16px 16px 0 ${tokens.primary}`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-2deg' : '4deg'}) scale(1) translateY(0)`;
                            e.currentTarget.style.boxShadow = `12px 12px 0 ${tokens.text}`;
                        }}>
                            <div style={{ position: 'absolute', top: '-24px', left: '32px', fontSize: '64px', fontWeight: 900, color: tokens.accent, lineHeight: 1 }}>"</div>
                            <p style={{ fontSize: '20px', color: tokens.text, lineHeight: 1.6, fontWeight: 700, marginBottom: '32px', marginTop: '16px' }}>
                                {testimonial.quote}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: tokens.primary, border: `4px solid ${tokens.text}` }} />
                                <div>
                                    <h4 style={{ fontSize: '22px', fontWeight: 900, color: tokens.text, marginBottom: '4px' }}>{testimonial.author}</h4>
                                    <p style={{ fontSize: '16px', color: '#4b5563', fontWeight: 800 }}>{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
