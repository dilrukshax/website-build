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

export default function FooterV6({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Acquisition Shop';
    const text = (content.text as string) || 'Acquisition systems for teams that want clear execution and measurable pipeline growth.';
    const copyrightText = (content.copyrightText as string) || `© ${new Date().getFullYear()} ${businessName}`;
    const columns = normalizeColumns(content as Record<string, unknown>);
    const sectionBg = '#121a28';
    const titleColor = '#f7f9fc';
    const muted = '#bec8d8';
    const primary = tokens.primary || '#ff6a3d';
    const accent = tokens.accent || '#1da99b';
    const border = '#2e3a4f';

    return (
        <footer id="footer" style={{ background: sectionBg, padding: '58px 16px 24px', borderTop: `1px solid ${border}`, fontFamily: tokens.font }}>
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    display: 'grid',
                    gap: '16px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    border: `1px solid ${border}`,
                    borderRadius: '18px',
                    background: 'linear-gradient(180deg, #172033 0%, #121a28 100%)',
                    padding: '18px',
                    boxShadow: '0 18px 34px rgba(0, 0, 0, 0.26)',
                }}
            >
                <article>
                    <h3 style={{ margin: 0, color: titleColor, fontSize: '24px' }}>{businessName}</h3>
                    <p style={{ margin: '10px 0 0 0', color: muted, lineHeight: 1.6 }}>{text}</p>
                    <a
                        href="#booking-widget"
                        style={{
                            marginTop: '12px',
                            display: 'inline-flex',
                            textDecoration: 'none',
                            color: '#fff',
                            fontWeight: 760,
                            fontSize: '13px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                            boxShadow: '0 10px 18px rgba(255, 106, 61, 0.28)',
                        }}
                    >
                        Book a Strategy Session
                    </a>
                </article>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    {columns.map((column) => (
                        <div key={column.title}>
                            <h4 style={{ margin: 0, color: titleColor }}>{column.title}</h4>
                            <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '6px' }}>
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.href} style={{ color: muted, textDecoration: 'none' }}>
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <p style={{ maxWidth: '1120px', margin: '14px auto 0', color: muted, fontSize: '13px' }}>{copyrightText}</p>
        </footer>
    );
}
