import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface TeamMember {
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string;
}

export default function TeamV1({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'Meet Our Team';
    const subtitle = (content.subtitle as string) || 'The passionate people behind our service';
    const members = (content.members as TeamMember[]) || [
        { name: 'Alex Johnson', role: 'Founder & Lead Specialist', bio: 'Over 10 years of experience in the industry.' },
        { name: 'Maria Garcia', role: 'Senior Therapist', bio: 'Certified professional with a passion for excellence.' },
        { name: 'James Lee', role: 'Client Relations', bio: 'Dedicated to ensuring every client has the best experience.' },
        { name: 'Priya Patel', role: 'Junior Specialist', bio: 'Fresh talent bringing new ideas and energy.' },
    ];

    return (
        <section style={{
            padding: '80px 24px',
            backgroundColor: tokens.background,
            fontFamily: tokens.font,
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Heading */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: tokens.text,
                        margin: '0 0 12px 0',
                        letterSpacing: '-0.5px',
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{ fontSize: '17px', color: '#6b7280', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Team Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '32px',
                }}>
                    {members.map((member, idx) => (
                        <div
                            key={idx}
                            style={{
                                textAlign: 'center',
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                padding: '32px 24px',
                                border: '1px solid #f3f4f6',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                        >
                            {/* Avatar */}
                            {member.photoUrl ? (
                                <img
                                    src={member.photoUrl}
                                    alt={member.name}
                                    style={{
                                        width: '96px',
                                        height: '96px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        marginBottom: '16px',
                                        border: `3px solid ${tokens.primary}22`,
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '96px',
                                    height: '96px',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0,
                                }}>
                                    {member.name?.charAt(0) || '?'}
                                </div>
                            )}

                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: tokens.text,
                                margin: '0 0 4px 0',
                            }}>
                                {member.name}
                            </h3>

                            <p style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: tokens.primary,
                                margin: '0 0 12px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                {member.role}
                            </p>

                            {member.bio && (
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}>
                                    {member.bio}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
