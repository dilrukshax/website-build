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

export default function FooterV3({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Vibrant Pop';
    const text = content.text as string || 'Ready to start your adventure? Let\'s have some fun!';
    const copyright = (content.copyrightText as string)
        || (content.copyright as string)
        || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`;

    const columns = normalizeFooterColumns(content, [
        {
            title: 'Play',
            links: [
                { label: 'Destinations', href: '#services' },
                { label: 'Games', href: '#gallery' },
                { label: 'Leaderboard', href: '#testimonials' },
            ],
        },
        {
            title: 'Learn',
            links: [
                { label: 'How it Works', href: '#about' },
                { label: 'Community', href: '#team' },
                { label: 'Stories', href: '#contact' },
            ],
        },
    ]);

    return (
        <footer style={{
            backgroundColor: tokens.background,
            padding: '100px 24px 40px',
            fontFamily: tokens.font,
            color: tokens.text,
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute',
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                height: '80px',
                backgroundColor: tokens.primary,
                borderRadius: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 20px 40px -10px ${tokens.primary}80`,
                zIndex: 10
            }}>
                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>{text}</h2>
            </div>

            <div style={{ maxWidth: '1200px', margin: '80px auto 0', display: 'flex', flexWrap: 'wrap', gap: '80px', backgroundColor: tokens.secondary, borderRadius: '40px', padding: '60px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ fontSize: '40px', fontWeight: 900, color: tokens.primary, marginBottom: '24px', letterSpacing: '-2px' }}>
                        {businessName}.
                    </h3>
                    <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: 1.6, fontWeight: 500 }}>
                        Join us on an epic journey. The world is waiting for you!
                    </p>
                </div>
                
                <div style={{ flex: '2 1 400px', display: 'flex', flexWrap: 'wrap', gap: '64px', justifyContent: 'flex-end' }}>
                    {columns.map((section, idx) => (
                        <div key={idx}>
                            <h4 style={{ fontSize: '20px', fontWeight: 800, color: tokens.text, marginBottom: '24px' }}>
                                {section.title}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {section.links.map((item, i) => (
                                    <li key={i}>
                                        <a href={item.href} style={{ 
                                            textDecoration: 'none', 
                                            color: '#6b7280', 
                                            fontSize: '18px', 
                                            fontWeight: 600,
                                            transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                            display: 'inline-block'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = tokens.primary;
                                            e.currentTarget.style.transform = 'translateX(10px) scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#6b7280';
                                            e.currentTarget.style.transform = 'translateX(0) scale(1)';
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
            
            <div style={{ maxWidth: '1200px', margin: '40px auto 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 600, margin: 0 }}>
                    {copyright}
                </p>
            </div>
        </footer>
    );
}
