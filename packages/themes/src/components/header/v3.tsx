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

export default function HeaderV3({ content, tokens }: ThemeComponentProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoUrl = content.logoUrl as string;
    const businessName = content.businessName as string || content.projectName as string || 'Vibrant Pop';
    const navigation = normalizeNavItems(content, ['Home', 'Discover', 'About', 'Join']);
    const ctaText = content.ctaText as string || 'Lets Go!';
    const ctaLinkRaw = content.ctaLink as string | undefined;
    const ctaLink = ctaLinkRaw && ctaLinkRaw !== '#' ? ctaLinkRaw : '#booking-widget';

    return (
        <>
            <style>{`
                .theme-v3-menu-toggle {
                    display: none;
                    border: none;
                    background: transparent;
                    color: ${tokens.text || '#0f172a'};
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                }

                .theme-v3-menu-toggle:hover {
                    background: ${tokens.secondary || '#f1f5f9'};
                }

                @media (max-width: 960px) {
                    .theme-v3-menu-toggle {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                    }

                    .theme-v3-nav-shell {
                        display: none !important;
                    }

                    .theme-v3-header-inner.theme-v3-open .theme-v3-nav-shell {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        margin-left: 0 !important;
                        padding-top: 12px;
                        border-top: 1px solid ${tokens.secondary || '#e2e8f0'};
                        gap: 12px;
                    }

                    .theme-v3-header-inner.theme-v3-open .theme-v3-nav-links {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }

                    .theme-v3-header-inner.theme-v3-open .theme-v3-cta {
                        width: 100%;
                    }
                }
            `}</style>

            <header
                style={{
                    backgroundColor: tokens.background,
                    padding: 'clamp(10px, 2.2vw, 14px)',
                    fontFamily: tokens.font,
                    color: tokens.text,
                    margin: 'clamp(4px, 2vw, 10px) auto',
                    maxWidth: '1200px',
                    borderRadius: '24px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                    border: `2px solid ${tokens.secondary}`,
                    position: 'sticky',
                    top: '8px',
                    zIndex: 50,
                }}
            >
                <div
                    className={`theme-v3-header-inner${isMobileMenuOpen ? ' theme-v3-open' : ''}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 clamp(6px, 2.6vw, 10px)',
                        flexWrap: 'wrap',
                        gap: '10px 14px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={businessName} style={{ height: 'clamp(30px, 6vw, 40px)', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 900, color: tokens.primary, textTransform: 'lowercase', letterSpacing: '-1px' }}>
                                {businessName}.
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className="theme-v3-menu-toggle"
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

                    <nav className="theme-v3-nav-shell" style={{ display: 'flex', gap: '10px 14px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto', justifyContent: 'flex-end' }}>
                        <div className="theme-v3-nav-links" style={{ display: 'flex', gap: '8px 10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {navigation.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        textDecoration: 'none',
                                        color: tokens.text,
                                        fontWeight: 600,
                                        fontSize: 'clamp(13px, 2.8vw, 14px)',
                                        transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = tokens.secondary;
                                        e.currentTarget.style.color = tokens.primary;
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = tokens.text;
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <a
                            href={ctaLink}
                            className="theme-v3-cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: tokens.accent,
                                color: '#fff',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '14px',
                                boxShadow: `0 8px 16px ${tokens.primary}33`,
                                transition: 'opacity 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            {ctaText}
                        </a>
                    </nav>
                </div>
            </header>
        </>
    );
}
