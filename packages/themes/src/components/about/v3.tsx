'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface StoryPoint {
    year?: string;
    title: string;
    description?: string;
}

const ABOUT_V3_STYLES = `
.be-about-v3 {
    position: relative;
    overflow: hidden;
}

.be-about-v3__timeline-item {
    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.be-about-v3__timeline-item:hover {
    transform: translateY(-4px);
}

@media (max-width: 980px) {
    .be-about-v3__layout {
        grid-template-columns: 1fr !important;
        gap: 24px !important;
    }
}
`;

function withAlpha(hexOrColor: string, alpha: number): string {
    const normalized = hexOrColor.trim().replace('#', '');
    const full = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(full)) {
        return hexOrColor;
    }

    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeStringArray(raw: unknown, fallback: string[]): string[] {
    if (!Array.isArray(raw)) {
        return fallback;
    }

    const values = raw
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);

    return values.length > 0 ? values : fallback;
}

function normalizeStoryPoints(raw: unknown): StoryPoint[] {
    const fallback: StoryPoint[] = [
        { year: '2018', title: 'Started with a small team', description: 'We launched with a mission to provide exceptional client care.' },
        { year: '2021', title: 'Expanded services', description: 'Introduced new offerings based on customer demand and feedback.' },
        { year: '2024', title: 'Scaled operations', description: 'Built reliable processes and a stronger specialist team.' },
    ];

    if (!Array.isArray(raw)) {
        return fallback;
    }

    const points = raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const obj = item as Record<string, unknown>;
            const title = typeof obj.title === 'string' ? obj.title.trim() : '';
            const year = typeof obj.year === 'string' ? obj.year.trim() : undefined;
            const description = typeof obj.description === 'string' ? obj.description.trim() : undefined;
            if (!title) return null;
            return {
                ...(year ? { year } : {}),
                title,
                ...(description ? { description } : {}),
            } as StoryPoint;
        })
        .filter((point): point is StoryPoint => point !== null);

    return points.length > 0 ? points : fallback;
}

