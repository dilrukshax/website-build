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

export default function HeaderV9({ content, tokens }: ThemeComponentProps) {
    const projectName = (content.projectName as string) || (content.businessName as string) || 'Velocity VSL';
    const ctaText = (content.ctaText as string) || 'Book Now';
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim() || '#booking-widget';
    const navItems = normalizeNavItems(content as Record<string, unknown>);
    const laneText = 'Velocity VSL v9';

    const sectionBg = '#020617';
    const titleColor = '#f8fafc';
    const muted = '#cbd5e1';
    const border = '1px solid rgba(148,163,184,0.30)';

    return (
        <>

    <header style={{ background: sectionBg, borderBottom: border, fontFamily: tokens.font }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '10px 16px', display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                <a href="#hero" style={{ color: titleColor, textDecoration: 'none', fontWeight: 800 }}>{projectName}</a>
                <span style={{ color: muted, fontSize: '12px' }}>{laneText}</span>
            </div>
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{navItems.map((item) => <a key={item.label + item.href} href={item.href} style={{ color: titleColor, textDecoration: 'none', border, borderRadius: '999px', padding: '4px 10px' }}>{item.label}</a>)}</nav>
        </div>
    </header>

        </>
    );
}
