'use client';

import React from 'react';

export const HARMOZI_VSL_FONT = 'Poppins, sans-serif';

export const HARMOZI_VSL_COLORS = {
    background: '#f7f5f1',
    surface: '#ffffff',
    border: '#ddd6cc',
    text: '#151515',
    muted: '#5f5b56',
    accent: '#6f39f6',
    accentSoft: '#f3edff',
    dark: '#12141f',
    darkMuted: '#cfd2df',
    warning: '#ff8d3b',
};

export const HARMOZI_VSL_STYLE_URLS = [
    'https://shop.acquisition.com/cdn/shop/t/15/assets/themebda3.css?v=104739837801746195831762187185',
    'https://shop.acquisition.com/cdn/shop/t/15/assets/normalize5789.css?v=48445716682461949491762187173',
    'https://shop.acquisition.com/cdn/shop/t/15/assets/webflowc6ba.css?v=128908665895359651081762187188',
    'https://shop.acquisition.com/cdn/shop/t/15/assets/acquisition-com-shop.webflowefd5.css?v=162348263180288271281762187141',
    'https://shop.acquisition.com/cdn/shop/t/15/assets/mc-customc953.css?v=1981413227347386881762187171',
    'https://shop.acquisition.com/cdn/shop/t/15/assets/country-flags2662.css?v=121849659101725933681762187227',
];

const GOOGLE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';

export function asset(path: string): string {
    return `https://shop.acquisition.com/${path.replace(/^\/+/, '')}`;
}

export function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function SourceStyleBundle() {
    return React.createElement(
        React.Fragment,
        null,
        React.createElement('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }),
        React.createElement('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }),
        React.createElement('link', { rel: 'stylesheet', href: GOOGLE_FONT_URL }),
        ...HARMOZI_VSL_STYLE_URLS.map((href) => React.createElement('link', { key: href, rel: 'stylesheet', href })),
        React.createElement(
            'style',
            null,
            `
                .harmozi-vsl-source,
                .harmozi-vsl-source * {
                    font-family: ${HARMOZI_VSL_FONT};
                }
            `,
        ),
    );
}
