'use client';

import React, { useMemo, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

type NavItem = {
    label: string;
    href: string;
};

function normalizeMenu(content: Record<string, unknown>): NavItem[] {
    if (!Array.isArray(content.menu)) {
        return [
            { label: 'Home', href: '/' },
            { label: 'About', href: '#about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Contact', href: '#contact' },
        ];
    }

    const items = content.menu
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const record = entry as Record<string, unknown>;
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            const href = typeof record.href === 'string' ? record.href.trim() : '';
            if (!label) return null;
            return {
                label,
                href: href || '#',
            } as NavItem;
        })
        .filter((entry): entry is NavItem => Boolean(entry));

    return items.length > 0 ? items : [{ label: 'Blog', href: '/blog' }];
}

function resolveHref(href: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (!isEditor || !context?.subdomain) {
        return href;
    }

    if (href === '/blog') {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }

    if (href.startsWith('/blog/')) {
        const slug = href.slice('/blog/'.length);
        return `/preview/${encodeURIComponent(context.subdomain)}/blog/${encodeURIComponent(slug)}`;
    }

    if (href === '/') {
        return `/preview/${encodeURIComponent(context.subdomain)}`;
    }

    return href;
}

export default function HeaderV15({ content, tokens, context, isEditor }: ThemeComponentProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuItems = useMemo(() => normalizeMenu(content), [content]);
    const brand = (content.businessName as string) || 'train of thought';
    const ctaText = (content.ctaText as string) || 'Subscribe';
    const ctaLink = resolveHref(((content.ctaLink as string) || '/blog'), context, isEditor);

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                borderBottom: '1px solid #d9d7d0',
                background: 'rgba(247, 246, 243, 0.96)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}
            >
                <a
                    href={resolveHref('/', context, isEditor)}
                    data-editor-nav="allow"
                    style={{
                        color: '#121212',
                        textDecoration: 'none',
                        fontSize: 'clamp(22px, 2.8vw, 34px)',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        textTransform: 'lowercase',
                    }}
                >
                    {brand}
                </a>

                <button
                    type="button"
                    aria-label="Toggle menu"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #c8c5bb',
                        background: '#fbfaf7',
                        color: '#1b1b1b',
                        borderRadius: '999px',
                        height: '36px',
                        width: '36px',
                        cursor: 'pointer',
                    }}
                >
                    {menuOpen ? 'x' : '|||'}
                </button>

                <nav
                    style={{
                        width: '100%',
                        display: menuOpen ? 'flex' : 'none',
                        flexDirection: 'column',
                        gap: '10px',
                        paddingBottom: '6px',
                    }}
                >
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {menuItems.map((item) => (
                            <a
                                key={`${item.label}-${item.href}`}
                                href={resolveHref(item.href, context, isEditor)}
                                data-editor-nav="allow"
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    textDecoration: 'none',
                                    color: '#2f2f2f',
                                    fontSize: '13px',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <a
                        href={ctaLink}
                        data-editor-nav="allow"
                        onClick={() => setMenuOpen(false)}
                        style={{
                            width: 'fit-content',
                            textDecoration: 'none',
                            background: '#121212',
                            color: '#f5f5f5',
                            borderRadius: '999px',
                            padding: '10px 18px',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {ctaText}
                    </a>
                </nav>

                <style>{`
                    @media (min-width: 940px) {
                        header button[aria-label="Toggle menu"] {
                            display: none !important;
                        }

                        header nav {
                            display: flex !important;
                            width: auto !important;
                            flex-direction: row !important;
                            align-items: center;
                            gap: 18px !important;
                            padding-bottom: 0 !important;
                            margin-left: auto;
                        }

                        header nav > div {
                            align-items: center;
                            justify-content: flex-end;
                        }
                    }
                `}</style>
            </div>
        </header>
    );
}
