import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getReadableTextColor } from '../shared/color-contrast';

export default function TeamV3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'The Dream Team';
    const subtitle = content.subtitle as string || 'Meet the faces behind the magic';
    const teamMembers = (content.teamMembers as { name: string, role: string, image: string }[]) || [
        { name: 'Leo Spark', role: 'Chief Joy Officer', image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=600' },
        { name: 'Mia Bubbles', role: 'Head of Fun', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600' },
        { name: 'Sammy Sun', role: 'Vibe Manager', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=600' },
    ];
    const textOnSectionSurface = getReadableTextColor(tokens.secondary, tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);

    return (
        <section style={{ backgroundColor: tokens.secondary, padding: '140px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '100px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%) rotate(-5deg)', width: '300px', height: '100px', backgroundColor: tokens.primary, borderRadius: '50px', zIndex: 0, opacity: 0.1 }} />
                    <h2 style={{ fontSize: '64px', fontWeight: 900, color: textOnSectionSurface, position: 'relative', zIndex: 1, letterSpacing: '-2px', transform: 'rotate(-2deg)' }}>{title}</h2>
                    <p style={{ fontSize: '24px', color: tokens.primary, fontWeight: 800, marginTop: '16px' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'center' }}>
                    {teamMembers.map((member, i) => (
                        <div key={i} style={{ 
                            flex: '1 1 300px',
                            backgroundColor: '#fff', 
                            borderRadius: '100px', 
                            padding: '32px',
                            border: `6px solid ${textOnWhiteSurface}`,
                            boxShadow: `12px 12px 0 ${tokens.accent}`,
                            textAlign: 'center',
                            transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            transform: `rotate(${i % 2 === 0 ? '-3deg' : '3deg'})`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = `rotate(0deg) translateY(-20px) scale(1.05)`;
                            e.currentTarget.style.boxShadow = `16px 16px 0 ${tokens.primary}`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-3deg' : '3deg'}) translateY(0) scale(1)`;
                            e.currentTarget.style.boxShadow = `12px 12px 0 ${tokens.accent}`;
                        }}>
                            <img src={member.image} alt={member.name} style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '24px', border: `4px dashed ${tokens.primary}` }} />
                            <h3 style={{ fontSize: '28px', fontWeight: 900, color: textOnWhiteSurface, marginBottom: '8px', letterSpacing: '-1px' }}>{member.name}</h3>
                            <p style={{ fontSize: '18px', color: '#4b5563', fontWeight: 700, backgroundColor: tokens.secondary, display: 'inline-block', padding: '6px 16px', borderRadius: '40px' }}>{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
