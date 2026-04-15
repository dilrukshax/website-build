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

export default function HeaderV2({ content, tokens }: ThemeComponentProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoUrl = content.logoUrl as string;
    const businessName = content.businessName as string || content.projectName as string || 'Neon Horizon';
    const navigation = normalizeNavItems(content, ['Home', 'Features', 'Pricing', 'Contact']);
    const ctaText = content.ctaText as string || 'Get Started';
    const ctaLinkRaw = content.ctaLink as string | undefined;
    const ctaLink = ctaLinkRaw && ctaLinkRaw !== '#' ? ctaLinkRaw : '#booking-widget';

    return (
        <>
            <style>{`
                .theme-v2-menu-toggle {
                    display: none;
                    border: none;
                    background: transparent;
                    color: #ffffff;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                }

                .theme-v2-menu-toggle:hover {
                    background: rgba(255, 255, 255, 0.12);
                }

                @media (max-width: 960px) {
                    .theme-v2-menu-toggle {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                    }

                    .theme-v2-nav-shell {
                        display: none !important;
                    }

                    .theme-v2-header-inner.theme-v2-open .theme-v2-nav-shell {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        margin-left: 0 !important;
                        padding-top: 12px;
                        border-top: 1px solid rgba(255, 255, 255, 0.12);
                        gap: 12px;
                    }

                    .theme-v2-header-inner.theme-v2-open .theme-v2-nav-links {
                        display: flex !important;
                        width: 100%;
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }

                    .theme-v2-header-inner.theme-v2-open .theme-v2-cta {
                        width: 100%;
                    }
                }
            `}</style>

            <header
                style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: 'clamp(10px, 2.8vw, 14px) clamp(12px, 4vw, 18px)',
                    fontFamily: tokens.font,
                    color: tokens.text,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                }}
            >
                <div
                    className={`theme-v2-header-inner${isMobileMenuOpen ? ' theme-v2-open' : ''}`}
                    style={{
                        maxWidth: '1280px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px clamp(10px, 3vw, 16px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={businessName} style={{ height: 'clamp(30px, 7vw, 40px)', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: 'clamp(18px, 5.4vw, 24px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', textShadow: `0 0 10px ${tokens.primary}` }}>
                                {businessName}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className="theme-v2-menu-toggle"
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

                    <nav className="theme-v2-nav-shell" style={{ display: 'flex', gap: '8px clamp(10px, 3vw, 16px)', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto', justifyContent: 'flex-end' }}>
                        <div className="theme-v2-nav-links" style={{ display: 'flex', gap: '8px clamp(8px, 2.5vw, 12px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {navigation.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'rgba(255,255,255,0.7)',
                                        fontWeight: 500,
                                        fontSize: 'clamp(12px, 3.2vw, 14px)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.textShadow = `0 0 8px ${tokens.primary}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                        e.currentTarget.style.textShadow = 'none';
                                    }}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <a
                            href={ctaLink}
                            className="theme-v2-cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(90deg, ${tokens.primary}, ${tokens.accent})`,
                                color: '#fff',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: 'clamp(12px, 3vw, 13px)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'transform 0.2s',
                                boxShadow: `0 4px 15px rgba(0,0,0,0.3), 0 0 10px ${tokens.primary}40`,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {ctaText}
                        </a>
                    </nav>
                </div>
            </header>
        </>
    );
}
