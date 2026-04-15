import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function GalleryV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Gallery';
    const subtitle = content.subtitle as string || 'A glimpse into our world';
    const images = (content.images as string[]) || [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1542314831-c6a4203251ab?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&q=80&w=800'
    ];

    return (
        <section style={{ backgroundColor: tokens.background, padding: '100px 24px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, color: tokens.text, marginBottom: '16px' }}>{title}</h2>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>{subtitle}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {images.map((src, i) => (
                        <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', aspectRatio: '4/3' }}>
                            <img src={src} alt={`Gallery image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
