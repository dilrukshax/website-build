import React from 'react';
import type { ThemeComponentProps } from '../../types';

type FooterLink = {
    label: string;
    href: string;
};

function normalizeLinks(content: Record<string, unknown>): FooterLink[] {
    const fallback: FooterLink[] = [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
    ];

    if (!Array.isArray(content.links)) {
        return fallback;
    }

    const links = content.links
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const record = entry as Record<string, unknown>;
            const label = typeof record.label === 'string' ? record.label.trim() : '';
            const href = typeof record.href === 'string' ? record.href.trim() : '';
            if (!label) return null;
            return { label, href: href || '#' } as FooterLink;
        })
        .filter((entry): entry is FooterLink => Boolean(entry));

    return links.length > 0 ? links : fallback;
}

function resolveHref(href: string, context: ThemeComponentProps['context'], isEditor?: boolean): string {
    if (!isEditor || !context?.subdomain) {
        return href;
    }

    if (href === '/blog') {
        return `/preview/${encodeURIComponent(context.subdomain)}/blog`;
    }

    if (href === '/') {
        return `/preview/${encodeURIComponent(context.subdomain)}`;
    }

    return href;
}

export default function FooterV15({ content, tokens, context, isEditor }: ThemeComponentProps) {
    const brand = (content.businessName as string) || 'train of thought';
    const body = (content.text as string) || 'Notes on writing, work, and everyday life.';
    const copyright = (content.copyrightText as string)
        || `© ${new Date().getFullYear()} ${brand}`;
    const links = normalizeLinks(content);

    return (
        <footer
            id="contact"
            style={{
                background: '#ecebe6',
                borderTop: '1px solid #d7d4ca',
                padding: '44px 16px 28px',
                fontFamily: tokens.font,
            }}
        >
            <div
                style={{
                    maxWidth: '1120px',
                    margin: '0 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '24px',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div style={{ maxWidth: '520px' }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 'clamp(26px, 4.2vw, 42px)',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            textTransform: 'lowercase',
                            color: '#181818',
                            fontWeight: 700,
                        }}
                    >
                        {brand}
                    </p>
                    <p
                        style={{
                            margin: '14px 0 0',
                            fontSize: '15px',
                            lineHeight: 1.8,
                            color: '#4f4c45',
                        }}
                    >
                        {body}
                    </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px' }}>
                    {links.map((link) => (
                        <a
                            key={`${link.label}-${link.href}`}
                            href={resolveHref(link.href, context, isEditor)}
                            data-editor-nav="allow"
                            style={{
                                textDecoration: 'none',
                                color: '#2e2c28',
                                fontSize: '13px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '1120px', margin: '22px auto 0' }}>
                <p style={{ margin: 0, color: '#69665f', fontSize: '12px', letterSpacing: '0.04em' }}>{copyright}</p>
            </div>
        </footer>
    );
}
