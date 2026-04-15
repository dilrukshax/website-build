import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

function toAnchorFromLabel(label: string): string {
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    return normalized ? `#${normalized}` : '#footer';
}

function normalizeFooterColumns(content: Record<string, unknown>, fallback: FooterColumn[]): FooterColumn[] {
    const fromContent = Array.isArray(content.columns)
        ? content.columns
            .map((column): FooterColumn | null => {
                const record = column as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                if (!title) {
                    return null;
                }

                const links = Array.isArray(record.links)
                    ? record.links
                        .map((item): FooterLink | null => {
                            if (typeof item === 'string') {
                                const label = item.trim();
                                if (!label) return null;
                                return { label, href: toAnchorFromLabel(label) };
                            }

                            const linkRecord = item as Record<string, unknown>;
                            const label = typeof linkRecord.label === 'string' ? linkRecord.label.trim() : '';
                            const href = typeof linkRecord.href === 'string' ? linkRecord.href.trim() : '';

                            if (!label) {
                                return null;
                            }

                            return {
                                label,
                                href: href || toAnchorFromLabel(label),
                            };
                        })
                        .filter((item): item is FooterLink => Boolean(item))
                    : [];

                if (links.length === 0) {
                    return null;
                }

                return { title, links };
            })
            .filter((column): column is FooterColumn => Boolean(column))
        : [];

    return fromContent.length > 0 ? fromContent : fallback;
}

export default function FooterV1({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Business Name';
    const text = content.text as string || 'Making the world a better place through building elegant hierarchies.';
    const copyright = (content.copyrightText as string)
        || (content.copyright as string)
        || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`;

    const columns = normalizeFooterColumns(content, [
        {
            title: 'Product',
            links: [
                { label: 'Features', href: '#services' },
                { label: 'Integrations', href: '#about' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About Us', href: '#about' },
                { label: 'Careers', href: '#team' },
                { label: 'Blog', href: '#testimonials' },
                { label: 'Contact', href: '#contact' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy Policy', href: '#footer' },
                { label: 'Terms of Service', href: '#footer' },
            ],
        },
    ]);

    return (
        <footer style={{
            backgroundColor: tokens.background,
            borderTop: `1px solid ${tokens.secondary || '#f3f4f6'}`,
            padding: 'clamp(40px, 8vw, 64px) 16px 24px',
            fontFamily: tokens.font,
            color: tokens.text,
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 6vw, 48px)' }}>
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: tokens.primary, marginBottom: '16px' }}>
                        {businessName}
                    </h3>
                    <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, maxWidth: '280px' }}>
                        {text}
                    </p>
                </div>
                
                <div
                    style={{
                        flex: '2 1 360px',
                        minWidth: 0,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'clamp(16px, 4vw, 32px)',
                    }}
                >
                    {columns.map((section, idx) => (
                        <div key={idx}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: tokens.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
                                {section.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {section.links.map((item, i) => (
                                    <li key={i}>
                                        <a href={item.href} style={{ textDecoration: 'none', color: '#6b7280', fontSize: '15px', transition: 'color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = tokens.primary}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ maxWidth: '1200px', margin: 'clamp(28px, 6vw, 56px) auto 0', paddingTop: '24px', borderTop: `1px solid ${tokens.secondary || '#f3f4f6'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                    {copyright}
                </p>
            </div>
        </footer>
    );
}
