'use client';

import React, { useMemo, useState } from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString, SourceStyleBundle } from './shared';

type NavItem = {
    label: string;
    href: string;
};

type SocialItem = {
    label: string;
    href: string;
    iconUrl: string | undefined;
};

function normalizeMenu(content: Record<string, unknown>): NavItem[] {
    const source = Array.isArray(content.menu) ? content.menu : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = asString(record.label);
            const href = asString(record.href);
            return label && href ? { label, href } : null;
        })
        .filter((item): item is NavItem => item !== null);

    if (items.length > 0) return items;

    return [
        { label: 'Home', href: 'https://shop.acquisition.com/' },
        { label: 'Shop', href: 'https://shop.acquisition.com/collections/all' },
        { label: 'Scaling Workshop', href: 'https://www.acquisition.com/o-vegas' },
    ];
}

function normalizeSocials(content: Record<string, unknown>): SocialItem[] {
    const source = Array.isArray(content.socialLinks) ? content.socialLinks : [];
    const items = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const label = asString(record.label);
            const href = asString(record.href);
            const iconUrl = asString(record.iconUrl);
            return label && href ? { label, href, iconUrl: iconUrl || undefined } : null;
        })
        .filter((item): item is SocialItem => item !== null);

    if (items.length > 0) return items;

    return [
        { label: 'Facebook', href: 'https://www.facebook.com/alex.hormozi', iconUrl: undefined },
        { label: 'Twitter', href: 'https://twitter.com/alexhormozi', iconUrl: undefined },
        { label: 'Instagram', href: 'https://www.instagram.com/hormozi/', iconUrl: undefined },
        { label: 'YouTube', href: 'https://www.youtube.com/c/AlexHormozi', iconUrl: undefined },
        { label: 'TikTok', href: 'https://www.tiktok.com/@ahormozi', iconUrl: undefined },
    ];
}

