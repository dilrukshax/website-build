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

export default function FooterV4({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'House of Opulence';
    const text = content.text as string || 'Curated experiences for the world\'s most discerning clientele.';
    const copyright = (content.copyrightText as string)
        || (content.copyright as string)
        || `© ${new Date().getFullYear()} ${businessName}. Exclusive rights reserved.`;

    const columns = normalizeFooterColumns(content, [
        {
            title: 'The Collection',
            links: [
                { label: 'Estates', href: '#services' },
                { label: 'Yachts', href: '#gallery' },
                { label: 'Private Aviation', href: '#booking-widget' },
            ],
        },
        {
            title: 'The House',
            links: [
                { label: 'Heritage', href: '#about' },
                { label: 'Journal', href: '#testimonials' },
                { label: 'Concierge', href: '#contact' },
            ],
        },
    ]);

    return (
        <footer style={{
            backgroundColor: '#0a0a0a',
            padding: 'clamp(56px, 11vw, 120px) 16px 24px',
            fontFamily: tokens.font,
            color: '#fafafa',
            borderTop: `1px solid ${tokens.primary}40`,
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                
                <h3 style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 300, color: tokens.primary, marginBottom: '24px', letterSpacing: '0.1em' }}>
                    {businessName}
                </h3>
                
                <p style={{ fontSize: 'clamp(13px, 3.4vw, 15px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, maxWidth: '400px', marginBottom: 'clamp(30px, 8vw, 80px)', letterSpacing: '0.05em', fontWeight: 300 }}>
                    {text}
                </p>

                <div style={{ display: 'grid', width: '100%', maxWidth: '760px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(20px, 5vw, 64px)', justifyContent: 'center', marginBottom: 'clamp(36px, 9vw, 100px)' }}>
                    {columns.map((section, idx) => (
                        <div key={idx} style={{ minWidth: 0 }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: tokens.primary, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '32px' }}>
                                {section.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {section.links.map((item, i) => (
                                    <li key={i}>
                                        <a href={item.href} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(11px, 3vw, 13px)', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.4s ease' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.letterSpacing = '0.15em';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                            e.currentTarget.style.letterSpacing = '0.1em';
                                        }}>
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                
                <div style={{ width: '100%', borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: 'clamp(18px, 5vw, 40px)', display: 'flex', justifyContent: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
                        {copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}
