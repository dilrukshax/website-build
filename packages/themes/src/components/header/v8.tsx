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
        { label: 'Overview', href: '#hero' },
        { label: 'Services', href: '#services' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Contact', href: '#contact' },
    ];
}

export default function HeaderV8({ content, tokens }: ThemeComponentProps) {
    const projectName = (content.projectName as string) || (content.businessName as string) || 'Salesforce Pipeline';
    const ctaText = (content.ctaText as string) || 'Book Now';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const navItems = normalizeNavItems(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const border = '1px solid #e2e8f0';

    return (
        <>

    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: sectionBg, borderBottom: border, fontFamily: tokens.font }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '12px 16px', display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                <a href="#hero" style={{ color: titleColor, textDecoration: 'none', fontWeight: 800 }}>{projectName}</a>
                <a href={ctaLink} style={{ color: titleColor, textDecoration: 'none', border: `1px solid ${tokens.primary}`, borderRadius: '8px', padding: '6px 10px' }}>{ctaText}</a>
            </div>
            <nav style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>{navItems.map((item) => <a key={item.label + item.href} href={item.href} style={{ color: muted, textDecoration: 'none' }}>{item.label}</a>)}</nav>
        </div>
    </header>

        </>
    );
}
