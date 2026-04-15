'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

function normalizeImages(content: Record<string, unknown>): string[] {
    if (Array.isArray(content.images) && content.images.length > 0) {
        const list = content.images
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    const record = item as Record<string, unknown>;
                    if (typeof record.url === 'string') return record.url;
                    if (typeof record.imageUrl === 'string') return record.imageUrl;
                }
                return '';
            })
            .filter((entry): entry is string => entry.length > 0);
        if (list.length > 0) return list;
    }

    return [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=900',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=900',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=900',
        'https://images.unsplash.com/photo-1542314831-c6a4203251ab?auto=format&fit=crop&q=80&w=900',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=900',
        'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&q=80&w=900',
    ];
}

export default function GalleryV7({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Gallery Prism Grid';
    const subtitle = (content.subtitle as string) || 'Prism Grid v7';
    const images = normalizeImages(content as Record<string, unknown>);

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const card = 'rgba(15,23,42,0.56)';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <section style={{ background: sectionBg, padding: 'clamp(70px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <h2 style={{ margin: 0, color: titleColor }}>{title}</h2>
        <div style={{ marginTop: '12px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
            {images.slice(0, 6).map((src, index) => <img key={index} src={src} alt={`Gallery ${index + 1}`} style={{ gridColumn: 'span 3', width: '100%', height: index % 2 === 0 ? '200px' : '260px', objectFit: 'cover', borderRadius: '12px', border }} />)}
        </div>
    </div>

        </section>
    );
}
