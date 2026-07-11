'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SectionRenderer } from '../../../components/builder/section-renderer';
import { api } from '../../../lib/api-client';
import { useHostedFont } from '../../../lib/use-hosted-font';

type TokenMap = {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    font: string;
};

interface PageTemplateRecord {
    id: string;
    name: string;
    description?: string | null;
    sectionsJsonb: unknown;
    isPlanRestricted?: boolean;
}

interface TemplateSectionConfig {
    themeComponentKey: string;
    defaultContent: Record<string, unknown>;
    defaultStyles: Record<string, unknown>;
}

const DEFAULT_TOKENS: TokenMap = {
    primary: '#ef4444',
    secondary: '#f1f5f9',
    accent: '#f87171',
    text: '#0f172a',
    background: '#ffffff',
    font: '"Inter", sans-serif',
};

function extractThemeTokens(sections: TemplateSectionConfig[]): Partial<TokenMap> {
    for (const section of sections) {
        const raw = section.defaultStyles?.themeTokens;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            return raw as Partial<TokenMap>;
        }
    }

    return {};
}

function toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

function normalizeSections(value: unknown): TemplateSectionConfig[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item): TemplateSectionConfig | null => {
            const record = item && typeof item === 'object' && !Array.isArray(item)
                ? item as Record<string, unknown>
                : null;
            if (!record) {
                return null;
            }

            const themeComponentKey = typeof record.themeComponentKey === 'string'
                ? record.themeComponentKey.trim()
                : '';

            if (!themeComponentKey) {
                return null;
            }

            return {
                themeComponentKey,
                defaultContent: toRecord(record.defaultContent),
                defaultStyles: toRecord(record.defaultStyles),
            };
        })
        .filter((section): section is TemplateSectionConfig => section !== null);
}

export default function DeveloperTemplatePreviewPage() {
    const searchParams = useSearchParams();
    const templateId = (searchParams.get('t_id') || '').trim();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<PageTemplateRecord | null>(null);

    useEffect(() => {
        let active = true;

        if (!templateId) {
            setTemplate(null);
            setError('Missing template id. Open this page with ?t_id=<template-id>.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setTemplate(null);

        api.get<PageTemplateRecord>(`/cms/catalog/page-templates/${encodeURIComponent(templateId)}`)
            .then((res) => {
                if (!active) {
                    return;
                }

                if (!res.success || !res.data) {
                    setError(res.error?.message || 'Unable to load template preview.');
                    return;
                }

                if (res.data.isPlanRestricted) {
                    setError('This template is restricted for the current tenant plan.');
                    return;
                }

                setTemplate(res.data);
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setError('Template preview failed to load.');
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [templateId]);

    const sections = useMemo(() => normalizeSections(template?.sectionsJsonb), [template]);
    const tokens: TokenMap = useMemo(
        () => ({ ...DEFAULT_TOKENS, ...extractThemeTokens(sections) }),
        [sections],
    );

    useHostedFont(tokens.font);

    return (
        <div style={{ backgroundColor: tokens.background, minHeight: '100vh', width: '100%', fontFamily: tokens.font }}>
            <style
                dangerouslySetInnerHTML={{
                    __html: 'html, body { margin: 0; padding: 0; }',
                }}
            />

            <div
                style={{
                    position: 'fixed',
                    top: 20,
                    left: 20,
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <Link
                    href="/dashboard/builder"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        border: '1px solid rgba(15, 23, 42, 0.12)',
                        color: '#0f172a',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to builder
                </Link>

                {template?.name && (
                    <div
                        style={{
                            padding: '10px 14px',
                            borderRadius: 999,
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: '0.01em',
                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
                        }}
                    >
                        {template.name}
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
                    Loading template preview...
                </div>
            )}

            {!loading && error && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 14, textAlign: 'center', padding: 24 }}>
                    {error}
                </div>
            )}

            {!loading && !error && sections.length === 0 && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14, textAlign: 'center', padding: 24 }}>
                    No sections available for this template preview.
                </div>
            )}

            {!loading && !error && sections.length > 0 && sections.map((section, index) => (
                <SectionRenderer
                    key={`${section.themeComponentKey}-${index}`}
                    componentKey={section.themeComponentKey}
                    content={section.defaultContent}
                    styles={section.defaultStyles}
                    tokens={tokens}
                    isEditor={false}
                />
            ))}
        </div>
    );
}
