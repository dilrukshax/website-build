import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function TeamV2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'The Operators';
    const subtitle = content.subtitle as string || 'Engineers of the matrix';
    const teamMembers = (content.teamMembers as { name: string, role: string, image: string }[]) || [
        { name: 'Elena Rostova', role: 'Architect', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
        { name: 'Dr. Marcus Webb', role: 'Data Science', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600' },
        { name: 'Sarah Chen', role: 'Cyber Lead', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600' },
    ];

    return (
        <section style={{ backgroundColor: '#0f172a', padding: 'clamp(72px, 11vw, 120px) 16px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(30px, 8vw, 80px)' }}>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 900, color: '#fff', textShadow: `0 0 10px ${tokens.primary}80`, marginBottom: '16px', letterSpacing: '2px' }}>{title}</h2>
                    <p style={{ fontSize: 'clamp(13px, 3.4vw, 16px)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 4vw, 32px)', justifyContent: 'center' }}>
                    {teamMembers.map((member, i) => (
                        <div key={i} style={{ 
                            flex: '1 1 260px',
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            borderRadius: '16px', 
                            overflow: 'hidden',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = tokens.accent;
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = `0 20px 40px -10px ${tokens.primary}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1/1' }}>
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #0f172a, transparent)`, zIndex: 1 }} />
                                <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(50%) contrast(1.2)' }} />
                            </div>
                            <div style={{ padding: 'clamp(16px, 4vw, 24px)', position: 'relative', zIndex: 2, marginTop: 'clamp(-42px, -9vw, -60px)' }}>
                                <h3 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{member.name}</h3>
                                <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: tokens.primary, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
