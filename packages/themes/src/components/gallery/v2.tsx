import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function GalleryV2({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Visual Data Space';
    const subtitle = content.subtitle as string || 'Exploration through digital lenses';
    const images = (content.images as string[]) || [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800'
    ];

    return (
        <section style={{ backgroundColor: '#020617', padding: '120px 24px', fontFamily: tokens.font, position: 'relative' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px', flexWrap: 'wrap', gap: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', textShadow: `0 0 15px ${tokens.primary}60`, marginBottom: '16px' }}>{title}</h2>
                        <p style={{ fontSize: '16px', color: tokens.primary, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{subtitle}</p>
                    </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {images.map((src, i) => (
                        <div key={i} style={{ 
                            position: 'relative', 
                            borderRadius: '24px', 
                            padding: '16px',
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${tokens.primary}30`,
                            transition: 'all 0.4s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.borderColor = tokens.accent;
                            e.currentTarget.style.boxShadow = `0 20px 40px -10px ${tokens.primary}50`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = `${tokens.primary}30`;
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <img src={src} alt={`Gallery ${i}`} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px', filter: 'contrast(1.2)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
