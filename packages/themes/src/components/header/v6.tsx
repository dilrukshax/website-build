'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type NavItem = { label: string; href: string };

function toAnchor(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    return normalized ? '#' + normalized : '#';
}

function normalizeNavItems(content: Record<string, unknown>): NavItem[] {
    const fromMenu = Array.isArray(content.menu)
        ? content.menu
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const label = typeof record.label === 'string' ? record.label.trim() : '';
                const href = typeof record.href === 'string' ? record.href.trim() : '';
                return label ? { label, href: href || toAnchor(label) } : null;
            })
            .filter((item): item is NavItem => item !== null)
        : [];

    if (fromMenu.length > 0) return fromMenu;

    return [
        { label: 'Process', href: '#hero' },
        { label: 'Services', href: '#services' },
        { label: 'Products', href: '#products' },
        { label: 'Results', href: '#reviews' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Contact', href: '#contact' },
    ];
}

export default function HeaderV6({ content, tokens }: ThemeComponentProps) {
    const projectName = (content.projectName as string) || (content.businessName as string) || 'Acquisition Shop';
    const ctaText = (content.ctaText as string) || 'Book Growth Call';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const navItems = normalizeNavItems(content as Record<string, unknown>);

    const sectionBg = tokens.background || '#f6f1e7';
    const titleColor = tokens.text || '#191d24';
    const muted = '#5c6470';
    const primary = tokens.primary || '#ff6a3d';
    const secondary = tokens.secondary || '#ffe9c9';
    const accent = tokens.accent || '#1da99b';
    const border = '#e8dcc7';

    return (
        <header
            style={{
                background: `linear-gradient(180deg, ${sectionBg} 0%, #fffaf2 65%, #fff 100%)`,
                borderBottom: `1px solid ${border}`,
                fontFamily: tokens.font,
                position: 'relative',
                zIndex: 20,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(920px 220px at 10% -25%, ${secondary} 0%, transparent 60%), radial-gradient(720px 180px at 95% -30%, ${accent}22 0%, transparent 60%)`,
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    maxWidth: '1160px',
                    margin: '0 auto',
                    minHeight: '84px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    position: 'relative',
                }}
            >
                <a
                    href="#hero"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: titleColor,
                        textDecoration: 'none',
                        fontWeight: 780,
                    }}
                >
                    <span
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(140deg, ${secondary} 0%, #fff 100%)`,
                            border: `1px solid ${border}`,
                            color: primary,
                            fontSize: '15px',
                            fontWeight: 900,
                            boxShadow: '0 10px 18px rgba(25, 29, 36, 0.1)',
                        }}
                    >
                        {projectName.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ display: 'grid', gap: '2px' }}>
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>{projectName}</span>
                        <span style={{ color: muted, fontSize: '11px', lineHeight: 1.2, fontWeight: 650 }}>Revenue Engine for Service Teams</span>
                    </span>
                </a>

                <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {navItems.map((item) => (
                        <a
                            key={item.label + item.href}
                            href={item.href}
                            style={{
                                color: muted,
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: 650,
                                padding: '8px 12px',
                                borderRadius: '999px',
                                border: `1px solid ${border}`,
                                background: '#fffefb',
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <a
                    href={ctaLink}
                    style={{
                        color: '#fff',
                        background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                        borderRadius: '999px',
                        minHeight: '42px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0 17px',
                        textDecoration: 'none',
                        fontWeight: 760,
                        fontSize: '14px',
                        boxShadow: '0 16px 24px rgba(255, 106, 61, 0.3)',
                    }}
                >
                    {ctaText}
                </a>
            </div>
        </header>
    );
}
