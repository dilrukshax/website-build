import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TestimonialsV2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Data Points';
    const subtitle = content.subtitle as string || 'Verified user experiences encoded as truth';
    const testimonials = (content.testimonials as { quote: string, author: string, role: string }[]) || [
        { quote: "System efficiency improved by 400%. The interface is flawlessly intuitive and the backend is robust.", author: "X Æ A-12", role: "AI Operator" },
        { quote: "A masterpiece of digital architecture. The integration was seamless across all vectors.", author: "Neo", role: "Systems Architect" },
        { quote: "Breathtaking design language. It pulls you in and doesn't let go.", author: "Trinity", role: "UX lead" },
    ];

    return (
        <section style={{ backgroundColor: '#020617', padding: 'clamp(72px, 11vw, 140px) 16px', fontFamily: tokens.font, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: `radial-gradient(circle, ${tokens.primary}20, transparent)`, filter: 'blur(100px)', zIndex: 0 }} />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 900, color: '#fff', textShadow: `0 0 10px ${tokens.primary}`, marginBottom: '16px', letterSpacing: 'clamp(1px, 0.7vw, 4px)' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(13px, 3.3vw, 16px)', color: tokens.primary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(14px, 4vw, 30px)' }}>
                    {testimonials.map((testimonial, i) => (
                        <div key={i} style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            backdropFilter: 'blur(20px)', 
                            border: `1px solid ${tokens.primary}40`, 
                            borderRadius: '24px', 
                            padding: 'clamp(18px, 5vw, 40px)',
                            transition: 'all 0.4s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = tokens.accent;
                            e.currentTarget.style.transform = 'translateY(-12px)';
                            e.currentTarget.style.boxShadow = `0 20px 40px -10px ${tokens.primary}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${tokens.primary}40`;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${tokens.primary}30`, border: `2px solid ${tokens.accent}` }} />
                                <div>
                                    <h4 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 800, color: '#fff' }}>{testimonial.author}</h4>
                                    <p style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', color: tokens.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{testimonial.role}</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontStyle: 'italic', fontWeight: 300 }}>
                                "{testimonial.quote}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
