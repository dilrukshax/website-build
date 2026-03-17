import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface StatisticItem {
    value: string;
    label: string;
}

export default function AboutV2({ content, styles, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'About Our Company';
    const body = (content.body as string) || 'We have been providing exceptional service for over a decade. Our passion for excellence and dedication to our clients has made us a trusted leader in the industry.';
    const statsTitle = content.statsTitle as string | undefined;
    const statistics = (content.statistics as StatisticItem[]) || [
        { value: '10+', label: 'Years Experience' },
        { value: '5K+', label: 'Happy Clients' },
        { value: '99%', label: 'Satisfaction' },
        { value: '24/7', label: 'Support' },
    ];
    const ctaText = content.ctaText as string | undefined;
    const ctaLink = (content.ctaLink as string) || '#';

    // Styles
    const backgroundColor = (styles.backgroundColor as string) || tokens.background;
    
    // Check if background is dark to adjust text colors
    const isDarkBg = backgroundColor !== '#ffffff' && backgroundColor !== '#fff' && backgroundColor !== '#f9fafb';
    const textColor = isDarkBg ? '#fff' : tokens.text;
    const subtextColor = isDarkBg ? 'rgba(255,255,255,0.8)' : '#6b7280';

    return (
        <section style={{
            padding: '100px 24px',
            backgroundColor: backgroundColor,
            fontFamily: tokens.font,
            color: textColor,
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: '80px',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                {/* Left: Text Content */}
                <div style={{ flex: '1 1 500px' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: `${tokens.primary}15`,
                        color: isDarkBg ? '#fff' : tokens.primary,
                        borderRadius: '100px',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '20px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                    }}>
                        Our Story
                    </div>
                    
                    <h2 style={{
                        fontSize: 'clamp(32px, 4vw, 48px)',
                        fontWeight: 800,
                        margin: '0 0 24px 0',
                        lineHeight: 1.2,
                        letterSpacing: '-1px',
                    }}>
                        {title}
                    </h2>
                    
                    <p style={{
                        fontSize: '18px',
                        lineHeight: 1.7,
                        color: subtextColor,
                        margin: '0 0 32px 0',
                        whiteSpace: 'pre-wrap',
                    }}>
                        {body}
                    </p>

                    {ctaText && (
                        <a href={ctaLink} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: isDarkBg ? '#fff' : tokens.primary,
                            fontWeight: 600,
                            fontSize: '16px',
                            textDecoration: 'none',
                            transition: 'opacity 0.2s',
                        }}
                           onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                           onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {ctaText}
                            <span style={{ fontSize: '20px' }}>→</span>
                        </a>
                    )}
                </div>

                {/* Right: Statistics Grid */}
                <div style={{ flex: '1 1 400px' }}>
                    <div style={{
                        backgroundColor: isDarkBg ? 'rgba(255,255,255,0.05)' : '#fff',
                        borderRadius: '24px',
                        padding: '48px',
                        boxShadow: isDarkBg ? 'none' : '0 20px 40px rgba(0,0,0,0.06)',
                        border: isDarkBg ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f3f4f6',
                    }}>
                        {statsTitle && (
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                margin: '0 0 32px 0',
                                textAlign: 'center',
                            }}>
                                {statsTitle}
                            </h3>
                        )}
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '40px',
                        }}>
                            {statistics.map((stat, idx) => (
                                <div key={idx} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: 'clamp(36px, 4vw, 48px)',
                                        fontWeight: 800,
                                        color: isDarkBg ? '#fff' : tokens.primary,
                                        lineHeight: 1,
                                        margin: '0 0 8px 0',
                                        letterSpacing: '-1px',
                                    }}>
                                        {stat.value}
                                    </div>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        color: subtextColor,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
