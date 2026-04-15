'use client';

import React, { useState } from 'react';
import { uploadCmsImage } from '../../lib/media-upload';

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

const formStackStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--be-form-label, #475569)',
    marginBottom: '4px',
};
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--be-form-border, #cbd5e1)',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'var(--be-form-bg, #ffffff)',
    color: 'var(--be-form-text, #0f172a)',
    boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
};
const helperTextStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--be-form-muted, #64748b)',
    marginTop: '6px',
};
const arrayContainerStyle: React.CSSProperties = {
    border: '1px solid var(--be-form-border, #cbd5e1)',
    borderRadius: '8px',
    padding: '12px',
    backgroundColor: 'var(--be-form-surface, #f8fafc)',
};
const arrayItemStyle: React.CSSProperties = {
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: 'var(--be-form-bg, #ffffff)',
    borderRadius: '6px',
    position: 'relative',
    border: '1px solid var(--be-form-border, #cbd5e1)',
};
const subtleButtonStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--be-form-label, #475569)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
};
const primaryMiniButtonStyle: React.CSSProperties = {
    fontSize: '12px',
    padding: '4px 10px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
};

export function SchemaForm({ schema, values, onChange, pages = [] }: SchemaFormProps & { pages?: { id: string; slug: string; title: string }[] }) {
    if (!schema.properties) return null;

    const handleFieldChange = (key: string, value: unknown) => {
        onChange({ ...values, [key]: value });
    };

    return (
        <div style={formStackStyle}>
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
                <label style={labelStyle}>{label}</label>
                <textarea
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    style={textareaStyle}
                />
            </div>
        );
    }

    if (property.type === 'string' && isImageLikeField(fieldKey, property)) {
        return <ImageUploadField fieldKey={fieldKey} label={label} value={(value as string) || ''} onChange={onChange} />;
    }

    if (property.type === 'string') {
        if (property.format === 'page-link') {
            return (
                <div>
                    <label style={labelStyle}>{label}</label>
                    <select
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={inputStyle}
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
                        style={{ ...inputStyle, fontSize: '13px', marginTop: '4px' }}
                    />
                </div>
            );
        }

        return (
            <div>
                <label style={labelStyle}>{label}</label>
                <input
                    type="text"
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    style={inputStyle}
                />
            </div>
        );
    }

    if (property.type === 'number') {
        return (
            <div>
                <label style={labelStyle}>{label}</label>
                <input
                    type="number"
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                    style={inputStyle}
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
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--be-form-label, #475569)' }}>{label}</label>
            </div>
        );
    }

    if (property.type === 'array' && property.items) {
        const arrayValue = Array.isArray(value) ? value : [];
        return <ArrayField fieldKey={fieldKey} label={label} itemSchema={property.items} value={arrayValue} onChange={onChange} pages={pages} />;
    }

    return (
        <div>
            <label style={{ fontSize: '13px', color: 'var(--be-form-muted, #64748b)' }}>{label} (unsupported type: {property.type})</label>
        </div>
    );
}

function isImageLikeField(fieldKey: string, property: SchemaProperty): boolean {
    const format = property.format?.toLowerCase();
    if (format === 'image' || format === 'image-url') {
        return true;
    }

    const key = fieldKey.toLowerCase();
    const title = (property.title || '').toLowerCase();
    const imagePattern = /(image|photo|avatar|logo)/;
    return imagePattern.test(key) || imagePattern.test(title);
}

interface ArrayFieldProps {
    fieldKey: string;
    label: string;
    itemSchema: SchemaProperty;
    value: unknown[];
    onChange: (value: unknown[]) => void;
    pages?: { id: string; slug: string; title: string }[];
}

function buildDefaultValue(schema: SchemaProperty): unknown {
    if (schema.type === 'string') {
        return '';
    }

    if (schema.type === 'number') {
        return undefined;
    }

    if (schema.type === 'boolean') {
        return false;
    }

    if (schema.type === 'array') {
        return [];
    }

    if (schema.type === 'object') {
        const next: Record<string, unknown> = {};
        for (const [key, prop] of Object.entries(schema.properties || {})) {
            next[key] = buildDefaultValue(prop);
        }
        return next;
    }

    return '';
}

function ArrayField({ label, itemSchema, value, onChange, pages = [] }: ArrayFieldProps) {
    const [expanded, setExpanded] = useState(true);

    const addItem = () => {
        const newItem = buildDefaultValue(itemSchema);
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
        <div style={arrayContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? '12px' : '0' }}>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    style={subtleButtonStyle}
                >
                    {expanded ? '▼' : '▶'} {label} ({value.length})
                </button>
                <button
                    type="button"
                    onClick={addItem}
                    style={primaryMiniButtonStyle}
                >
                    + Add
                </button>
            </div>
            {expanded && value.map((item, i) => (
                <div key={i} style={arrayItemStyle}>
                    <button
                        type="button"
                        onClick={() => removeItem(i)}
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--be-form-error, #ef4444)',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
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
                            style={inputStyle}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Image Upload Field with preview
// ============================================================

function readErrorMessage(rawError: unknown): string {
    if (rawError instanceof Error && rawError.message) {
        return rawError.message;
    }
    return 'Upload failed. Check R2 env variables and bucket CORS settings.';
}

function ImageUploadField({ fieldKey, label, value, onChange }: { fieldKey: string; label: string; value: string; onChange: (val: string) => void }) {
    const [previewError, setPreviewError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);

        try {
            if (!file.type.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            const publicUrl = await uploadCmsImage(file);
            onChange(publicUrl);
            setPreviewError(false);
        } catch (error) {
            setUploadError(readErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label style={labelStyle}>{label}</label>
            {value && !previewError && (
                <div
                    style={{
                        marginBottom: '8px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid var(--be-form-border, #cbd5e1)',
                        backgroundColor: 'var(--be-form-surface, #f8fafc)',
                    }}
                >
                    <img
                        src={value}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
                        onError={() => setPreviewError(true)}
                    />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <label
                    htmlFor={`image-upload-${fieldKey}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        border: '1px solid var(--be-form-border, #cbd5e1)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--be-form-label, #475569)',
                        backgroundColor: uploading
                            ? 'var(--be-form-upload-bg-disabled, #f1f5f9)'
                            : 'var(--be-form-upload-bg, #ffffff)',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {uploading ? 'Uploading...' : value ? 'Replace Image' : 'Upload Image'}
                </label>
                <input
                    id={`image-upload-${fieldKey}`}
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = '';
                        if (!file) return;
                        await handleFileUpload(file);
                    }}
                    style={{ display: 'none' }}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            setPreviewError(false);
                            setUploadError(null);
                        }}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--be-form-danger-border, #fecaca)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--be-form-danger-text, #b91c1c)',
                            backgroundColor: 'var(--be-form-danger-bg, #fef2f2)',
                            cursor: 'pointer',
                        }}
                    >
                        Remove
                    </button>
                )}
            </div>
            {value && (
                <p style={{ ...helperTextStyle, wordBreak: 'break-all' }}>
                    {value}
                </p>
            )}
            {uploadError && (
                <p style={{ fontSize: '11px', color: 'var(--be-form-error, #dc2626)', marginTop: '6px' }}>{uploadError}</p>
            )}
        </div>
    );
}
