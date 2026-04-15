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

function toAnchor(label: string): string {
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    return normalized ? `#${normalized}` : '#footer';
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

                            if (!label) {
                                return null;
                            }

                            return {
                                label,
                                href: href || toAnchor(label),
                            } as FooterLink;
                        })
                        .filter((item): item is FooterLink => item !== null)
                    : [];

                if (!title || links.length === 0) {
                    return null;
                }

                return {
                    title,
                    links,
                } as FooterColumn;
            })
            .filter((column): column is FooterColumn => column !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        {
            title: 'Explore',
            links: [
                { label: 'Overview', href: '#hero' },
                { label: 'Features', href: '#features' },
                { label: 'Reviews', href: '#reviews' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Questions', href: '#questions' },
                { label: 'Demo', href: '#video' },
                { label: 'Start', href: '#hero' },
            ],
        },
    ];
}

export default function FooterV5({ content, tokens }: ThemeComponentProps) {
    const businessName = (content.businessName as string) || (content.projectName as string) || 'Signal Horizon';
    const description = (content.text as string) || 'A polished free marketing theme with strong contrast, responsive sections, and clean content structure.';
    const copyrightText = (content.copyrightText as string)
        || `Copyright ${new Date().getFullYear()} ${businessName}. All rights reserved.`;
    const columns = normalizeColumns(content);
    const sectionFont = tokens.font || '"Inter", sans-serif';

    return (
        <>
            <style>{`
                .theme-v5-footer {
                    --v5-bg: ${tokens.background || '#0a1020'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};

                    background: var(--v5-bg);
                    color: var(--v5-text);
                    padding: 72px 20px 28px;
                    border-top: 1px solid var(--v5-primary);
                }
                .theme-v5-footer-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                }
                .theme-v5-footer-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(180px, 240px));
                    gap: 28px;
                    align-items: start;
                    margin-bottom: 36px;
                }
                .theme-v5-footer-brand {
                    max-width: 440px;
                }
                .theme-v5-footer-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 800;
                    color: var(--v5-bg);
                    background: var(--v5-primary);
                    margin-bottom: 18px;
                }
                .theme-v5-footer-brand h3 {
                    margin: 0 0 12px;
                    font-size: 28px;
                    line-height: 1.1;
                }
                .theme-v5-footer-brand p {
                    margin: 0;
                    color: #a0aec0;
                    font-size: 16px;
                    line-height: 1.8;
                }
                .theme-v5-footer-column h4 {
                    margin: 0 0 14px;
                    color: var(--v5-text);
                    opacity: 0.9;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                }
                .theme-v5-footer-column ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .theme-v5-footer-column a {
                    color: #a0aec0;
                    text-decoration: none;
                    font-size: 15px;
                    transition: color 0.2s ease, transform 0.2s ease;
                }
                .theme-v5-footer-column a:hover {
                    color: var(--v5-text);
                    transform: translateX(2px);
                }
                .theme-v5-footer-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    padding-top: 22px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    color: #a0aec0;
                    font-size: 14px;
                }
                @media (max-width: 900px) {
                    .theme-v5-footer-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
                @media (max-width: 640px) {
                    .theme-v5-footer {
                        padding: 56px 16px 24px;
                    }
                    .theme-v5-footer-grid {
                        grid-template-columns: 1fr;
                    }
                    .theme-v5-footer-bottom {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>

            <footer className="theme-v5-footer" id="footer" style={{ fontFamily: sectionFont }}>
                <div className="theme-v5-footer-inner">
                    <div className="theme-v5-footer-grid">
                        <div className="theme-v5-footer-brand">
                            <span className="theme-v5-footer-badge">{businessName.charAt(0).toUpperCase()}</span>
                            <h3>{businessName}</h3>
                            <p>{description}</p>
                        </div>

                        {columns.map((column) => (
                            <div key={column.title} className="theme-v5-footer-column">
                                <h4>{column.title}</h4>
                                <ul>
                                    {column.links.map((link) => (
                                        <li key={`${link.label}-${link.href}`}>
                                            <a href={link.href}>{link.label}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="theme-v5-footer-bottom">
                        <span>{copyrightText}</span>
                        <span>Designed for flexible landing pages</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
