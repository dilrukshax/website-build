import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getReadableTextColor } from '../shared/color-contrast';

export default function GalleryV3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Insta-Vibes';
    const subtitle = content.subtitle as string || 'Catch a glimpse of the fun!';
    const images = (content.images as string[]) || [
        'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800'
    ];
    const textOnSectionSurface = getReadableTextColor(tokens.secondary, tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const textOnAccent = getReadableTextColor(tokens.accent, '#ffffff', 4.5);

    return (
        <section style={{ backgroundColor: tokens.secondary, padding: '120px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '64px', fontWeight: 900, color: textOnSectionSurface, letterSpacing: '-2px', transform: 'rotate(-2deg)', display: 'inline-block' }}>{title}</h2>
                    <br />
                    <span style={{ fontSize: '20px', fontWeight: 800, color: textOnAccent, backgroundColor: tokens.accent, padding: '8px 24px', borderRadius: '40px', display: 'inline-block', transform: 'rotate(2deg)', marginTop: '8px' }}>{subtitle}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
                    {images.map((src, i) => (
                        <div key={i} style={{ 
                            width: '300px',
                            height: '400px',
                            backgroundColor: '#fff', 
                            padding: '16px', 
                            paddingBottom: '64px',
                            borderRadius: '16px', 
                            border: `4px solid ${textOnWhiteSurface}`,
                            boxShadow: `12px 12px 0 ${tokens.primary}`,
                            transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            transform: `rotate(${i % 2 === 0 ? '-6deg' : '4deg'})`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = `rotate(0deg) scale(1.1) translateY(-10px)`;
                            e.currentTarget.style.boxShadow = `16px 16px 0 ${tokens.accent}`;
                            e.currentTarget.style.zIndex = '10';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-6deg' : '4deg'}) scale(1) translateY(0)`;
                            e.currentTarget.style.boxShadow = `12px 12px 0 ${tokens.primary}`;
                            e.currentTarget.style.zIndex = '1';
                        }}>
                            <img src={src} alt={`Polaroid ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${textOnWhiteSurface}` }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
