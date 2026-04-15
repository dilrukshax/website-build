import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'The Matrix of Innovation';
    const body = content.body as string || 'Forged in the future. We combine advanced data models with deep aesthetic considerations to build tools that feel like magic.';
    const imageUrl = content.imageUrl as string || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ backgroundColor: '#0f172a', padding: 'clamp(72px, 11vw, 120px) 16px', fontFamily: tokens.font, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: tokens.primary, filter: 'blur(150px)', opacity: 0.2, zIndex: 0 }} />
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: 'clamp(22px, 6vw, 56px)', flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: '1 1 320px', order: 2 }}>
                    <div style={{ display: 'inline-block', padding: '8px 16px', background: `rgba(255,255,255,0.05)`, border: `1px solid ${tokens.primary}40`, borderRadius: '100px', color: tokens.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                        Information
                    </div>
                    <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 800, color: '#fff', marginBottom: '26px', textShadow: `0 0 20px ${tokens.primary}80` }}>
                        {title}
                    </h2>
                    <p style={{ fontSize: 'clamp(15px, 3.8vw, 18px)', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>
                        {body}
                    </p>
                </div>
                <div style={{ flex: '1 1 320px', order: 1 }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', transform: 'rotate(2deg)' }}>
                        <img src={imageUrl} alt="About Us" style={{ width: '100%', borderRadius: '16px', transform: 'rotate(-2deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                    </div>
                </div>
            </div>
        </section>
    );
}