function iconForSocial(label: string): React.ReactNode {
    switch (label.toLowerCase()) {
        case 'facebook':
            return (
                <svg role="presentation" focusable="false" width="27" height="27" className="icon icon-facebook" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.183 21.85v-8.868H7.2V9.526h2.983V6.982a4.17 4.17 0 0 1 4.44-4.572 22.33 22.33 0 0 1 2.667.144v3.084h-1.83a1.44 1.44 0 0 0-1.713 1.68v2.208h3.423l-.447 3.456h-2.97v8.868h-3.57Z" fill="currentColor" />
                </svg>
            );
        case 'twitter':
            return (
                <svg role="presentation" focusable="false" width="27" height="27" className="icon icon-twitter" viewBox="0 0 24 24">
                    <path d="M16.94 4h2.715l-5.93 6.777L20.7 20h-5.462l-4.278-5.593L6.065 20H3.35l6.342-7.25L3 4h5.6l3.868 5.113L16.94 4Zm-.952 14.375h1.504L7.784 5.54H6.17l9.818 12.836Z" fill="currentColor" />
                </svg>
            );
        case 'instagram':
            return (
                <svg role="presentation" focusable="false" width="27" height="27" className="icon icon-instagram" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.4c-2.607 0-2.934.011-3.958.058-1.022.046-1.72.209-2.33.446a4.705 4.705 0 0 0-1.7 1.107 4.706 4.706 0 0 0-1.108 1.7c-.237.611-.4 1.31-.446 2.331C2.41 9.066 2.4 9.392 2.4 12c0 2.607.011 2.934.058 3.958.046 1.022.209 1.72.446 2.33a4.706 4.706 0 0 0 1.107 1.7c.534.535 1.07.863 1.7 1.108.611.237 1.309.4 2.33.446 1.025.047 1.352.058 3.959.058s2.934-.011 3.958-.058c1.022-.046 1.72-.209 2.33-.446a4.706 4.706 0 0 0 1.7-1.107 4.706 4.706 0 0 0 1.108-1.7c.237-.611.4-1.31.446-2.33.047-1.025.058-1.352.058-3.959s-.011-2.934-.058-3.958c-.047-1.022-.209-1.72-.446-2.33a4.706 4.706 0 0 0-1.107-1.7 4.705 4.705 0 0 0-1.7-1.108c-.611-.237-1.31-.4-2.331-.446C14.934 2.41 14.608 2.4 12 2.4Zm0 1.73c2.563 0 2.867.01 3.88.056.935.042 1.443.199 1.782.33.448.174.768.382 1.104.718.336.336.544.656.718 1.104.131.338.287.847.33 1.783.046 1.012.056 1.316.056 3.879 0 2.563-.01 2.867-.056 3.88-.043.935-.199 1.444-.33 1.782a2.974 2.974 0 0 1-.719 1.104 2.974 2.974 0 0 1-1.103.718c-.339.131-.847.288-1.783.33-1.012.046-1.316.056-3.88.056-2.563 0-2.866-.01-3.878-.056-.936-.042-1.445-.199-1.783-.33a2.974 2.974 0 0 1-1.104-.718 2.974 2.974 0 0 1-.718-1.104c-.131-.338-.288-.847-.33-1.783-.047-1.012-.056-1.316-.056-3.879 0-2.563.01-2.867.056-3.88.042-.935.199-1.443.33-1.782.174-.448.382-.768.718-1.104a2.974 2.974 0 0 1 1.104-.718c.338-.131.847-.288 1.783-.33C9.133 4.14 9.437 4.13 12 4.13Zm0 11.07a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm0-8.13a4.93 4.93 0 1 0 0 9.86 4.93 4.93 0 0 0 0-9.86Zm6.276-.194a1.152 1.152 0 1 1-2.304 0 1.152 1.152 0 0 1 2.304 0Z" fill="currentColor" />
                </svg>
            );
        case 'youtube':
            return (
                <svg role="presentation" focusable="false" width="27" height="27" className="icon icon-youtube" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.44 5.243c.929.244 1.66.963 1.909 1.876.451 1.654.451 5.106.451 5.106s0 3.452-.451 5.106a2.681 2.681 0 0 1-1.91 1.876c-1.684.443-8.439.443-8.439.443s-6.754 0-8.439-.443a2.682 2.682 0 0 1-1.91-1.876c-.45-1.654-.45-5.106-.45-5.106s0-3.452.45-5.106a2.681 2.681 0 0 1 1.91-1.876c1.685-.443 8.44-.443 8.44-.443s6.754 0 8.438.443Zm-5.004 6.982L9.792 15.36V9.091l5.646 3.134Z" fill="currentColor" />
                </svg>
            );
        case 'tiktok':
            return (
                <svg role="presentation" focusable="false" width="27" height="27" className="icon icon-tiktok" viewBox="0 0 24 24">
                    <path d="M20.027 10.168a5.125 5.125 0 0 1-4.76-2.294v7.893a5.833 5.833 0 1 1-5.834-5.834c.122 0 .241.011.361.019v2.874c-.12-.014-.237-.036-.36-.036a2.977 2.977 0 0 0 0 5.954c1.644 0 3.096-1.295 3.096-2.94L12.56 2.4h2.75a5.122 5.122 0 0 0 4.72 4.573v3.195" fill="currentColor" />
                </svg>
            );
        default:
            return null;
    }
}

