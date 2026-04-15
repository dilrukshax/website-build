'use client';

import { useEffect } from 'react';
import {
    canRequestGoogleFont,
    normalizePrimaryFamily,
    toGoogleFontHref,
} from './hosted-font-utils';

const GOOGLE_FONTS_PRECONNECT_ID = 'be-google-fonts-preconnect';
const GOOGLE_FONTS_GSTATIC_PRECONNECT_ID = 'be-google-fonts-gstatic-preconnect';

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
