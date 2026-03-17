'use client';

import { useEffect } from 'react';

const GENERIC_FAMILIES = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'emoji',
    'math',
    'fangsong',
]);

const COMMON_LOCAL_FONTS = new Set([
    'arial',
    'helvetica',
    'times new roman',
    'times',
    'georgia',
    'verdana',
    'tahoma',
    'trebuchet ms',
    'courier new',
    'courier',
    'palatino',
    'garamond',
    'bookman',
]);

const GOOGLE_FONTS_PRECONNECT_ID = 'be-google-fonts-preconnect';
const GOOGLE_FONTS_GSTATIC_PRECONNECT_ID = 'be-google-fonts-gstatic-preconnect';

function normalizePrimaryFamily(fontFamily: string | undefined): string {
    if (!fontFamily) return '';
    const primary = fontFamily.split(',')[0]?.trim() || '';
    return primary.replace(/^['"]|['"]$/g, '').trim();
}

function canRequestGoogleFont(family: string): boolean {
    if (!family) return false;
    const lower = family.toLowerCase();
    if (GENERIC_FAMILIES.has(lower)) return false;
    if (COMMON_LOCAL_FONTS.has(lower)) return false;
    return /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,99}$/.test(family);
}

function toGoogleFontHref(family: string): string {
    const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700;800;900&display=swap`;
}

function ensurePreconnectLinks() {
    if (!document.getElementById(GOOGLE_FONTS_PRECONNECT_ID)) {
        const preconnect = document.createElement('link');
        preconnect.id = GOOGLE_FONTS_PRECONNECT_ID;
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect);
    }

    if (!document.getElementById(GOOGLE_FONTS_GSTATIC_PRECONNECT_ID)) {
        const preconnect = document.createElement('link');
        preconnect.id = GOOGLE_FONTS_GSTATIC_PRECONNECT_ID;
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://fonts.gstatic.com';
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
    }
}

export function useHostedFont(fontFamily: string | undefined): void {
    useEffect(() => {
        const family = normalizePrimaryFamily(fontFamily);
        if (!canRequestGoogleFont(family)) {
            return;
        }

        ensurePreconnectLinks();

        const fontId = `be-google-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (document.getElementById(fontId)) {
            return;
        }

        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = toGoogleFontHref(family);
        document.head.appendChild(link);
    }, [fontFamily]);
}

