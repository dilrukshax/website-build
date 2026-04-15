import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface LogoItem {
    name: string;
    imageUrl?: string;
}

function normalizeLogos(content: Record<string, unknown>): LogoItem[] {
    const fromContent = Array.isArray(content.logos)
        ? content.logos
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const name = typeof record.name === 'string' ? record.name.trim() : '';
                const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl.trim() : '';
                if (!name) return null;
                return { name, imageUrl: imageUrl || undefined } as LogoItem;
            })
            .filter((item): item is LogoItem => item !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        { name: 'Stripe' },
        { name: 'Notion' },
        { name: 'Linear' },
        { name: 'Vercel' },
        { name: 'Figma' },
        { name: 'Loom' },
        { name: 'Intercom' },
        { name: 'HubSpot' },
    ];
}

export default function LogosV5({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'As Featured In';
    const logos = normalizeLogos(content);
    const sectionFont = tokens.font || '"Inter", sans-serif';

    // Duplicate logos to create seamless scroll loop
    const loopLogos = [...logos, ...logos];

    return (
        <>
            <style>{`
                .theme-v5-logos {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};

                    background: var(--v5-bg);
                    padding: 48px 0 64px;
                    overflow: hidden;
                    position: relative;
                }
                .theme-v5-logos::before,
                .theme-v5-logos::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 120px;
                    z-index: 2;
                    pointer-events: none;
                }
                .theme-v5-logos::before {
                    left: 0;
                    background: linear-gradient(to right, var(--v5-bg), transparent);
                }
                .theme-v5-logos::after {
                    right: 0;
                    background: linear-gradient(to left, var(--v5-bg), transparent);
                }
                .theme-v5-logos-eyebrow {
                    text-align: center;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--v5-text);
                    opacity: 0.45;
                    margin-bottom: 32px;
                }
                .theme-v5-logos-track-wrapper {
                    overflow: hidden;
                    width: 100%;
                }
                .theme-v5-logos-track {
                    display: flex;
                    width: max-content;
                    gap: 56px;
                    align-items: center;
                    animation: v5-logo-scroll 28s linear infinite;
                }
                .theme-v5-logos-track:hover {
                    animation-play-state: paused;
                }
                @keyframes v5-logo-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .theme-v5-logo-item {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    padding: 12px 24px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: var(--v5-secondary);
                    transition: border-color 0.2s ease, opacity 0.2s ease;
                    opacity: 0.6;
                }
                .theme-v5-logo-item:hover {
                    opacity: 1;
                    border-color: var(--v5-primary);
                }
                .theme-v5-logo-img {
                    height: 28px;
                    width: auto;
                    object-fit: contain;
                    filter: brightness(0) invert(1);
                    display: block;
                }
                .theme-v5-logo-name {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: var(--v5-text);
                    white-space: nowrap;
                }
                @media (max-width: 640px) {
                    .theme-v5-logos {
                        padding: 40px 0 48px;
                    }
                    .theme-v5-logos-track {
                        gap: 32px;
                    }
                }
            `}</style>

            <section className="theme-v5-logos" style={{ fontFamily: sectionFont }}>
                <p className="theme-v5-logos-eyebrow">{eyebrow}</p>
                <div className="theme-v5-logos-track-wrapper">
                    <div className="theme-v5-logos-track">
                        {loopLogos.map((logo, i) => (
                            <div key={`${logo.name}-${i}`} className="theme-v5-logo-item">
                                {logo.imageUrl ? (
                                    <img
                                        src={logo.imageUrl}
                                        alt={logo.name}
                                        className="theme-v5-logo-img"
                                    />
                                ) : (
                                    <span className="theme-v5-logo-name">{logo.name}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
