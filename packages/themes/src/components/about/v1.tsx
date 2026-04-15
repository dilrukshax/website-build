import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function AboutV1({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Our Story';
    const body = content.body as string || 'We believe in simplicity and excellence. Everything we do is designed to provide the best possible experience, cutting away the unnecessary to focus on what truly matters.';
    const imageUrl = content.imageUrl as string || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070';
    
    return (
        <section style={{ backgroundColor: tokens.background, padding: '100px 24px', fontFamily: tokens.font, color: tokens.text }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '80px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 500px' }}>
                    <div style={{ width: '60px', height: '4px', backgroundColor: tokens.primary, marginBottom: '32px' }} />
                    <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '24px', lineHeight: 1.2 }}>
                        {title}
                    </h2>
                    <p style={{ fontSize: '18px', lineHeight: 1.8, color: '#6b7280' }}>
                        {body}
                    </p>
                </div>
                <div style={{ flex: '1 1 500px' }}>
                    <img src={imageUrl} alt="About Us" style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                </div>
            </div>
        </section>
    );
}
