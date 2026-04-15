import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getReadableTextColor } from '../shared/color-contrast';

export default function PricingV3({ content, tokens }: ThemeComponentProps) {
    const title = content.title as string || 'Pick your adventure!';
    const subtitle = content.subtitle as string || 'Tickets to the most fun ride of your life';
    const plans = (content.plans as { name: string, price: string, features: string[], cta: string }[]) || [
        { name: 'Joyride', price: '$15', features: ['1 User', 'Basic features', 'Standard support'], cta: 'Hop On!' },
        { name: 'Rollercoaster', price: '$49', features: ['5 Users', 'All features', 'Priority support', 'Special badges'], cta: 'Let\'s Gooo!' },
        { name: 'VIP Pass', price: '$99', features: ['Unlimited Users', 'Infinite fun', '24/7 VIP help', 'Everything'], cta: 'Be a VIP' },
    ];
    const textOnSectionSurface = getReadableTextColor(tokens.secondary, tokens.text, 4.5);
    const textOnWhiteSurface = getReadableTextColor('#ffffff', tokens.text, 4.5);
    const primaryOnWhite = getReadableTextColor('#ffffff', tokens.primary, 4.5);

    return (
        <section style={{ backgroundColor: tokens.secondary, padding: '140px 24px', fontFamily: tokens.font, overflow: 'hidden' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%) rotate(4deg)', width: '200px', height: '80px', backgroundColor: tokens.accent, borderRadius: '40px', zIndex: 0, opacity: 0.2 }} />
                    <h2 style={{ fontSize: '56px', fontWeight: 900, color: textOnSectionSurface, letterSpacing: '-2px', transform: 'rotate(-2deg)', position: 'relative', zIndex: 1 }}>{title}</h2>
                    <br />
                    <span style={{ fontSize: '20px', fontWeight: 800, color: primaryOnWhite, backgroundColor: '#fff', padding: '8px 24px', borderRadius: '40px', display: 'inline-block', transform: 'rotate(2deg)', marginTop: '8px', border: `2px solid ${textOnWhiteSurface}` }}>{subtitle}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'flex-end' }}>
                    {plans.map((plan, i) => {
                        const isFeatured = i === 1;
                        const cardBackground = isFeatured ? tokens.primary : '#fff';
                        const cardTextColor = isFeatured
                            ? getReadableTextColor(tokens.primary, '#ffffff', 4.5)
                            : textOnWhiteSurface;
                        const cardBorderColor = isFeatured ? cardTextColor : textOnWhiteSurface;
                        const iconColor = isFeatured ? tokens.accent : getReadableTextColor('#ffffff', tokens.primary, 3);
                        const buttonBackground = isFeatured ? tokens.accent : tokens.primary;
                        const buttonTextColor = getReadableTextColor(buttonBackground, '#ffffff', 4.5);
                        return (
                            <div key={i} style={{ 
                                flex: '1 1 300px',
                                backgroundColor: cardBackground, 
                                padding: '40px 32px', 
                                borderRadius: '40px', 
                                border: `6px solid ${cardBorderColor}`,
                                boxShadow: `12px 12px 0 ${cardBorderColor}`,
                                transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                transform: `rotate(${i % 2 === 0 ? '-3deg' : '3deg'})`,
                                color: cardTextColor,
                                position: 'relative',
                                zIndex: isFeatured ? 10 : 1,
                                minHeight: isFeatured ? '520px' : '460px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `rotate(0deg) scale(1.05) translateY(-20px)`;
                                e.currentTarget.style.boxShadow = `16px 16px 0 ${tokens.accent}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? '-3deg' : '3deg'}) scale(1) translateY(0)`;
                                e.currentTarget.style.boxShadow = `12px 12px 0 ${cardBorderColor}`;
                            }}>
                                <div>
                                    {isFeatured && <div style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: tokens.accent, color: getReadableTextColor(tokens.accent, '#ffffff', 4.5), padding: '8px 24px', borderRadius: '30px', fontWeight: 900, border: `4px solid ${cardBorderColor}`, fontSize: '16px' }}>MOST FUN</div>}
                                    <h3 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-1px' }}>{plan.name}</h3>
                                    <div style={{ fontSize: '64px', fontWeight: 900, marginBottom: '32px', lineHeight: 1 }}>{plan.price}<span style={{ fontSize: '20px', fontWeight: 800 }}>/mo</span></div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ color: iconColor, fontSize: '24px' }}>✓</span> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button style={{ 
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '100px',
                                    border: `4px solid ${cardBorderColor}`,
                                    backgroundColor: buttonBackground,
                                    color: buttonTextColor,
                                    fontSize: '20px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: `0 6px 0 ${cardBorderColor}`,
                                    transition: 'all 0.1s'
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = 'translateY(6px)';
                                    e.currentTarget.style.boxShadow = '0 0 0 transparent';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 6px 0 ${cardBorderColor}`;
                                }}>
                                    {plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
