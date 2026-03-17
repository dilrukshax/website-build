'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface TeamMember {
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string;
}

const TEAM_V2_STYLES = `
.be-team-v2 {
    position: relative;
    overflow: hidden;
}

.be-team-v2__card {
    animation: be-team-v2-rise 420ms ease both;
    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.be-team-v2__card:hover {
    transform: translateY(-6px);
}

@keyframes be-team-v2-rise {
    0% {
        opacity: 0;
        transform: translateY(14px) scale(0.98);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 900px) {
    .be-team-v2__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

@media (max-width: 640px) {
    .be-team-v2__grid {
        grid-template-columns: 1fr !important;
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

function normalizeMembers(raw: unknown): TeamMember[] {
    const fallback: TeamMember[] = [
        { name: 'Amelia Carter', role: 'Creative Director', bio: 'Leads design strategy and brand storytelling.' },
        { name: 'Ethan Brooks', role: 'Lead Specialist', bio: 'Delivers premium client experiences and training.' },
        { name: 'Nora Singh', role: 'Client Success', bio: 'Ensures each customer journey feels seamless.' },
        { name: 'Liam Ford', role: 'Growth Operations', bio: 'Focuses on performance, systems, and service quality.' },
    ];

    if (!Array.isArray(raw)) {
        return fallback;
    }

    const members = raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const obj = item as Record<string, unknown>;
            const name = typeof obj.name === 'string' ? obj.name.trim() : '';
            const role = typeof obj.role === 'string' ? obj.role.trim() : '';
            const bio = typeof obj.bio === 'string' ? obj.bio.trim() : undefined;
            const photoUrl = typeof obj.photoUrl === 'string' ? obj.photoUrl.trim() : undefined;

            if (!name || !role) return null;

            return {
                name,
                role,
                ...(bio ? { bio } : {}),
                ...(photoUrl ? { photoUrl } : {}),
            } as TeamMember;
        })
        .filter((member): member is TeamMember => member !== null);

    return members.length > 0 ? members : fallback;
}

export default function TeamV2({ content, styles, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Meet Our Team';
    const subtitle = (content.subtitle as string) || 'A focused team combining craft, care, and consistency.';
    const members = normalizeMembers(content.members);

    const layout = (styles.layout as string) || 'grid';
    const showBio = styles.showBio !== false;
    const paddingPreset = (styles.padding as string) || 'large';

    const sectionPadding = {
        small: '64px 24px',
        medium: '88px 24px',
        large: '112px 24px',
    }[paddingPreset] || '112px 24px';

    const fontStack = `${tokens.font}, "Manrope", "Sora", "Avenir Next", sans-serif`;
    const gridColumns = layout === 'compact'
        ? 'repeat(3, minmax(0, 1fr))'
        : 'repeat(4, minmax(0, 1fr))';

    return (
        <section
            className="be-team-v2"
            style={{
                padding: sectionPadding,
                backgroundColor: tokens.background,
                fontFamily: fontStack,
                color: tokens.text,
            }}
        >
            <style>{TEAM_V2_STYLES}</style>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `radial-gradient(58% 70% at 8% 8%, ${withAlpha(tokens.primary, 0.12)} 0%, transparent 72%), radial-gradient(40% 56% at 92% 12%, ${withAlpha(tokens.secondary, 0.1)} 0%, transparent 72%)`,
                }}
            />

            <div style={{ maxWidth: 1260, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 42px auto' }}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(2rem, 4.8vw, 3.2rem)',
                            lineHeight: 1.15,
                            letterSpacing: '-0.03em',
                            fontWeight: 850,
                            color: tokens.text,
                        }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            style={{
                                margin: '14px 0 0 0',
                                color: withAlpha(tokens.text, 0.74),
                                fontSize: 'clamp(1rem, 1.9vw, 1.16rem)',
                                lineHeight: 1.72,
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </header>

                <div
                    className="be-team-v2__grid"
                    style={{
                        display: 'grid',
                        gap: 18,
                        gridTemplateColumns: gridColumns,
                    }}
                >
                    {members.map((member, index) => (
                        <article
                            key={`${member.name}-${member.role}-${index}`}
                            className="be-team-v2__card"
                            style={{
                                animationDelay: `${index * 85}ms`,
                                borderRadius: 18,
                                border: `1px solid ${withAlpha(tokens.primary, 0.18)}`,
                                background: `linear-gradient(155deg, ${withAlpha(tokens.background, 0.92)}, ${withAlpha(tokens.primary, 0.08)})`,
                                boxShadow: `0 16px 30px ${withAlpha(tokens.primary, 0.13)}`,
                                padding: '20px 18px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                {member.photoUrl ? (
                                    <img
                                        src={member.photoUrl}
                                        alt={member.name}
                                        style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: `2px solid ${withAlpha(tokens.primary, 0.32)}`,
                                            boxShadow: `0 8px 16px ${withAlpha(tokens.primary, 0.22)}`,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            fontSize: 20,
                                            background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                            boxShadow: `0 10px 20px ${withAlpha(tokens.primary, 0.24)}`,
                                        }}
                                    >
                                        {member.name.trim().charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div style={{ minWidth: 0 }}>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 18,
                                            lineHeight: 1.2,
                                            letterSpacing: '-0.015em',
                                            color: tokens.text,
                                        }}
                                    >
                                        {member.name}
                                    </h3>
                                    <div
                                        style={{
                                            marginTop: 6,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            borderRadius: 9999,
                                            padding: '6px 10px',
                                            border: `1px solid ${withAlpha(tokens.secondary, 0.26)}`,
                                            backgroundColor: withAlpha(tokens.secondary, 0.12),
                                            color: tokens.secondary,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {member.role}
                                    </div>
                                </div>
                            </div>

                            {showBio && member.bio && (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        lineHeight: 1.68,
                                        color: withAlpha(tokens.text, 0.74),
                                    }}
                                >
                                    {member.bio}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
