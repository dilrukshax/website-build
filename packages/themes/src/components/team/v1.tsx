import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TeamV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Meet Our Team';
    const subtitle = content.subtitle as string || 'The people who make it happen';
    const teamMembers = (content.teamMembers as { name: string, role: string, image: string }[]) || [
        { name: 'Alice Smith', role: 'CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600' },
        { name: 'Bob Johnson', role: 'CTO', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600' },
        { name: 'Charlie Lee', role: 'Design Lead', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600' },
    ];

    return (
        <section style={{ backgroundColor: tokens.background, padding: 'clamp(72px, 12vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, color: tokens.text, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(15px, 3.5vw, 18px)', color: '#6b7280' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(16px, 5vw, 36px)' }}>
                    {teamMembers.map((member, i) => (
                        <div key={i} style={{ textAlign: 'center', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <img src={member.image} alt={member.name} style={{ width: 'clamp(120px, 28vw, 160px)', height: 'clamp(120px, 28vw, 160px)', borderRadius: '50%', objectFit: 'cover', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>{member.name}</h3>
                            <p style={{ fontSize: '16px', color: tokens.primary, fontWeight: 500 }}>{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
