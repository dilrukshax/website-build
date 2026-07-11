'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
    sectionsJsonb: unknown;
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

/** Extract token overrides out of any section's defaultStyles.themeTokens. */
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
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeSections(value: unknown): TemplateSectionConfig[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item): TemplateSectionConfig | null => {
            const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
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

export default function BuilderPreviewPage({ params }: { params: { name: string } }) {
    const identifier = decodeURIComponent(params.name);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<PageTemplateRecord | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        setTemplate(null);

        api.get<PageTemplateRecord[]>('/cms/catalog/page-templates')
            .then((res) => {
                if (!active) {
                    return;
                }

                if (!res.success || !res.data) {
                    setError('Unable to load templates for preview.');
                    return;
                }

                const match = res.data.find((item) => item.id === identifier || item.name === identifier) || null;
                if (!match) {
                    setError('Template preview is unavailable for this selection.');
                    return;
                }

                setTemplate(match);
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
    }, [identifier]);

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

            {loading && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                    Loading template preview...
                </div>
            )}

            {!loading && error && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                    {error}
                </div>
            )}

            {!loading && !error && sections.length === 0 && (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                    No sections available for this template preview.
                </div>
            )}

            {!loading && !error && sections.length > 0 && sections.map((section, idx) => (
                <SectionRenderer
                    key={`${section.themeComponentKey}-${idx}`}
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
