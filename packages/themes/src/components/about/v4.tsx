import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'A Legacy of Excellence';
    const body = content.body as string || 'Since our inception, we have been guided by one unwavering principle: perfection in every detail. Discover the heritage and craftsmanship that define our unique approach.';
    const imageUrl = content.imageUrl as string || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ backgroundColor: '#ffffff', padding: 'clamp(78px, 12vw, 160px) clamp(16px, 4vw, 32px)', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.3em', color: tokens.primary, marginBottom: '32px', display: 'block' }}>
                    Our Heritage
                </span>
                <h2 style={{ fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 400, color: '#1a1a1a', marginBottom: 'clamp(32px, 8vw, 64px)', lineHeight: 1.3 }}>
                    {title}
                </h2>
                <div style={{ width: '1px', height: 'clamp(52px, 12vw, 100px)', backgroundColor: tokens.primary, margin: '0 auto clamp(28px, 7vw, 64px) auto' }} />
                <p style={{ fontSize: 'clamp(15px, 3.8vw, 20px)', lineHeight: 1.9, color: '#4a4a4a', fontWeight: 300, maxWidth: '700px', margin: '0 auto clamp(32px, 8vw, 80px) auto' }}>
                    {body}
                </p>
                <div style={{ padding: '24px', border: `1px solid ${tokens.primary}40`, backgroundColor: '#fafafa' }}>
                    <img src={imageUrl} alt="Heritage" style={{ width: '100%', height: 'clamp(260px, 48vw, 500px)', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2)' }} />
                </div>
            </div>
        </section>
    );
}