export default function HeaderV14({ content }: ThemeComponentProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const menu = useMemo(() => normalizeMenu(content), [content]);
    const socials = useMemo(() => normalizeSocials(content), [content]);
    const logoImageUrl = asString(content.logoImageUrl, asset('cdn/shop/files/Acquisition.com-Logo-Primary-Horizontal-Sambucus_4eb1e.png?v=1686710888&width=1738'));

    return (
        <header className="shopify-section shopify-section-group-header-group shopify-section--header harmozi-vsl-source" id="shopify-section-sections--20702196269281__header">
            <SourceStyleBundle />
            <style>{`
                :root {
                    --sticky-header-enabled: 1;
                }
                #shopify-section-sections--20702196269281__header {
                    --header-grid-template: "main-nav logo secondary-nav" / minmax(0, 1fr) auto minmax(0, 1fr);
                    --header-padding-block: var(--spacing-4-5);
                    --header-background-opacity: 1;
                    --header-background-blur-radius: 0px;
                    --header-transparent-text-color: 255 255 255;
                    --header-logo-width: 130px;
                    --header-logo-height: 20px;
                    position: sticky;
                    top: 0;
                    z-index: 999 !important;
                }
                @media screen and (min-width: 700px) {
                    #shopify-section-sections--20702196269281__header {
                        --header-logo-width: 230px;
                        --header-logo-height: 36px;
                        --header-padding-block: var(--spacing-8-5);
                    }
                }
                @media screen and (min-width: 1150px) {
                    #shopify-section-sections--20702196269281__header {
                        --header-grid-template: "logo main-nav secondary-nav" / minmax(0, 1fr) fit-content(55%) minmax(0, 1fr);
                    }
                }
            `}</style>

            <div data-variable="header">
                <div className="header" data-sticky="">
                    <div className="header__wrapper">
                        <div className="header__main-nav">
                            <div className="header__icon-list">
                                <button type="button" className="tap-area lg:hidden" aria-controls="header-sidebar-menu" onClick={() => setMobileOpen(true)}>
                                    <span className="sr-only">Open navigation menu</span>
                                    <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" className="icon icon-hamburger" viewBox="0 0 22 22">
                                        <path d="M1 5h20M1 11h20M1 17h20" stroke="currentColor" strokeLinecap="round"></path>
                                    </svg>
                                </button>
                                <nav className="header__link-list justify-center wrap" role="navigation">
                                    <ul className="contents" role="list">
                                        {menu.map((item) => (
                                            <li key={`${item.label}-${item.href}`}>
                                                <a href={item.href} className="bold link-faded-reverse">
                                                    {item.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </div>

                        <h1 className="header__logo">
                            <a href="https://shop.acquisition.com/">
                                <span className="sr-only">Acquisition.com</span>
                                <img src={logoImageUrl} alt="" width="1738" height="269" sizes="230px" className="header__logo-image" />
                            </a>
                        </h1>

                        <div className="header__secondary-nav">
                            <div className="header__icon-list">
                                <div className="hidden md:block shrink-0">
                                    <div className="relative">
                                        <button type="button" className="text-with-icon gap-2.5 group" aria-expanded="false">
                                            <div className="h-stack gap-2">
                                                <span className="country-flags country-flags--US"></span>
                                                <span className="bold text-sm">USD $</span>
                                            </div>
                                            <svg role="presentation" focusable="false" width="10" height="7" className="icon icon-chevron-bottom" viewBox="0 0 10 7">
                                                <path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <a href="https://shop.acquisition.com/cart" data-no-instant="" className="relative tap-area" aria-label="Open cart">
                                    <span className="sr-only">Open cart</span>
                                    <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" className="icon icon-cart" viewBox="0 0 22 22">
                                        <path d="M9.182 18.454a.91.91 0 1 1-1.818 0 .91.91 0 0 1 1.818 0Zm7.272 0a.91.91 0 1 1-1.818 0 .91.91 0 0 1 1.819 0Z" fill="currentColor"></path>
                                        <path d="M5.336 6.636H21l-3.636 8.182H6.909L4.636 3H1m8.182 15.454a.91.91 0 1 1-1.818 0 .91.91 0 0 1 1.818 0Zm7.272 0a.91.91 0 1 1-1.818 0 .91.91 0 0 1 1.819 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                    <div className="header__cart-count">
                                        <span className="count-bubble opacity-0" aria-hidden="true">
                                            0
                                        </span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div data-mobile-opening="left" data-open-from="left" id="header-sidebar-menu" className="navigation-drawer drawer lg:hidden" hidden={!mobileOpen}>
                <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)}>
                    <svg role="presentation" strokeWidth="2" focusable="false" width="19" height="19" className="icon icon-close" viewBox="0 0 24 24">
                        <path d="M17.658 6.343 6.344 17.657M17.658 17.657 6.344 6.343" stroke="currentColor"></path>
                    </svg>
                </button>
                <div className="panel-list__wrapper">
                    <div className="panel">
                        <div className="panel__wrapper">
                            <div className="panel__scroller v-stack gap-8">
                                <ul className="v-stack gap-4">
                                    {menu.map((item) => (
                                        <li key={`mobile-${item.label}-${item.href}`} className="h3 sm:h4">
                                            <a href={item.href} className="group block w-full" onClick={() => setMobileOpen(false)}>
                                                <span>
                                                    <span className="reversed-link">{item.label}</span>
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="panel-footer v-stack gap-5">
                                <ul className="social-media" role="list">
                                    {socials.map((social) => (
                                        <li key={`social-${social.label}`}>
                                            <a href={social.href} className="tap-area" target="_blank" rel="noopener" aria-label={`Follow on ${social.label}`}>
                                                {social.iconUrl ? <img src={social.iconUrl} alt="" width="27" height="27" /> : iconForSocial(social.label)}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                <div className="panel-footer__localization-wrapper h-stack gap-6 border-t md:hidden">
                                    <div className="relative">
                                        <button type="button" className="text-with-icon gap-2.5 group" aria-expanded="false">
                                            <div className="h-stack gap-2">
                                                <span className="country-flags country-flags--US"></span>
                                                <span className="bold text-sm">USD $</span>
                                            </div>
                                            <svg role="presentation" focusable="false" width="10" height="7" className="icon icon-chevron-bottom" viewBox="0 0 10 7">
                                                <path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
