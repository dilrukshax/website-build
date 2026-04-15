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

export default function HeaderV10({ content, tokens }: ThemeComponentProps) {
    const projectName = (content.projectName as string) || (content.businessName as string) || 'Aurora Atelier';
    const ctaText = (content.ctaText as string) || 'Book Now';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const navItems = normalizeNavItems(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const border = '1px solid #e2e8f0';

    return (
        <>

    <header style={{ background: sectionBg, borderBottom: border, fontFamily: tokens.font }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', minHeight: '64px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <a href="#hero" style={{ color: titleColor, textDecoration: 'none', fontWeight: 800 }}>{projectName}</a>
            <nav style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>{navItems.map((item) => <a key={item.label + item.href} href={item.href} style={{ color: muted, textDecoration: 'none' }}>{item.label}</a>)}</nav>
            <a href={ctaLink} style={{ textDecoration: 'none', color: titleColor, fontWeight: 700 }}>{ctaText}</a>
        </div>
    </header>

        </>
    );
}
