import React from 'react';
import type { ThemeComponentProps } from '../../types';

const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=800',
];

export default function GalleryV4({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'The Collection';
    const subtitle = content.subtitle as string || 'Curated Moments of Distinction';
    const configuredImages = Array.isArray(content.images)
        ? content.images
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];
    const images = (configuredImages.length > 0 ? configuredImages : DEFAULT_IMAGES).slice(0, 8);

    return (
        <section style={{ backgroundColor: '#ffffff', padding: '160px 40px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '100px' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '0.4em', color: tokens.primary, textTransform: 'uppercase', display: 'block', marginBottom: '32px' }}>
                        {subtitle}
                    </span>
                    <h2 style={{ fontSize: '48px', fontWeight: 300, color: '#1a1a1a', letterSpacing: '0.05em', margin: 0 }}>
                        {title}
                    </h2>
                    <div style={{ width: '1px', height: '60px', backgroundColor: tokens.primary, margin: '40px auto 0 auto' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', alignItems: 'center' }}>
                    {images.map((src, i) => (
                        <div key={i} style={{ 
                            width: '100%', 
                            maxWidth: i % 2 === 0 ? '1000px' : '800px',
                            marginLeft: i % 2 !== 0 ? '20%' : '0',
                            marginRight: i % 2 !== 0 ? '0' : '10%',
                            position: 'relative'
                        }}>
                            <div style={{ position: 'absolute', top: -20, left: -20, width: '100px', height: '100px', borderTop: `1px solid ${tokens.primary}`, borderLeft: `1px solid ${tokens.primary}` }} />
                            <div style={{ position: 'absolute', bottom: -20, right: -20, width: '100px', height: '100px', borderBottom: `1px solid ${tokens.primary}`, borderRight: `1px solid ${tokens.primary}` }} />
                            <img src={src} alt={`Exhibit ${i + 1}`} style={{ 
                                width: '100%', 
                                height: 'auto', 
                                aspectRatio: '16/9',
                                objectFit: 'cover',
                                filter: 'grayscale(30%)',
                                transition: 'filter 1.5s ease'
                            }}
                            onError={(event) => {
                                const imageElement = event.currentTarget;
                                if (imageElement.dataset.fallbackApplied === '1') {
                                    imageElement.style.display = 'none';
                                    return;
                                }

                                imageElement.dataset.fallbackApplied = '1';
                                imageElement.src = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]!;
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = 'grayscale(0%)'}
                            onMouseLeave={(e) => e.currentTarget.style.filter = 'grayscale(30%)'} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
