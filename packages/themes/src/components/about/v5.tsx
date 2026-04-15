'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface ListItem {
    text: string;
}

function normalizeListItems(content: Record<string, unknown>): ListItem[] {
    const fromContent = Array.isArray(content.items)
        ? content.items
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const text = typeof record.text === 'string' ? record.text.trim() : '';

                if (!text) {
                    return null;
                }

                return { text } as ListItem;
            })
            .filter((item): item is ListItem => item !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        { text: 'Done-for-you Funnels ready to convert in days.' },
        { text: 'Pre-written email sequences integrated instantly.' },
        { text: 'High-Ticket calendars configured for your sales team.' },
    ];
}

export default function AboutV5({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Go Live Fast — The Sooner You Launch, the Sooner You Profit';
    const subtitle = (content.subtitle as string) || 'Stop waiting months for your IT team to stitch 15 different tools together.';
    const body = (content.body as string) || '';
    const items = normalizeListItems(content);
    const imageUrl = (content.imageUrl as string) || 'https://placehold.co/800x1200/151f38/ffffff?text=Launch+System';
    const ctaText = (content.ctaText as string) || "Let's Build Your Funnel";
    const ctaLink = ((content.ctaLink as string) || '#booking-widget').trim();

    return (
        <>
            <style>{`
                .theme-v5-about {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};
                    --v5-glow: ${tokens.primary ? tokens.primary + '26' : 'rgba(234, 179, 8, 0.15)'};

                    background: var(--v5-bg);
                    color: var(--v5-text);
                    padding: 120px 20px;
                    position: relative;
                    overflow: hidden;
                }
                .theme-v5-about::before {
                    content: '';
                    position: absolute;
                    top: 20%;
                    left: -10%;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    background: radial-gradient(circle, var(--v5-glow), transparent 70%);
                    pointer-events: none;
                }
                .theme-v5-about-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 80px;
                    align-items: center;
                }
                .theme-v5-about-image-wrapper {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid var(--v5-primary);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), 0 0 40px var(--v5-glow);
                }
                .theme-v5-about-image-wrapper::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
                    pointer-events: none;
                }
                .theme-v5-about-image {
                    width: 100%;
                    height: auto;
                    display: block;
                    aspect-ratio: 3/4;
                    object-fit: cover;
                }
                .theme-v5-about-kicker {
                    display: inline-block;
                    color: var(--v5-primary);
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                }
                .theme-v5-about-title {
                    font-size: clamp(32px, 4vw, 46px);
                    line-height: 1.15;
                    letter-spacing: -0.02em;
                    font-weight: 800;
                    margin: 0 0 24px;
                }
                .theme-v5-about-subtitle {
                    color: var(--v5-text);
                    opacity: 0.8;
                    font-size: 18px;
                    line-height: 1.7;
                    margin: 0 0 32px;
                }
                .theme-v5-about-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .theme-v5-about-list-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    font-size: 16px;
                    line-height: 1.6;
                    opacity: 0.9;
                }
                .theme-v5-about-list-icon {
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    background: var(--v5-secondary);
                    color: var(--v5-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 2px;
                }
                .theme-v5-about-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px 32px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 800;
                    text-decoration: none;
                    text-transform: uppercase;
                    background: var(--v5-accent);
                    color: #ffffff;
                    box-shadow: 0 12px 28px rgba(220, 38, 38, 0.35);
                    transition: transform 0.2s ease, filter 0.2s ease;
                }
                .theme-v5-about-cta:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }

                @media (max-width: 960px) {
                    .theme-v5-about-inner {
                        grid-template-columns: 1fr;
                        gap: 56px;
                    }
                    .theme-v5-about-image {
                        aspect-ratio: 16/9;
                    }
                }
                @media (max-width: 640px) {
                    .theme-v5-about {
                        padding: 80px 16px;
                    }
                }
            `}</style>
            <section className="theme-v5-about" id="about" style={{ fontFamily: tokens.font }}>
                <div className="theme-v5-about-inner">
                    <div className="theme-v5-about-image-wrapper">
                        <img src={imageUrl} alt="System Architecture" className="theme-v5-about-image" />
                    </div>
                    <div className="theme-v5-about-content">
                        <span className="theme-v5-about-kicker">Built For Speed</span>
                        <h2 className="theme-v5-about-title">{title}</h2>
                        {subtitle && <p className="theme-v5-about-subtitle">{subtitle}</p>}
                        {body && <p className="theme-v5-about-subtitle">{body}</p>}
                        
                        <ul className="theme-v5-about-list">
                            {items.map((item, index) => (
                                <li key={index} className="theme-v5-about-list-item">
                                    <span className="theme-v5-about-list-icon">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>

                        <a href={ctaLink} className="theme-v5-about-cta">
                            {ctaText}
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
