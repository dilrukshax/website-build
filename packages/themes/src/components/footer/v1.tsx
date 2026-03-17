import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface FooterColumn {
    title: string;
    links: Array<{ label: string; href: string }>;
}

interface SocialLink {
    platform: string;
    url: string;
}

function normalizeFooterColumns(raw: unknown): FooterColumn[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const record = (item && typeof item === 'object') ? item as Record<string, unknown> : {};
        const linksRaw = record.links;
        const links = Array.isArray(linksRaw)
            ? linksRaw.map((link) => {
                const linkRecord = (link && typeof link === 'object') ? link as Record<string, unknown> : {};
                return {
                    label: typeof linkRecord.label === 'string' ? linkRecord.label : '',
                    href: typeof linkRecord.href === 'string' ? linkRecord.href : '',
                };
            })
            : [];

        return {
            title: typeof record.title === 'string' ? record.title : '',
            links,
        };
    });
}

function normalizeSocialLinks(raw: unknown): SocialLink[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const record = (item && typeof item === 'object') ? item as Record<string, unknown> : {};
        return {
            platform: typeof record.platform === 'string' ? record.platform : '',
            url: typeof record.url === 'string' ? record.url : '',
        };
    });
}

export default function FooterV1({ content, styles, tokens }: ThemeComponentProps) {
    const copyrightText = content.copyrightText as string || `© ${new Date().getFullYear()} All rights reserved.`;
    const columns = normalizeFooterColumns(content.columns);
    const social = normalizeSocialLinks(content.social);
    const showSocial = styles.showSocial !== false;
    const poweredByText = 'Powered by My Online Web';
    const poweredByUrl = 'https://buildmyonlineweb.site';

    return (
        <footer style={{ padding: '80px 24px 32px', backgroundColor: '#111827', color: '#d1d5db', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {columns.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: '48px', marginBottom: '64px' }}>
                        {columns.map((col, i) => (
                            <div key={i}>
                                <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{col.title}</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {col.links.map((link, j) => (
                                        <li key={j}>
                                            <a 
                                                href={link.href} 
                                                style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '15px', transition: 'color 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ borderTop: '1px solid #374151', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>{copyrightText}</p>
                        {poweredByText && poweredByUrl && (
                            <a
                                href={poweredByUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '14px', color: '#9ca3af', margin: 0, textDecoration: 'none' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                {poweredByText}
                            </a>
                        )}
                    </div>
                    {showSocial && social.length > 0 && (
                        <div style={{ display: 'flex', gap: '24px' }}>
                            {social.map((s, i) => (
                                <a 
                                    key={i} 
                                    href={s.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '15px', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                >
                                    {s.platform}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}
