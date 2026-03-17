'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SectionRenderer } from '../../../components/builder/section-renderer';
import { useHostedFont } from '../../../lib/use-hosted-font';
import type { ComponentProps } from 'react';

type SectionRendererProps = ComponentProps<typeof SectionRenderer>;

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'buildmyonlineweb.site').trim().toLowerCase();
const PUBLISHED_SITES_BASE_URL = (process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '');
const ROUTING_INDEX_CURRENT_URL = (
    process.env.NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL
    || (PUBLISHED_SITES_BASE_URL ? `${PUBLISHED_SITES_BASE_URL}/routing-index/current.json` : '/routing-index/current.json')
).trim();
const UNKNOWN_SUBDOMAIN = '__unknown__';
const ROUTING_INDEX_CACHE_TTL_MS = Number(process.env.NEXT_PUBLIC_ROUTING_INDEX_CACHE_TTL_MS || 30_000);
const DEFAULT_PUBLISHER_TAGLINE = 'Built Your Website with My Online Web';
const PUBLISHER_TAGLINE = (process.env.NEXT_PUBLIC_PUBLISHER_TAGLINE || DEFAULT_PUBLISHER_TAGLINE).trim();
const PUBLISHER_LINK = (process.env.NEXT_PUBLIC_PUBLISHER_URL || `https://${ROOT_DOMAIN}`).trim();

interface PublishedManifest {
    tenantId: string;
    instanceId: string;
    subdomain: string;
    fullDomain?: string | null;
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

interface RoutingIndexEntry {
    instanceId: string;
    tenantId: string;
    subdomain: string;
    manifestUrl: string | null;
    active: boolean;
}

interface RoutingIndexDocument {
    version: string;
    generatedAt: string;
    hosts: Record<string, RoutingIndexEntry>;
}

interface RoutingIndexPointer {
    version: string;
    generatedAt: string;
    indexKey: string;
    indexUrl: string | null;
}

interface ManifestPointer {
    manifestUrl?: string | null;
}

type CachedRoutingIndex = {
    expiresAt: number;
    index: RoutingIndexDocument;
};

let cachedRoutingIndex: CachedRoutingIndex | null = null;

function normalizeHost(host: string | null | undefined): string {
    if (!host) {
        return '';
    }

    const trimmed = host.trim().toLowerCase();
    if (!trimmed) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        return new URL(candidate).hostname.toLowerCase();
    } catch {
        return '';
    }
}

function resolveVersionIndexUrl(pointer: RoutingIndexPointer): string {
    if (pointer.indexKey) {
        return `/published/${pointer.indexKey.replace(/^\/+/, '')}`;
    }

    if (pointer.indexUrl) {
        return toPublishedProxyUrl(pointer.indexUrl);
    }

    return '';
}

function buildHostCandidates(hostname: string): string[] {
    const normalized = normalizeHost(hostname);
    if (!normalized) {
        return [];
    }

    if (normalized.startsWith('www.')) {
        const apex = normalized.slice(4);
        return apex ? [normalized, apex] : [normalized];
    }

    return [normalized, `www.${normalized}`];
}

