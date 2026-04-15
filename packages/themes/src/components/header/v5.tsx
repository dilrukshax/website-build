'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface NavItem {
    label: string;
    href: string;
}

function toAnchor(label: string): string {
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    return normalized ? `#${normalized}` : '#';
}

function normalizeNavItems(content: Record<string, unknown>): NavItem[] {
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
                    href: href || toAnchor(label),
                } as NavItem;
            })
            .filter((item): item is NavItem => item !== null)
        : [];

    if (fromMenu.length > 0) {
        return fromMenu;
    }

    return [
        { label: 'Overview', href: '#hero' },
        { label: 'Features', href: '#features' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'Questions', href: '#questions' },
    ];
}

export default function HeaderV5({ content, tokens }: ThemeComponentProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const projectName = (content.projectName as string) || (content.businessName as string) || 'Signal Horizon';
    const logoBadge = (content.logoBadge as string) || projectName.charAt(0).toUpperCase() || 'S';
    const ctaText = (content.ctaText as string) || 'Get Started';
    const ctaLink = ((content.ctaLink as string) || '#hero').trim() || '#hero';
    const navItems = normalizeNavItems(content);

    return (
        <>
            <style>{`
                .theme-v5-header-wrap {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#8b5cf6'};
                    --v5-accent: ${tokens.accent || '#ec4899'};
                    --v5-secondary: ${tokens.secondary || 'rgba(19, 27, 46, 0.9)'};
                    
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    padding: 24px 20px;
                    background: var(--v5-bg);
                }
                .theme-v5-header-shell {
                    max-width: 1100px;
                    margin: 0 auto;
                    min-height: 64px;
                    padding: 10px 12px 10px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    border-radius: 999px;
                    background: var(--v5-secondary);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
                    transition: border-radius 0.2s ease;
                }
                .theme-v5-brand {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--v5-text);
                    text-decoration: none;
                    min-width: 0;
                }
                .theme-v5-badge {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--v5-bg);
                    background: var(--v5-primary);
                    flex-shrink: 0;
                }
                .theme-v5-brand-name {
                    font-size: 22px;
                    font-weight: 600;
                    color: var(--v5-text);
                    white-space: nowrap;
                }
                .theme-v5-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    flex: 1 1 auto;
                    flex-wrap: wrap;
                }
                .theme-v5-nav a {
                    color: var(--v5-text);
                    text-decoration: none;
                    font-size: 15px;
                    font-weight: 500;
                    opacity: 0.88;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                }
                .theme-v5-nav a:hover {
                    opacity: 1;
                    transform: translateY(-1px);
                }
                .theme-v5-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .theme-v5-header-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 44px;
                    padding: 12px 20px;
                    border-radius: 999px;
                    color: var(--v5-bg);
                    font-size: 15px;
                    font-weight: 600;
                    text-decoration: none;
                    background: var(--v5-accent);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .theme-v5-header-cta:hover {
                    transform: translateY(-1px);
                    opacity: 0.95;
                }
                .theme-v5-mobile-toggle {
                    display: none;
                    background: none;
                    border: none;
                    color: var(--v5-text);
                    cursor: pointer;
                    padding: 8px;
                }
                .theme-v5-mobile-toggle:hover {
                    opacity: 0.8;
                }

                @media (max-width: 960px) {
                    .theme-v5-header-shell {
                        padding: 10px 12px 10px 16px;
                    }
                    .theme-v5-mobile-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .theme-v5-nav,
                    .theme-v5-header-actions {
                        display: none;
                    }
                    .theme-v5-header-shell.theme-v5-open {
                        flex-wrap: wrap;
                        border-radius: 24px;
                    }
                    .theme-v5-header-shell.theme-v5-open .theme-v5-nav {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        order: 3;
                        align-items: flex-start;
                        gap: 16px;
                        padding: 16px 0;
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
                        margin-top: 8px;
                    }
                    .theme-v5-header-shell.theme-v5-open .theme-v5-header-actions {
                        display: flex;
                        width: 100%;
                        order: 4;
                        padding-bottom: 8px;
                    }
                    .theme-v5-header-shell.theme-v5-open .theme-v5-header-cta {
                        width: 100%;
                    }
                }

                @media (max-width: 640px) {
                    .theme-v5-header-wrap {
                        top: 0;
                        padding: 12px;
                    }
                    .theme-v5-brand-name {
                        font-size: 18px;
                    }
                    .theme-v5-header-shell.theme-v5-open {
                        border-radius: 16px;
                    }
                }
            `}</style>

            <header className="theme-v5-header-wrap">
                <div
                    className={`theme-v5-header-shell${isMobileMenuOpen ? ' theme-v5-open' : ''}`}
                    style={{ fontFamily: tokens.font }}
                >
                    <a href="#hero" className="theme-v5-brand">
                        <span className="theme-v5-badge">{logoBadge}</span>
                        <span className="theme-v5-brand-name">{projectName}</span>
                    </a>

                    <button 
                        className="theme-v5-mobile-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Menu"
                        aria-expanded={isMobileMenuOpen}
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

                    <nav className="theme-v5-nav" aria-label="Primary navigation">
                        {navItems.map((item) => (
                            <a 
                                key={`${item.label}-${item.href}`} 
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="theme-v5-header-actions">
                        <a 
                            href={ctaLink} 
                            className="theme-v5-header-cta"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {ctaText}
                        </a>
                    </div>
                </div>
            </header>
        </>
    );
}
