'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

function toAnchor(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
    return normalized ? '#' + normalized : '#';
}

function normalizeColumns(content: Record<string, unknown>): FooterColumn[] {
    const fromContent = Array.isArray(content.columns)
        ? content.columns
            .map((column) => {
                if (!column || typeof column !== 'object') return null;
                const record = column as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                const links = Array.isArray(record.links)
                    ? record.links
                        .map((link) => {
                            if (!link || typeof link !== 'object') return null;
                            const linkRecord = link as Record<string, unknown>;
                            const label = typeof linkRecord.label === 'string' ? linkRecord.label.trim() : '';
                            const href = typeof linkRecord.href === 'string' ? linkRecord.href.trim() : '';
                            return label ? { label, href: href || toAnchor(label) } : null;
                        })
                        .filter((item): item is FooterLink => item !== null)
                    : [];
                return title && links.length > 0 ? { title, links } : null;
            })
            .filter((item): item is FooterColumn => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [
        { title: 'Product', links: [{ label: 'Services', href: '#services' }, { label: 'Pricing', href: '#pricing' }] },
        { title: 'Company', links: [{ label: 'About', href: '#about' }, { label: 'Contact', href: '#contact' }] },
    ];
}

export default function FooterV8({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Salesforce Pipeline';
    const text = (content.text as string) || 'Template-linked footer preserving lane identity.';
    const copyrightText = (content.copyrightText as string) || `© ${new Date().getFullYear()} ${businessName}`;
    const columns = normalizeColumns(content as Record<string, unknown>);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <footer id="footer" style={{ background: sectionBg, padding: '58px 16px 24px', borderTop: border, fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}><h3 style={{ margin: 0, color: titleColor, textAlign: 'center' }}>{businessName}</h3><div style={{ marginTop: '10px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>{columns.map((column) => <article key={column.title} style={{ border, background: card, borderRadius: '12px', padding: '10px' }}><h4 style={{ margin: 0, color: titleColor }}>{column.title}</h4><ul style={{ margin: '8px 0 0 16px', color: muted }}>{column.links.map((link) => <li key={link.label}><a href={link.href} style={{ color: muted }}>{link.label}</a></li>)}</ul></article>)}</div></div>
            <p style={{ maxWidth: '1120px', margin: '14px auto 0', color: muted, fontSize: '13px' }}>{copyrightText}</p>
        </footer>
    );
}
