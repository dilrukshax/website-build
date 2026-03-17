'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

const HERO_V3_STYLES = `
.be-hero-v3 {
    position: relative;
    isolation: isolate;
    overflow: hidden;
}

.be-hero-v3__orb {
    position: absolute;
    border-radius: 9999px;
    pointer-events: none;
    animation: be-hero-v3-float 16s ease-in-out infinite;
}

.be-hero-v3__orb--slow {
    animation-duration: 22s;
}

.be-hero-v3__word {
    display: inline-block;
    animation: be-hero-v3-word-in 360ms ease-out;
}

.be-hero-v3__chip {
    transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.be-hero-v3__chip:hover {
    transform: translateY(-2px);
}

.be-hero-v3__primary-button {
    transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease;
}

.be-hero-v3__primary-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.02);
}

.be-hero-v3__secondary-button {
    transition: background-color 200ms ease, color 200ms ease, transform 200ms ease;
}

.be-hero-v3__secondary-button:hover {
    transform: translateY(-2px);
}

@keyframes be-hero-v3-float {
    0% {
        transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
        transform: translate3d(22px, -28px, 0) scale(1.12);
    }
    100% {
        transform: translate3d(0, 0, 0) scale(1);
    }
}

@keyframes be-hero-v3-word-in {
    0% {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 960px) {
    .be-hero-v3__layout {
        grid-template-columns: 1fr !important;
        gap: 36px !important;
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

function asStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const normalized = value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);

    return normalized.length > 0 ? normalized : fallback;
}

export default function HeroV3({ content, styles, tokens, isEditor }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Modern booking websites';
    const titleLead = (content.titleLead as string) || 'Design pages that convert';
    const rotatingWords = asStringArray(content.rotatingWords, ['appointments', 'consultations', 'memberships']);
    const subtitle = (content.subtitle as string)
        || 'Launch high-impact pages with smooth motion, clean hierarchy, and fast booking flow.';
    const ctaTextPrimary = (content.ctaTextPrimary as string) || 'Start Building';
    const ctaLinkPrimary = (content.ctaLinkPrimary as string) || '#';
    const ctaTextSecondary = (content.ctaTextSecondary as string) || 'See Live Demo';
    const ctaLinkSecondary = (content.ctaLinkSecondary as string) || '#';
    const trustLabel = (content.trustLabel as string) || 'Trusted by ambitious teams';
    const trustItems = asStringArray(content.trustItems, ['Fast setup', 'Conversion-ready', 'Easy to edit']);
    const showcaseTitle = (content.showcaseTitle as string) || 'What makes this hero effective';
    const showcaseBullets = asStringArray(content.showcaseBullets, [
        'Rotating headline keeps attention on key outcomes',
        'Clear visual hierarchy for faster decision-making',
        'Balanced call-to-action pair for primary and secondary intent',
    ]);

    const paddingPreset = (styles.padding as string) || 'large';
    const textAlign = (styles.textAlign as string) || 'left';
    const showOrbs = styles.showOrbs !== false;
    const glassCard = styles.glassCard !== false;

    const [activeWordIndex, setActiveWordIndex] = useState(0);

    useEffect(() => {
        if (isEditor || rotatingWords.length < 2) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            setActiveWordIndex((prev) => (prev + 1) % rotatingWords.length);
        }, 2600);

        return () => window.clearInterval(interval);
    }, [isEditor, rotatingWords.length]);

    const activeWord = rotatingWords[activeWordIndex] || rotatingWords[0] || 'growth';
    const padding = {
        small: '56px 24px',
        medium: '88px 24px',
        large: '120px 24px',
    }[paddingPreset] || '120px 24px';

    const alignText = textAlign === 'center' ? 'center' : 'left';
    const titleGradient = `linear-gradient(120deg, ${tokens.primary}, ${tokens.accent})`;
    const fontStack = `${tokens.font}, "Sora", "Space Grotesk", "Avenir Next", sans-serif`;

    const trustChipShadow = useMemo(() => `0 12px 28px ${withAlpha(tokens.primary, 0.14)}`, [tokens.primary]);

    return (
        <section
            className="be-hero-v3"
            style={{
                padding,
                backgroundColor: tokens.background,
                color: tokens.text,
                fontFamily: fontStack,
            }}
        >
            <style>{HERO_V3_STYLES}</style>

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(60% 70% at 10% 8%, ${withAlpha(tokens.primary, 0.16)} 0%, transparent 72%), radial-gradient(45% 52% at 90% 10%, ${withAlpha(tokens.secondary, 0.16)} 0%, transparent 70%), linear-gradient(180deg, ${withAlpha(tokens.accent, 0.06)} 0%, transparent 48%)`,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            {showOrbs && (
                <>
                    <div
                        className="be-hero-v3__orb"
                        style={{
                            width: 240,
                            height: 240,
                            top: '-64px',
                            right: '8%',
                            background: `radial-gradient(circle at 30% 30%, ${withAlpha(tokens.primary, 0.42)}, ${withAlpha(tokens.primary, 0.12)})`,
                            filter: 'blur(2px)',
                            zIndex: 0,
                        }}
                    />
                    <div
                        className="be-hero-v3__orb be-hero-v3__orb--slow"
                        style={{
                            width: 190,
                            height: 190,
                            bottom: '-80px',
                            left: '6%',
                            background: `radial-gradient(circle at 40% 40%, ${withAlpha(tokens.secondary, 0.36)}, ${withAlpha(tokens.secondary, 0.1)})`,
                            zIndex: 0,
                        }}
                    />
                </>
            )}

            <div
                className="be-hero-v3__layout"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: 1240,
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: 56,
                    alignItems: 'center',
                }}
            >
                <div style={{ textAlign: alignText }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            borderRadius: 9999,
                            border: `1px solid ${withAlpha(tokens.primary, 0.35)}`,
                            backgroundColor: withAlpha(tokens.primary, 0.09),
                            color: tokens.primary,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '8px 14px',
                            marginBottom: 24,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 9999,
                                backgroundColor: tokens.accent,
                                boxShadow: `0 0 0 5px ${withAlpha(tokens.accent, 0.18)}`,
                            }}
                        />
                        {eyebrow}
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: 'clamp(2.2rem, 5.8vw, 4.35rem)',
                            lineHeight: 1.05,
                            letterSpacing: '-0.04em',
                            fontWeight: 850,
                            color: tokens.text,
                            maxWidth: textAlign === 'center' ? 820 : 680,
                            marginInline: textAlign === 'center' ? 'auto' : undefined,
                        }}
                    >
                        {titleLead}
                        {' '}
                        <span
                            style={{
                                background: titleGradient,
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                minWidth: '7ch',
                            }}
                        >
                            <span key={activeWord} className="be-hero-v3__word">
                                {activeWord}
                            </span>
                        </span>
                    </h1>

                    <p
                        style={{
                            margin: '20px 0 0 0',
                            color: withAlpha(tokens.text, 0.75),
                            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                            lineHeight: 1.7,
                            maxWidth: textAlign === 'center' ? 760 : 620,
                            marginInline: textAlign === 'center' ? 'auto' : undefined,
                        }}
                    >
                        {subtitle}
                    </p>

                    <div
                        style={{
                            marginTop: 32,
                            display: 'flex',
                            gap: 14,
                            justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
                            flexWrap: 'wrap',
                        }}
                    >
                        <a
                            href={ctaLinkPrimary}
                            className="be-hero-v3__primary-button"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                borderRadius: 14,
                                padding: '14px 24px',
                                color: '#ffffff',
                                fontSize: 15,
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                boxShadow: `0 18px 30px ${withAlpha(tokens.primary, 0.28)}`,
                            }}
                        >
                            {ctaTextPrimary}
                        </a>

                        <a
                            href={ctaLinkSecondary}
                            className="be-hero-v3__secondary-button"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                borderRadius: 14,
                                padding: '14px 24px',
                                fontSize: 15,
                                fontWeight: 700,
                                border: `1px solid ${withAlpha(tokens.text, 0.2)}`,
                                color: tokens.text,
                                backgroundColor: withAlpha(tokens.background, 0.8),
                                backdropFilter: 'blur(6px)',
                            }}
                            onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor = withAlpha(tokens.primary, 0.1);
                                event.currentTarget.style.color = tokens.primary;
                            }}
                            onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor = withAlpha(tokens.background, 0.8);
                                event.currentTarget.style.color = tokens.text;
                            }}
                        >
                            {ctaTextSecondary}
                        </a>
                    </div>

                    <div style={{ marginTop: 30 }}>
                        <div
                            style={{
                                fontSize: 13,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                color: withAlpha(tokens.text, 0.55),
                                marginBottom: 12,
                            }}
                        >
                            {trustLabel}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 10,
                                justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
                            }}
                        >
                            {trustItems.map((item) => (
                                <span
                                    key={item}
                                    className="be-hero-v3__chip"
                                    style={{
                                        borderRadius: 9999,
                                        border: `1px solid ${withAlpha(tokens.primary, 0.24)}`,
                                        padding: '9px 13px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: withAlpha(tokens.text, 0.85),
                                        backgroundColor: withAlpha(tokens.background, 0.72),
                                        boxShadow: trustChipShadow,
                                    }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <aside
                    style={{
                        borderRadius: 26,
                        border: `1px solid ${withAlpha(tokens.primary, glassCard ? 0.2 : 0.14)}`,
                        background: glassCard
                            ? `linear-gradient(145deg, ${withAlpha(tokens.background, 0.84)}, ${withAlpha(tokens.background, 0.63)})`
                            : withAlpha(tokens.background, 0.98),
                        backdropFilter: glassCard ? 'blur(10px)' : undefined,
                        boxShadow: `0 30px 60px ${withAlpha(tokens.primary, 0.16)}`,
                        padding: '30px 28px',
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 24,
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em',
                            color: tokens.text,
                        }}
                    >
                        {showcaseTitle}
                    </h3>
                    <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
                        {showcaseBullets.map((point, index) => (
                            <div
                                key={point}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '24px 1fr',
                                    gap: 10,
                                    alignItems: 'flex-start',
                                    opacity: 0.96,
                                }}
                            >
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 8,
                                        marginTop: 2,
                                        background: `linear-gradient(135deg, ${withAlpha(tokens.primary, 0.95)}, ${withAlpha(tokens.accent, 0.95)})`,
                                        color: '#fff',
                                        fontWeight: 700,
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 13,
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 15,
                                        lineHeight: 1.6,
                                        color: withAlpha(tokens.text, 0.8),
                                    }}
                                >
                                    {point}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            marginTop: 22,
                            borderRadius: 12,
                            border: `1px solid ${withAlpha(tokens.secondary, 0.2)}`,
                            background: `linear-gradient(90deg, ${withAlpha(tokens.secondary, 0.1)} 0%, ${withAlpha(tokens.accent, 0.11)} 100%)`,
                            padding: '12px 14px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: withAlpha(tokens.text, 0.75),
                        }}
                    >
                        Built with animated headline rotation and interaction-ready CTA behavior.
                    </div>
                </aside>
            </div>
        </section>
    );
}
