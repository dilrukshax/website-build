import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Why us?';
    const body = content.body as string || 'Our mission is to bring joy and color to everything we do! From the moment you join us, you will feel the energy, passion, and excitement we pour into our work.';
    const imageUrl = content.imageUrl as string || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ backgroundColor: tokens.secondary, padding: '140px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '100px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 450px', zIndex: 1 }}>
                    <h2 style={{ fontSize: '64px', fontWeight: 900, color: tokens.text, marginBottom: '32px', letterSpacing: '-2px', transform: 'rotate(-2deg)' }}>
                        {title}
                    </h2>
                    <p style={{ fontSize: '22px', lineHeight: 1.6, color: '#4b5563', fontWeight: 600, backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: `8px 8px 0 ${tokens.primary}` }}>
                        {body}
                    </p>
                </div>
                <div style={{ flex: '1 1 500px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '30px', left: '30px', width: '100%', height: '100%', backgroundColor: tokens.accent, borderRadius: '100px', zIndex: 0 }} />
                    <img src={imageUrl} alt="About Us" style={{ width: '100%', borderRadius: '100px', outline: `8px solid ${tokens.background}`, position: 'relative', zIndex: 1, objectFit: 'cover', aspectRatio: '4/3' }} />
                </div>
            </div>
        </section>
    );
}