export default function AboutV3({ content, styles, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Our Journey';
    const title = (content.title as string) || 'Built on trust, refined through experience';
    const body = (content.body as string) || 'We combine thoughtful strategy, practical execution, and consistent communication to help our clients grow with confidence.';
    const quoteText = content.quoteText as string | undefined;
    const quoteAuthor = content.quoteAuthor as string | undefined;
    const ctaText = content.ctaText as string | undefined;
    const ctaLink = (content.ctaLink as string) || '#';
    const highlights = normalizeStringArray(content.highlights, ['Client-first service', 'Transparent process', 'Long-term partnership']);
    const storyPoints = normalizeStoryPoints(content.storyPoints);

    const backgroundMode = (styles.backgroundMode as string) || 'soft';
    const cardStyle = (styles.cardStyle as string) || 'glass';
    const paddingPreset = (styles.padding as string) || 'large';

    const sectionPadding = {
        small: '64px 24px',
        medium: '88px 24px',
        large: '112px 24px',
    }[paddingPreset] || '112px 24px';

    const background = backgroundMode === 'solid'
        ? tokens.background
        : `linear-gradient(180deg, ${withAlpha(tokens.primary, 0.06)} 0%, ${tokens.background} 35%, ${withAlpha(tokens.secondary, 0.06)} 100%)`;

    const panelBackground = cardStyle === 'solid'
        ? withAlpha(tokens.background, 1)
        : `linear-gradient(150deg, ${withAlpha(tokens.background, 0.88)}, ${withAlpha(tokens.primary, 0.08)})`;

    const fontStack = `${tokens.font}, "Sora", "Manrope", "Avenir Next", sans-serif`;

    return (
        <section
            className="be-about-v3"
            style={{
                padding: sectionPadding,
                background,
                fontFamily: fontStack,
                color: tokens.text,
            }}
        >
            <style>{ABOUT_V3_STYLES}</style>
            <div style={{ maxWidth: 1240, margin: '0 auto' }}>
                <div
                    className="be-about-v3__layout"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 32,
                        alignItems: 'start',
                    }}
                >
                    <div
                        style={{
                            borderRadius: 22,
                            border: `1px solid ${withAlpha(tokens.primary, 0.2)}`,
                            background: panelBackground,
                            boxShadow: `0 24px 44px ${withAlpha(tokens.primary, 0.14)}`,
                            padding: '28px 26px',
                            backdropFilter: cardStyle === 'glass' ? 'blur(8px)' : undefined,
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                borderRadius: 9999,
                                padding: '8px 12px',
                                border: `1px solid ${withAlpha(tokens.secondary, 0.28)}`,
                                backgroundColor: withAlpha(tokens.secondary, 0.12),
                                color: tokens.secondary,
                                fontWeight: 700,
                                fontSize: 12,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    backgroundColor: tokens.accent,
                                }}
                            />
                            {eyebrow}
                        </div>

                        <h2
                            style={{
                                margin: '16px 0 0 0',
                                fontSize: 'clamp(2rem, 4.2vw, 3.1rem)',
                                lineHeight: 1.14,
                                letterSpacing: '-0.03em',
                                fontWeight: 850,
                                color: tokens.text,
                            }}
                        >
                            {title}
                        </h2>

                        <p
                            style={{
                                margin: '16px 0 0 0',
                                fontSize: 'clamp(1rem, 1.9vw, 1.14rem)',
                                lineHeight: 1.74,
                                color: withAlpha(tokens.text, 0.76),
                            }}
                        >
                            {body}
                        </p>

                        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {highlights.map((highlight) => (
                                <span
                                    key={highlight}
                                    style={{
                                        borderRadius: 9999,
                                        border: `1px solid ${withAlpha(tokens.primary, 0.25)}`,
                                        backgroundColor: withAlpha(tokens.primary, 0.1),
                                        padding: '8px 12px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: withAlpha(tokens.text, 0.82),
                                    }}
                                >
                                    {highlight}
                                </span>
                            ))}
                        </div>

                        {(quoteText || quoteAuthor) && (
                            <div
                                style={{
                                    marginTop: 22,
                                    borderRadius: 14,
                                    padding: '16px 16px',
                                    border: `1px solid ${withAlpha(tokens.secondary, 0.2)}`,
                                    backgroundColor: withAlpha(tokens.secondary, 0.1),
                                }}
                            >
                                {quoteText && (
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 15,
                                            lineHeight: 1.68,
                                            color: withAlpha(tokens.text, 0.8),
                                        }}
                                    >
                                        "{quoteText}"
                                    </p>
                                )}
                                {quoteAuthor && (
                                    <p
                                        style={{
                                            margin: '10px 0 0 0',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: tokens.secondary,
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {quoteAuthor}
                                    </p>
                                )}
                            </div>
                        )}

                        {ctaText && (
                            <a
                                href={ctaLink}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 22,
                                    textDecoration: 'none',
                                    borderRadius: 12,
                                    padding: '12px 18px',
                                    color: '#ffffff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                    boxShadow: `0 14px 24px ${withAlpha(tokens.primary, 0.24)}`,
                                }}
                            >
                                {ctaText}
                            </a>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gap: 14,
                        }}
                    >
                        {storyPoints.map((point, index) => (
                            <article
                                key={`${point.title}-${index}`}
                                className="be-about-v3__timeline-item"
                                style={{
                                    borderRadius: 18,
                                    border: `1px solid ${withAlpha(tokens.text, 0.12)}`,
                                    background: withAlpha(tokens.background, 0.9),
                                    boxShadow: `0 14px 28px ${withAlpha(tokens.text, 0.08)}`,
                                    padding: '18px 18px',
                                }}
                            >
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 11,
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                            boxShadow: `0 10px 18px ${withAlpha(tokens.primary, 0.26)}`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    <div>
                                        {point.year && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: tokens.secondary,
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {point.year}
                                            </div>
                                        )}
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: 20,
                                                lineHeight: 1.18,
                                                letterSpacing: '-0.015em',
                                                color: tokens.text,
                                            }}
                                        >
                                            {point.title}
                                        </h3>
                                        {point.description && (
                                            <p
                                                style={{
                                                    margin: '10px 0 0 0',
                                                    fontSize: 15,
                                                    lineHeight: 1.68,
                                                    color: withAlpha(tokens.text, 0.72),
                                                }}
                                            >
                                                {point.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
