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

export default function GalleryV11({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Gallery Fusion Growth';
    const subtitle = (content.subtitle as string) || 'Fusion Growth v11';
    const images = normalizeImages(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section style={{ background: sectionBg, padding: 'clamp(70px, 10vw, 120px) 16px', fontFamily: tokens.font }}>

    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {images.map((src, index) => (
            <article key={index} style={{ border, background: card, borderRadius: '14px', overflow: 'hidden' }}>
                <img src={src} alt={`Gallery ${index + 1}`} style={{ width: '100%', height: '190px', objectFit: 'cover', display: 'block' }} />
                <p style={{ margin: 0, padding: '10px', color: titleColor }}>{title} {index + 1}</p>
            </article>
        ))}
    </div>

        </section>
    );
}
