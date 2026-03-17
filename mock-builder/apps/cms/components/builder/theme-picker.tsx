'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

interface Theme {
    id: string;
    name: string;
    slug: string;
    componentKey: string;
    version: number;
    previewImageUrl: string | null;
    feature: { id: string; name: string; slug: string };
}

interface ThemePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (themeId: string) => void;
}

export function ThemePicker({ open, onClose, onSelect }: ThemePickerProps) {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            api.get<Theme[]>('/cms/catalog/themes').then((res) => {
                if (res.success && res.data) {
                    setThemes(res.data);
                }
                setLoading(false);
            });
        }
    }, [open]);

    if (!open) return null;

    // Group themes by feature
    const grouped = themes.reduce<Record<string, Theme[]>>((acc, theme) => {
        const key = theme.feature.name;
        if (!acc[key]) acc[key] = [];
        acc[key]!.push(theme);
        return acc;
    }, {});

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', width: '90%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>Add a New Section</h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Choose a pre-built section layout to add to your page.</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', color: '#4b5563', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor='#e5e7eb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor='#f3f4f6'}>×</button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#9ca3af', fontSize: '16px' }}>Loading available sections...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {Object.entries(grouped).map(([featureName, featureThemes]) => (
                                <div key={featureName}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                                        {featureName}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {featureThemes.map((theme) => (
                                            <div
                                                key={theme.id}
                                                onClick={() => { onSelect(theme.id); onClose(); }}
                                                style={{
                                                    borderRadius: '10px',
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e5e7eb',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                                                }}
                                                onMouseEnter={(e) => { 
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                }}
                                                onMouseLeave={(e) => { 
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                                }}
                                            >
                                                {/* Image Preview Container */}
                                                <div style={{ width: '100%', height: '160px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
                                                    {theme.previewImageUrl ? (
                                                        <img 
                                                            src={theme.previewImageUrl} 
                                                            alt={`${theme.name} preview`} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                                            {/* Placeholder generic SVG block to represent a layout */}
                                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                                                <path d="M3 9h18" />
                                                                <path d="M9 21V9" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Text Info Container */}
                                                <div style={{ padding: '16px' }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{theme.name}</div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>v{theme.version} · {theme.componentKey}</div>
                                                    <div style={{ marginTop: '12px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}>
                                                            + Add Section
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
