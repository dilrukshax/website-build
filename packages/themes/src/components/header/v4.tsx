'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface NavItem {
    label: string;
    href: string;
}

function normalizeNavItems(content: Record<string, unknown>, fallbackLabels: string[]): NavItem[] {
    const fromMenu = Array.isArray(content.menu)
        ? content.menu
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const label = typeof record.label === 'string' ? record.label.trim() : '';
                const href = typeof record.href === 'string' ? record.href.trim() : '';
                if (!label) return null;
                return {
                    label,
                    href: href || `#${label.toLowerCase().replace(/\s+/g, '-')}`,
                } as NavItem;
            })
            .filter((item): item is NavItem => item !== null)
        : [];

    if (fromMenu.length > 0) {
        return fromMenu;
    }

    const fromNavigation = Array.isArray(content.navigation)
        ? content.navigation
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((label) => ({ label, href: `#${label.toLowerCase().replace(/\s+/g, '-')}` }))
        : [];

    if (fromNavigation.length > 0) {
        return fromNavigation;
    }

    return fallbackLabels.map((label) => ({
        label,
        href: `#${label.toLowerCase().replace(/\s+/g, '-')}`,
    }));
}

export default function HeaderV4({ content, tokens }: ThemeComponentProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoUrl = content.logoUrl as string;
    const businessName = content.businessName as string || content.projectName as string || 'Opulence';
    const navigation = normalizeNavItems(content, ['Collections', 'Heritage', 'Journal', 'Concierge']);
    const ctaText = content.ctaText as string || 'Reservation';
    const ctaLinkRaw = content.ctaLink as string | undefined;
    const ctaLink = ctaLinkRaw && ctaLinkRaw !== '#' ? ctaLinkRaw : '#booking-widget';

    return (
        <>
            <style>{`
                .theme-v4-menu-toggle {
                    display: none;
                    border: none;
                    background: transparent;
                    color: ${tokens.text || '#111827'};
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                }

                .theme-v4-menu-toggle:hover {
                    background: ${tokens.secondary || '#f5f5f4'};
                }

                .theme-v4-mobile-panel {
                    display: none;
                }

                @media (max-width: 960px) {
                    .theme-v4-menu-toggle {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                    }

                    .theme-v4-desktop-left,
                    .theme-v4-desktop-right {
                        display: none !important;
                    }

                    .theme-v4-brand-wrap {
                        flex: 1 1 auto !important;
                        justify-content: flex-start !important;
                    }

                    .theme-v4-shell.theme-v4-open .theme-v4-mobile-panel {
                        display: flex;
                        width: 100%;
                        flex-direction: column;
                        gap: 12px;
                        padding-top: 12px;
                        border-top: 1px solid ${tokens.primary}40;
                    }

                    .theme-v4-mobile-links {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .theme-v4-mobile-cta {
                        width: 100%;
                    }
                }
            `}</style>

            <header
                style={{
                    backgroundColor: tokens.background,
                    padding: 'clamp(10px, 2.8vw, 14px) clamp(12px, 4vw, 18px)',
                    fontFamily: tokens.font,
                    color: tokens.text,
                    position: 'absolute',
                    width: '100%',
                    top: 0,
                    zIndex: 50,
                    boxSizing: 'border-box',
                }}
            >
                <div className={`theme-v4-shell${isMobileMenuOpen ? ' theme-v4-open' : ''}`}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px clamp(10px, 3vw, 14px)',
                            borderBottom: `1px solid ${tokens.primary}40`,
                            paddingBottom: '12px',
                        }}
                    >
                        <nav className="theme-v4-desktop-left" style={{ flex: '1 1 180px', display: 'flex', gap: '8px clamp(8px, 2.5vw, 14px)', flexWrap: 'wrap' }}>
                            {navigation.slice(0, 2).map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    style={{
                                        textDecoration: 'none',
                                        color: tokens.text,
                                        fontWeight: 400,
                                        fontSize: 'clamp(11px, 2.8vw, 12px)',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        transition: 'color 0.4s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = tokens.primary}
                                    onMouseLeave={(e) => e.currentTarget.style.color = tokens.text}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="theme-v4-brand-wrap" style={{ flex: '1 1 180px', display: 'flex', justifyContent: 'center' }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt={businessName} style={{ height: 'clamp(36px, 8vw, 50px)', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: 'clamp(22px, 6.4vw, 32px)', fontWeight: 300, letterSpacing: '0.05em', color: tokens.primary, textAlign: 'center' }}>
                                    {businessName}
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            className="theme-v4-menu-toggle"
                            aria-label="Toggle menu"
                            aria-expanded={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isMobileMenuOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </>
                                ) : (
                                    <>
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </>
                                )}
                            </svg>
                        </button>

                        <nav className="theme-v4-desktop-right" style={{ flex: '1 1 180px', display: 'flex', gap: '8px clamp(8px, 2.5vw, 14px)', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                            {navigation.slice(2, 4).map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    style={{
                                        textDecoration: 'none',
                                        color: tokens.text,
                                        fontWeight: 400,
                                        fontSize: 'clamp(11px, 2.8vw, 12px)',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        transition: 'color 0.4s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = tokens.primary}
                                    onMouseLeave={(e) => e.currentTarget.style.color = tokens.text}
                                >
                                    {item.label}
                                </a>
                            ))}

                            <a
                                href={ctaLink}
                                style={{
                                    border: `1px solid ${tokens.primary}`,
                                    color: tokens.primary,
                                    padding: '10px 12px',
                                    textDecoration: 'none',
                                    fontWeight: 400,
                                    fontSize: 'clamp(11px, 2.8vw, 12px)',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.4s ease',
                                    backgroundColor: 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = tokens.primary;
                                    e.currentTarget.style.color = tokens.background;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = tokens.primary;
                                }}
                            >
                                {ctaText}
                            </a>
                        </nav>
                    </div>

                    <div className="theme-v4-mobile-panel">
                        <nav className="theme-v4-mobile-links" aria-label="Primary navigation">
                            {navigation.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        textDecoration: 'none',
                                        color: tokens.text,
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <a
                            href={ctaLink}
                            className="theme-v4-mobile-cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${tokens.primary}`,
                                color: tokens.primary,
                                padding: '10px 12px',
                                textDecoration: 'none',
                                fontWeight: 500,
                                fontSize: '12px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tokens.primary;
                                e.currentTarget.style.color = tokens.background;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = tokens.primary;
                            }}
                        >
                            {ctaText}
                        </a>
                    </div>
                </div>
            </header>
        </>
    );
}
