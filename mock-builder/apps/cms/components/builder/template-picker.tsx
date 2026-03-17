'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

interface PageTemplate {
    id: string;
    name: string;
    description: string | null;
    previewImageUrl: string | null;
}

interface TemplatePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (templateId: string) => void;
}

export function TemplatePicker({ open, onClose, onSelect }: TemplatePickerProps) {
    const [templates, setTemplates] = useState<PageTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && templates.length === 0) {
            setLoading(true);
            api.get<PageTemplate[]>('/cms/catalog/page-templates')
                .then(res => {
                    if (res.success && res.data) {
                        setTemplates(res.data);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, templates.length]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: '#fff', borderRadius: '8px', width: '800px', maxWidth: '90vw',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Choose a Page Template</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading templates...</p>
                    ) : templates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>No templates available.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => onSelect(template.id)}
                                    style={{
                                        border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                                        transition: 'all 0.2s', backgroundColor: '#fff'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                    <div style={{ height: '140px', backgroundColor: '#f3f4f6', backgroundImage: `url(${template.previewImageUrl || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                        {!template.previewImageUrl && (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No Preview</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#111827' }}>{template.name}</h3>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {template.description || 'No description provided.'}
                                        </p>
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
