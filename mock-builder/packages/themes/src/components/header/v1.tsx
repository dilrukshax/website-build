import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface MenuItem {
    label: string;
    href: string;
}

export default function HeaderV1({ content, styles, tokens }: ThemeComponentProps) {
    const logoUrl = content.logoUrl as string | undefined;
    const projectIcon = content.projectIcon as string | undefined;
    const iconUrl = projectIcon || logoUrl;
    const projectName = (content.projectName as string | undefined) || (content.logoAlt as string | undefined) || 'Your Project';
    const iconLetter = projectName.trim().charAt(0).toUpperCase() || 'P';
    const menu = (content.menu as MenuItem[]) || [];
    const isSticky = styles.sticky as boolean;

    return (
        <header
            style={{
                position: isSticky ? 'sticky' : 'relative',
                top: 0,
                zIndex: 50,
                backgroundColor: tokens.background,
                boxShadow: isSticky ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none',
                borderBottom: isSticky ? 'none' : '1px solid #e5e7eb',
                fontFamily: tokens.font,
                transition: 'all 0.3s ease',
            }}
        >
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            height: '44px',
                            width: '44px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: `${tokens.primary}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${tokens.primary}40`,
                            flexShrink: 0,
                        }}
                    >
                        {iconUrl ? (
                            <img src={iconUrl} alt={`${projectName} icon`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '18px', fontWeight: 800, color: tokens.primary }}>{iconLetter}</span>
                        )}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: tokens.primary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {projectName}
                    </div>
                </div>
                <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    {menu.length > 0 ? menu.map((item, i) => (
                        <a
                            key={i}
                            href={item.href}
                            style={{ 
                                color: tokens.text, 
                                textDecoration: 'none', 
                                fontSize: '15px', 
                                fontWeight: 500,
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = tokens.primary}
                            onMouseLeave={(e) => e.currentTarget.style.color = tokens.text}
                        >
                            {item.label}
                        </a>
                    )) : (
                        <>
                            <span style={{ color: '#9ca3af', fontSize: '15px', fontWeight: 500 }}>Home</span>
                            <span style={{ color: '#9ca3af', fontSize: '15px', fontWeight: 500 }}>About</span>
                            <span style={{ color: '#9ca3af', fontSize: '15px', fontWeight: 500 }}>Services</span>
                            <span style={{ color: '#9ca3af', fontSize: '15px', fontWeight: 500 }}>Contact</span>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
