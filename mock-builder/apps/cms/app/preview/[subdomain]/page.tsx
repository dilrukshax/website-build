'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SectionRenderer } from '../../../components/builder/section-renderer';
import type { ComponentProps } from 'react';

type SectionRendererProps = ComponentProps<typeof SectionRenderer>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface PublishedManifest {
    tenantId: string;
    instanceId: string;
    subdomain: string;
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    features: Record<string, boolean>;
    header: Record<string, unknown>;
    footer: Record<string, unknown>;
    pages: Array<{
        page: { id: string; slug: string; title: string };
        sections: Array<{
            id: string;
            type: string;
            props: Record<string, unknown>;
            styles: Record<string, unknown>;
            conditions?: Array<{ op: string; path: string; value?: unknown }>;
            position: number;
        }>;
    }>;
}

export default function PreviewPage() {
    const params = useParams();
    const subdomain = params.subdomain as string;
    const [manifest, setManifest] = useState<PublishedManifest | null>(null);
    const [currentPageSlug, setCurrentPageSlug] = useState<string>('/');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!subdomain) return;
        setLoading(true);
        fetch(`${API_BASE_URL}/web/sites/${subdomain}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setManifest(data.data);
                } else {
                    setError(data.error?.message || 'Site not found');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load site');
                setLoading(false);
            });
    }, [subdomain]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
                <p style={{ color: '#9ca3af', fontSize: '18px' }}>Loading website...</p>
            </div>
        );
    }

    if (error || !manifest) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>Site Not Found</h1>
                <p style={{ color: '#6b7280' }}>{error || 'This website has not been published yet.'}</p>
            </div>
        );
    }

    const tokens = manifest.tokens;
    const currentPage = manifest.pages.find((p) => p.page.slug === currentPageSlug) || manifest.pages[0];

    if (!currentPage) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p style={{ color: '#6b7280' }}>No pages published</p>
            </div>
        );
    }

    const handleGlobalClick = (e: React.MouseEvent) => {
        // Look for the closest anchor tag
        const target = (e.target as HTMLElement).closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        
        // If it's a relative link (starts with /)
        if (href && href.startsWith('/')) {
            e.preventDefault(); // Stop standard browser navigation
            const slug = href === '/' ? '/' : href.replace(/^\//, ''); // Normalize slug
            
            // Check if this page actually exists in the manifest
            const targetPage = manifest.pages.find((p) => p.page.slug === slug || (slug === '' && p.page.slug === '/'));
            if (targetPage) {
                setCurrentPageSlug(targetPage.page.slug);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                console.warn(`Page not found: ${href}`);
            }
        }
    };

    return (
        <div 
            style={{ fontFamily: `${tokens.font}, sans-serif`, backgroundColor: tokens.background, minHeight: '100vh' }}
            onClick={handleGlobalClick}
        >
            {/* Page navigation (simple) */}
            {manifest.pages.length > 1 && (
                <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', gap: '8px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '24px' }}>
                    {manifest.pages.map((p) => (
                        <button
                            key={p.page.id}
                            onClick={() => setCurrentPageSlug(p.page.slug)}
                            style={{
                                padding: '4px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '13px',
                                backgroundColor: currentPageSlug === p.page.slug ? tokens.primary : 'transparent',
                                color: '#fff',
                            }}
                        >
                            {p.page.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Render sections (conditions evaluated by SectionRenderer) */}
            {currentPage.sections
                .sort((a, b) => a.position - b.position)
                .map((section) => (
                    <SectionRenderer
                        key={section.id}
                        componentKey={section.type}
                        content={section.props}
                        styles={section.styles}
                        tokens={tokens}
                        conditions={section.conditions as SectionRendererProps['conditions']}
                        features={manifest.features}
                        context={{ tenantId: manifest.tenantId, instanceId: manifest.instanceId }}
                    />
                ))}
        </div>
    );
}