function toPublishedProxyUrl(input: string | null | undefined): string {
    if (!input) {
        return '';
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return '';
    }

    if (trimmed.startsWith('/published/')) {
        return trimmed;
    }

    if (trimmed.startsWith('/')) {
        const normalized = trimmed.replace(/^\/+/, '');
        return `/published/${normalized}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const normalized = parsed.pathname.replace(/^\/+/, '');
            if (!normalized) {
                return '';
            }

            return `/published/${normalized}`;
        } catch {
            return '';
        }
    }

    return `/published/${trimmed.replace(/^\/+/, '')}`;
}

async function loadRoutingIndex(): Promise<RoutingIndexDocument | null> {
    const now = Date.now();
    if (cachedRoutingIndex && cachedRoutingIndex.expiresAt > now) {
        return cachedRoutingIndex.index;
    }

    if (!ROUTING_INDEX_CURRENT_URL) {
        return null;
    }

    try {
        const pointerResponse = await fetch(`${ROUTING_INDEX_CURRENT_URL}?_cb=${now.toString(36)}`, {
            method: 'GET',
            cache: 'no-store',
        });
        if (!pointerResponse.ok) {
            return null;
        }

        const pointer = await pointerResponse.json() as RoutingIndexPointer;
        const versionUrl = resolveVersionIndexUrl(pointer);
        if (!versionUrl) {
            return null;
        }

        const indexResponse = await fetch(`${versionUrl}?_cb=${now.toString(36)}`, {
            method: 'GET',
            cache: 'no-store',
        });
        if (!indexResponse.ok) {
            return null;
        }

        const index = await indexResponse.json() as RoutingIndexDocument;
        cachedRoutingIndex = {
            expiresAt: now + ROUTING_INDEX_CACHE_TTL_MS,
            index,
        };

        return index;
    } catch {
        return null;
    }
}

function findIndexEntry(index: RoutingIndexDocument, options: {
    hostname: string;
    subdomain: string | null;
}): RoutingIndexEntry | null {
    const hostCandidates = buildHostCandidates(options.hostname);
    for (const host of hostCandidates) {
        const entry = index.hosts[host];
        if (entry?.active) {
            return entry;
        }
    }

    if (options.subdomain) {
        for (const entry of Object.values(index.hosts)) {
            if (entry.active && entry.subdomain === options.subdomain) {
                return entry;
            }
        }
    }

    return null;
}

async function fetchPublishedManifest(entry: RoutingIndexEntry): Promise<PublishedManifest | null> {
    if (!entry.manifestUrl) {
        return null;
    }

    try {
        const pointerUrl = toPublishedProxyUrl(entry.manifestUrl);
        if (!pointerUrl) {
            return null;
        }

        const pointerResponse = await fetch(`${pointerUrl}?_cb=${Date.now().toString(36)}`, {
            method: 'GET',
            cache: 'no-store',
        });
        if (!pointerResponse.ok) {
            return null;
        }

        const pointer = await pointerResponse.json() as ManifestPointer;
        if (!pointer.manifestUrl) {
            return null;
        }

        const manifestUrl = toPublishedProxyUrl(pointer.manifestUrl);
        if (!manifestUrl) {
            return null;
        }

        const manifestResponse = await fetch(`${manifestUrl}?_cb=${Date.now().toString(36)}`, {
            method: 'GET',
            cache: 'no-store',
        });
        if (!manifestResponse.ok) {
            return null;
        }

        return await manifestResponse.json() as PublishedManifest;
    } catch {
        return null;
    }
}

export default function PreviewPage() {
    const params = useParams();
    const [manifest, setManifest] = useState<PublishedManifest | null>(null);
    const [currentPageSlug, setCurrentPageSlug] = useState<string>('/');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useHostedFont(manifest?.tokens?.font);

    useEffect(() => {
        async function loadPublishedSite() {
            setLoading(true);
            setError(null);

            const routeParam = params.subdomain as string | undefined;
            const requestedSubdomain = routeParam && routeParam !== UNKNOWN_SUBDOMAIN
                ? routeParam.trim().toLowerCase()
                : null;
            const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

            const index = await loadRoutingIndex();
            if (!index) {
                setError('Site not found');
                setLoading(false);
                return;
            }

            const entry = findIndexEntry(index, {
                hostname,
                subdomain: requestedSubdomain,
            });

            if (!entry) {
                setError('Site not found');
                setLoading(false);
                return;
            }

            const nextManifest = await fetchPublishedManifest(entry);
            if (!nextManifest) {
                setError('This website has not been published yet.');
                setLoading(false);
                return;
            }

            setManifest(nextManifest);
            setLoading(false);
        }

        void loadPublishedSite();
    }, [params.subdomain]);

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
        const target = (e.target as HTMLElement).closest('a');
        if (!target) return;

        const href = target.getAttribute('href');

        if (href && href.startsWith('/')) {
            e.preventDefault();
            const slug = href === '/' ? '/' : href.replace(/^\//, '');

            const targetPage = manifest.pages.find((p) => p.page.slug === slug || (slug === '' && p.page.slug === '/'));
            if (targetPage) {
                setCurrentPageSlug(targetPage.page.slug);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    return (
        <div
            style={{ fontFamily: `${tokens.font}, sans-serif`, backgroundColor: tokens.background, minHeight: '100vh' }}
            onClick={handleGlobalClick}
        >
            {PUBLISHER_TAGLINE && PUBLISHER_LINK && (
                <a
                    href={PUBLISHER_LINK}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        position: 'fixed',
                        bottom: '0',
                        right: '0',
                        zIndex: 120,
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        lineHeight: 1,
                        color: 'rgb(17, 24, 39)',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(15, 23, 42, 0.12)',
                        padding: '10px 15px',
                        borderTopLeftRadius: '20px',
                        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.12)',
                        backdropFilter: 'blur(6px)',
                    }}
                    title={PUBLISHER_TAGLINE}
                    aria-label={PUBLISHER_TAGLINE}
                >
                    {PUBLISHER_TAGLINE}
                </a>
            )}

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
                        context={{
                            tenantId: manifest.tenantId,
                            instanceId: manifest.instanceId,
                            pageSlug: currentPage.page.slug,
                        }}
                    />
                ))}
        </div>
    );
}
