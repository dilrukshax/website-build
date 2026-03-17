import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

export default function GalleryV1({ content, styles, tokens }: ThemeComponentProps) {
    const title = content.title as string;
    const images = (content.images as GalleryImage[]) || [];
    const columns = (styles.columns as number) || 3;

    return (
        <section style={{ padding: '80px 24px', backgroundColor: tokens.background, fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {title && (
                    <h2 style={{ fontSize: '36px', fontWeight: 700, color: tokens.text, textAlign: 'center', marginBottom: '48px' }}>
                        {title}
                    </h2>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)`, gap: '16px' }}>
                    {images.length > 0 ? images.map((img, i) => (
                        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', position: 'relative', aspectRatio: '1' }}>
                            <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {img.caption && (
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff', fontSize: '14px' }}>
                                    {img.caption}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#9ca3af', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                            Add images to your gallery
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
