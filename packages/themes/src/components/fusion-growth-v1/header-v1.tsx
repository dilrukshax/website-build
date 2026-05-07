'use client';

import React, { useState } from 'react';
import type { ThemeComponentProps } from '../../types';
import { readSectionBackground, readSectionText } from '../shared/style-overrides';

type NavItem = {
    label: string;
    href: string;
};

function toAnchor(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    return normalized ? `#${normalized}` : '#';
}

function normalizeNavItems(content: Record<string, unknown>): NavItem[] {
    const source = Array.isArray(content.menu) ? content.menu : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            const href = typeof record.href === 'string' ? record.href.trim() : '';
            return label ? { label, href: href || toAnchor(label) } : null;
        })
        .filter((item): item is NavItem => item !== null);

    if (items.length > 0) return items;

    return [
        { label: 'Home', href: '#hero' },
        { label: 'Shop', href: '#offers' },
        { label: 'Workshop', href: '#about' },
    ];
}

export default function HeaderV13({ content, styles, tokens }: ThemeComponentProps) {
    const brandName = (content.brandName as string) || (content.projectName as string) || 'Acquisition Press';
    const navItems = normalizeNavItems(content as Record<string, unknown>);
    const [mobileOpen, setMobileOpen] = useState(false);
    const surface = readSectionBackground(styles, '#f7f1e7');
    const heading = readSectionText(styles, '#1f160f');
    const muted = heading === '#1f160f' ? '#4f4338' : heading;

    return (
        <header className="fusion13-header" id="top">
            <style>{`
                .fusion13-header { position: sticky; top: 0; z-index: 60; background: ${surface}; backdrop-filter: blur(12px); border-bottom: 1px solid #e5d9c8; font-family: ${tokens.font || 'Roboto, sans-serif'}; }
                .fusion13-header__inner { max-width: 1180px; margin: 0 auto; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
                .fusion13-header__brand { color: ${heading}; text-decoration: none; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; white-space: nowrap; }
                .fusion13-header__nav { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; }
                .fusion13-header__nav-link { color: ${muted}; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }
                .fusion13-header__menu-button { display: none; width: 46px; height: 46px; border-radius: 999px; border: 1px solid #d8c8b2; background: #fffdf8; color: ${heading}; align-items: center; justify-content: center; cursor: pointer; }
                .fusion13-header__menu-icon { display: grid; gap: 4px; }
                .fusion13-header__menu-icon span { width: 16px; height: 2px; border-radius: 999px; background: currentColor; display: block; }
                .fusion13-header__mobile-nav { display: none; max-width: 1180px; margin: 0 auto; padding: 0 16px 14px; }
                .fusion13-header__mobile-panel { border: 1px solid #ddcdb8; border-radius: 22px; background: #fffaf2; box-shadow: 0 18px 40px rgba(52, 39, 28, 0.08); padding: 12px; display: grid; gap: 6px; }
                .fusion13-header__mobile-link { color: ${heading}; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; padding: 12px 10px; border-radius: 14px; }
                .fusion13-header__mobile-link:hover { background: #f4ecdf; }
                @media (max-width: 900px) { .fusion13-header__nav { display: none; } .fusion13-header__menu-button { display: inline-flex; } .fusion13-header__mobile-nav { display: block; } }
                @media (max-width: 640px) { .fusion13-header__brand { font-size: 22px; } .fusion13-header__inner { padding-top: 12px; padding-bottom: 12px; } }
            `}</style>

            <div className="fusion13-header__inner">
                <a className="fusion13-header__brand" href="#hero">{brandName}</a>

                <nav className="fusion13-header__nav" aria-label="Primary">
                    {navItems.map((item) => (
                        <a key={`${item.label}-${item.href}`} className="fusion13-header__nav-link" href={item.href}>
                            {item.label}
                        </a>
                    ))}
                </nav>

                <button
                    type="button"
                    className="fusion13-header__menu-button"
                    onClick={() => setMobileOpen((value) => !value)}
                    aria-expanded={mobileOpen}
                    aria-controls="fusion13-mobile-nav"
                    aria-label="Toggle navigation"
                >
                    <span className="fusion13-header__menu-icon">
                        <span />
                        <span />
                        <span />
                    </span>
                </button>
            </div>

            <div className="fusion13-header__mobile-nav" id="fusion13-mobile-nav" hidden={!mobileOpen}>
                <div className="fusion13-header__mobile-panel">
                    {navItems.map((item) => (
                        <a
                            key={`mobile-${item.label}-${item.href}`}
                            className="fusion13-header__mobile-link"
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>
        </header>
    );
}
