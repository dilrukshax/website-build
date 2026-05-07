'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { readSectionBackground, readSectionText } from '../shared/style-overrides';
import { HARMOZI_VSL_COLORS, HARMOZI_VSL_FONT, asset, asString } from './shared';

type FooterLink = { label: string; href: string };
type SocialLink = { label: string; href: string; iconUrl: string };

function normalizeLinks(value: unknown, fallback: FooterLink[]): FooterLink[] {
    const source = Array.isArray(value) ? value : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = asString(record.label);
            const href = asString(record.href, '#');
            return label ? { label, href } : null;
        })
        .filter((item): item is FooterLink => item !== null);
    return items.length > 0 ? items : fallback;
}

function normalizeSocials(value: unknown): SocialLink[] {
    const source = Array.isArray(value) ? value : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = asString(record.label);
            const href = asString(record.href, '#');
            const iconUrl = asString(record.iconUrl);
            return label && iconUrl ? { label, href, iconUrl } : null;
        })
        .filter((item): item is SocialLink => item !== null);
    if (items.length > 0) return items;
    return [
        { label: 'Instagram', href: 'https://www.instagram.com/acquisitioncom/', iconUrl: asset('cdn/shop/files/Instagram_100x1008146.svg?v=1696662132') },
        { label: 'Twitter', href: 'https://x.com/acquisitioncom', iconUrl: asset('cdn/shop/files/Twitter_100x1003e9d.svg?v=1696662247') },
        { label: 'YouTube', href: 'https://www.youtube.com/@Acquisitioncom', iconUrl: asset('cdn/shop/files/Youtube_100x100a444.svg?v=1696662208') },
    ];
}

export default function FooterV14({ content, styles, tokens }: ThemeComponentProps) {
    const logoImageUrl = asString(content.logoImageUrl, asset('cdn/shop/files/Acquisition.com-Logo-Primary-Horizontal-Sambucus_4_300x300e4bf.png?v=1686710888'));
    const helpText = asString(content.helpText, "Questions? We're here to help! Simply reach out to our team.");
    const helpEmail = asString(content.helpEmail, 'support@acquisition.com');
    const address = asString(content.address, 'Acquisition.com, LLC, 2960 West Sahara Avenue, Las Vegas, Nevada 89102.');
    const disclaimer = asString(content.disclaimer, 'Alex and Leila Hormozi’s results are not typical and are not a guarantee of your success. Alex and Leila are experienced business owners and investors, and your results will vary depending on education, effort, application, experience, and background.');
    const ownership = asString(content.ownership, 'The information contained within this website is the property of Acquisition.com. Any use of the images, content, or ideas expressed herein without the express written consent of Acquisition.com is prohibited.');
    const policyLinks = normalizeLinks(content.policyLinks, [
        { label: 'Privacy Policy', href: '#top' },
        { label: 'Terms & Conditions', href: '#top' },
        { label: 'Disclosure', href: '#top' },
        { label: 'DMCA Policy', href: '#top' },
        { label: 'Refund Policy', href: '#top' },
        { label: 'FAQ', href: '#top' },
    ]);
    const navLinks = normalizeLinks(content.navLinks, [
        { label: 'Home', href: '#hero' },
        { label: 'Shop', href: '#offers' },
        { label: 'Scaling Workshop', href: '#about-acquisition' },
    ]);
    const socials = normalizeSocials(content.socialLinks);
    const copyrightText = asString(content.copyrightText, 'Copyright 2026 Acquisition.com');
    const sectionBackground = readSectionBackground(styles, '#ffffff');
    const headingColor = readSectionText(styles, HARMOZI_VSL_COLORS.text);
    const bodyColor = headingColor === HARMOZI_VSL_COLORS.text ? HARMOZI_VSL_COLORS.muted : headingColor;

    return (
        <footer className="harmozi-vsl-footer" id="footer">
            <style>{`
                .harmozi-vsl-footer { background: ${sectionBackground}; color: ${headingColor}; font-family: ${tokens.font || HARMOZI_VSL_FONT}; }
                .harmozi-vsl-footer__disclaimer { max-width: 1060px; margin: 0 auto; padding: 34px 20px 20px; text-align: center; }
                .harmozi-vsl-footer__disclaimer p { margin: 0 0 14px; color: ${bodyColor}; font-size: 14px; line-height: 1.8; }
                .harmozi-vsl-footer__disclaimer a { color: ${HARMOZI_VSL_COLORS.accent}; }
                .harmozi-vsl-footer__main { border-top: 1px solid #ebe4dc; }
                .harmozi-vsl-footer__shell { max-width: 1320px; margin: 0 auto; padding: 42px 20px; }
                .harmozi-vsl-footer__top { display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: start; }
                .harmozi-vsl-footer__logo img { width: 180px; height: auto; display: block; }
                .harmozi-vsl-footer__links { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px 20px; }
                .harmozi-vsl-footer__policy-link { color: ${bodyColor}; text-decoration: none; font-size: 14px; line-height: 1.5; }
                .harmozi-vsl-footer__bottom { margin-top: 32px; padding-top: 22px; border-top: 1px solid #ebe4dc; display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
                .harmozi-vsl-footer__nav { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
                .harmozi-vsl-footer__nav a { color: ${bodyColor}; text-decoration: none; font-size: 14px; }
                .harmozi-vsl-footer__socials { display: flex; align-items: center; gap: 14px; }
                .harmozi-vsl-footer__socials img { width: 18px; height: 18px; display: block; }
                .harmozi-vsl-footer__copyright { color: ${bodyColor}; font-size: 13px; }
                @media (max-width: 980px) {
                    .harmozi-vsl-footer__top { grid-template-columns: 1fr; }
                    .harmozi-vsl-footer__links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 640px) {
                    .harmozi-vsl-footer__links { grid-template-columns: 1fr; }
                    .harmozi-vsl-footer__bottom { align-items: flex-start; flex-direction: column; }
                }
            `}</style>

            <div className="harmozi-vsl-footer__disclaimer">
                <p>{helpText} <a href={`mailto:${helpEmail}`}>{helpEmail}</a></p>
                <p>{address}</p>
                <p>{disclaimer}</p>
                <p>{ownership}</p>
            </div>

            <div className="harmozi-vsl-footer__main">
                <div className="harmozi-vsl-footer__shell">
                    <div className="harmozi-vsl-footer__top">
                        <a className="harmozi-vsl-footer__logo" href="#hero">
                            <img src={logoImageUrl} alt="Acquisition.com" />
                        </a>

                        <div className="harmozi-vsl-footer__links">
                            {policyLinks.map((link) => (
                                <a key={`${link.label}-${link.href}`} className="harmozi-vsl-footer__policy-link" href={link.href}>
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="harmozi-vsl-footer__bottom">
                        <div className="harmozi-vsl-footer__nav">
                            {navLinks.map((link) => (
                                <a key={`nav-${link.label}-${link.href}`} href={link.href}>{link.label}</a>
                            ))}
                        </div>

                        <div className="harmozi-vsl-footer__socials">
                            {socials.map((social) => (
                                <a key={social.label} href={social.href} aria-label={social.label}>
                                    <img src={social.iconUrl} alt={social.label} />
                                </a>
                            ))}
                        </div>

                        <div className="harmozi-vsl-footer__copyright">{copyrightText}</div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
