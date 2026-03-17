'use client';

import React, { useState } from 'react';

interface SchemaProperty {
    type: string;
    title?: string;
    format?: string;
    items?: SchemaProperty;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
}

interface SchemaFormProps {
    schema: {
        properties?: Record<string, SchemaProperty>;
        required?: string[];
    };
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
}

export function SchemaForm({ schema, values, onChange, pages = [] }: SchemaFormProps & { pages?: { id: string; slug: string; title: string }[] }) {
    if (!schema.properties) return null;

    const handleFieldChange = (key: string, value: unknown) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(schema.properties).map(([key, prop]) => (
                <FieldRenderer
                    key={key}
                    fieldKey={key}
                    property={prop}
                    value={values[key]}
                    onChange={(val) => handleFieldChange(key, val)}
                    pages={pages}
                />
            ))}
        </div>
    );
}

interface FieldRendererProps {
    fieldKey: string;
    property: SchemaProperty;
    value: unknown;
    onChange: (value: unknown) => void;
    pages?: { id: string; slug: string; title: string }[];
}

function FieldRenderer({ fieldKey, property, value, onChange, pages = [] }: FieldRendererProps) {
    const label = property.title || fieldKey;

    if (property.type === 'string' && property.format === 'textarea') {
        return (
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>{label}</label>
                <textarea
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
            </div>
        );
    }

    if (property.type === 'string' && (property.format === 'image-url' || property.format === 'image')) {
        return <ImageUrlField label={label} value={(value as string) || ''} onChange={onChange} />;
    }

    if (property.type === 'string') {
        if (property.format === 'page-link') {
            return (
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>{label}</label>
                    <select
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff' }}
                    >
                        <option value="">-- Select a Page or Enter Custom URL below --</option>
                        {pages.map((p) => (
                            <option key={p.id} value={`/${p.slug === '/' ? '' : p.slug}`}>
                                {p.title} (/{p.slug === '/' ? '' : p.slug})
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Or type a custom URL (e.g., https://google.com)"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginTop: '4px' }}
                    />
                </div>
            );
        }

        return (
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>{label}</label>
                <input
                    type="text"
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
            </div>
        );
    }

    if (property.type === 'number') {
        return (
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>{label}</label>
                <input
                    type="number"
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
            </div>
        );
    }

    if (property.type === 'boolean') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                />
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</label>
            </div>
        );
    }

    if (property.type === 'array' && property.items) {
        return <ArrayField fieldKey={fieldKey} label={label} itemSchema={property.items} value={value as unknown[] || []} onChange={onChange} pages={pages} />;
    }

    return (
        <div>
            <label style={{ fontSize: '13px', color: '#9ca3af' }}>{label} (unsupported type: {property.type})</label>
        </div>
    );
}

interface ArrayFieldProps {
    fieldKey: string;
    label: string;
    itemSchema: SchemaProperty;
    value: unknown[];
    onChange: (value: unknown[]) => void;
    pages?: { id: string; slug: string; title: string }[];
}

function ArrayField({ label, itemSchema, value, onChange, pages = [] }: ArrayFieldProps) {
    const [expanded, setExpanded] = useState(true);

    const addItem = () => {
        const newItem: Record<string, unknown> = {};
        if (itemSchema.properties) {
            for (const key of Object.keys(itemSchema.properties)) {
                newItem[key] = '';
            }
        }
        onChange([...value, newItem]);
    };

    const removeItem = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, updated: unknown) => {
        const newArr = [...value];
        newArr[index] = updated;
        onChange(newArr);
    };

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? '12px' : '0' }}>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    style={{ fontSize: '13px', fontWeight: 600, color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    {expanded ? '▼' : '▶'} {label} ({value.length})
                </button>
                <button
                    type="button"
                    onClick={addItem}
                    style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Add
                </button>
            </div>
            {expanded && value.map((item, i) => (
                <div key={i} style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => removeItem(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                    >
                        ×
                    </button>
                    {itemSchema.properties ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(itemSchema.properties).map(([key, prop]) => (
                                <FieldRenderer
                                    key={key}
                                    fieldKey={key}
                                    property={prop}
                                    value={(item as Record<string, unknown>)[key]}
                                    onChange={(val) => updateItem(i, { ...(item as Record<string, unknown>), [key]: val })}
                                    pages={pages}
                                />
                            ))}
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={(item as string) || ''}
                            onChange={(e) => updateItem(i, e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Image URL Field with preview
// ============================================================

function ImageUrlField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
    const [previewError, setPreviewError] = useState(false);

    return (
        <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>{label}</label>
            {value && !previewError && (
                <div style={{ marginBottom: '8px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <img
                        src={value}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
                        onError={() => setPreviewError(true)}
                    />
                </div>
            )}
            <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setPreviewError(false); }}
                placeholder="https://example.com/image.jpg"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Enter an image URL. Upload support coming soon.</p>
        </div>
    );
}
