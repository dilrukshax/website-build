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

export default function HeaderV1({ content, tokens }: ThemeComponentProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoUrl = content.logoUrl as string;
    const businessName = content.businessName as string || content.projectName as string || 'Business Name';
    const navigation = normalizeNavItems(content, ['Home', 'About', 'Services', 'Contact']);
    const ctaText = content.ctaText as string || 'Book Now';
    const ctaLinkRaw = content.ctaLink as string | undefined;
    const ctaLink = ctaLinkRaw && ctaLinkRaw !== '#' ? ctaLinkRaw : '#booking-widget';

    return (
        <>
            <style>{`
                .theme-v1-menu-toggle {
                    display: none;
                    border: none;
                    background: transparent;
                    color: ${tokens.text || '#0f172a'};
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                }

                .theme-v1-menu-toggle:hover {
                    background: rgba(15, 23, 42, 0.08);
                }

                @media (max-width: 960px) {
                    .theme-v1-menu-toggle {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                    }

                    .theme-v1-nav-shell {
                        display: none !important;
                    }

                    .theme-v1-header-inner.theme-v1-open .theme-v1-nav-shell {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        margin-left: 0 !important;
                        padding-top: 12px;
                        border-top: 1px solid ${tokens.secondary || '#e5e7eb'};
                        gap: 12px;
                    }

                    .theme-v1-header-inner.theme-v1-open .theme-v1-nav-links {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }

                    .theme-v1-header-inner.theme-v1-open .theme-v1-cta {
                        width: 100%;
                    }
                }
            `}</style>

            <header
                style={{
                    backgroundColor: tokens.background,
                    borderBottom: `1px solid ${tokens.secondary || '#f3f4f6'}`,
                    padding: 'clamp(10px, 2.2vw, 14px) clamp(12px, 3vw, 18px)',
                    fontFamily: tokens.font,
                    color: tokens.text,
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div
                    className={`theme-v1-header-inner${isMobileMenuOpen ? ' theme-v1-open' : ''}`}
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px 14px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={businessName} style={{ height: 'clamp(30px, 6vw, 40px)', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: 'clamp(18px, 4.8vw, 24px)', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.primary }}>
                                {businessName}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className="theme-v1-menu-toggle"
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

                    <nav className="theme-v1-nav-shell" style={{ display: 'flex', gap: '12px 16px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto', justifyContent: 'flex-end' }}>
                        <div className="theme-v1-nav-links" style={{ display: 'flex', gap: '8px 12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {navigation.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        textDecoration: 'none',
                                        color: tokens.text,
                                        fontWeight: 500,
                                        fontSize: 'clamp(13px, 2.9vw, 15px)',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = tokens.primary}
                                    onMouseLeave={(e) => e.currentTarget.style.color = tokens.text}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <a
                            href={ctaLink}
                            className="theme-v1-cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: tokens.primary,
                                color: tokens.background,
                                padding: '10px 16px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {ctaText}
                        </a>
                    </nav>
                </div>
            </header>
        </>
    );
}
