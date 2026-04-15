import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TeamV4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Our Guild';
    const subtitle = content.subtitle as string || 'Masters of their respective crafts';
    const teamMembers = (content.teamMembers as { name: string, role: string, image: string }[]) || [
        { name: 'Julian Vance', role: 'Managing Partner', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600' },
        { name: 'Victoria Sterling', role: 'Creative Director', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600' },
        { name: 'Arthur Penhaligon', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600' },
    ];

    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 9vw, 100px)' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '0.24em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '18px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.02em', margin: 0 }}>
                        {title}
                    </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(16px, 5vw, 52px)' }}>
                    {teamMembers.map((member, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: 'clamp(18px, 5vw, 40px)', border: `1px solid ${tokens.primary}20` }}>
                                <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(80%)', transition: 'filter 1s ease, transform 10s ease' }} 
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.filter = 'grayscale(0%)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.filter = 'grayscale(80%)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}/>
                            </div>
                            <h3 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 400, color: '#1a1a1a', marginBottom: '10px', letterSpacing: '0.05em', textAlign: 'center' }}>{member.name}</h3>
                            <div style={{ width: '30px', height: '1px', backgroundColor: tokens.primary, margin: '0 auto 16px auto' }} />
                            <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#666', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
