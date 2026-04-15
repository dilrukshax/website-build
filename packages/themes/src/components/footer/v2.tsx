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

export default function FooterV2({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Neon Horizon';
    const text = content.text as string || 'Pioneering the next era of digital interactive booking.';
    const copyright = (content.copyrightText as string)
        || (content.copyright as string)
        || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`;

    const columns = normalizeFooterColumns(content, [
        {
            title: 'Explore',
            links: [
                { label: 'Destinations', href: '#services' },
                { label: 'Experiences', href: '#gallery' },
                { label: 'Packages', href: '#pricing' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '#faq' },
                { label: 'Safety Information', href: '#about' },
                { label: 'Cancellation Options', href: '#contact' },
            ],
        },
    ]);

    return (
        <footer style={{
            backgroundColor: '#0f172a',
            borderTop: `1px solid ${tokens.primary}30`,
            padding: 'clamp(48px, 10vw, 80px) 16px 24px',
            fontFamily: tokens.font,
            color: '#f8fafc',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`,
                opacity: 0.5,
                zIndex: 0
            }} />
            
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(22px, 6vw, 56px)', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                    <h3 style={{ fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 800, color: '#fff', textShadow: `0 0 15px ${tokens.primary}`, marginBottom: '16px' }}>
                        {businessName}
                    </h3>
                    <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '100%' }}>
                        {text}
                    </p>
                </div>
                
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(14px, 4vw, 36px)' }}>
                    {columns.map((section, idx) => (
                        <div key={idx}>
                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: tokens.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
                                {section.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {section.links.map((item, i) => (
                                    <li key={i}>
                                        <a href={item.href} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(13px, 3.2vw, 15px)', transition: 'all 0.3s' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.textShadow = `0 0 8px ${tokens.primary}`;
                                            e.currentTarget.style.paddingLeft = '8px';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                            e.currentTarget.style.textShadow = 'none';
                                            e.currentTarget.style.paddingLeft = '0';
                                        }}>
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ maxWidth: '1280px', margin: 'clamp(28px, 7vw, 80px) auto 0', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
                    {copyright}
                </p>
            </div>
        </footer>
    );
}
