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

export function normalizePrimaryFamily(fontFamily: string | undefined): string {
    if (!fontFamily) return '';
    const primary = fontFamily.split(',')[0]?.trim() || '';
    return primary.replace(/^['"]|['"]$/g, '').trim();
}

export function canRequestGoogleFont(family: string): boolean {
    if (!family) return false;
    const lower = family.toLowerCase();
    if (GENERIC_FAMILIES.has(lower)) return false;
    if (COMMON_LOCAL_FONTS.has(lower)) return false;
    return /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,99}$/.test(family);
}

export function toGoogleFontHref(family: string): string {
    const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700;800;900&display=swap`;
}

export function resolveHostedFontRequest(fontFamily: string | undefined): { family: string; href: string } | null {
    const family = normalizePrimaryFamily(fontFamily);
    if (!canRequestGoogleFont(family)) {
        return null;
    }

    return {
        family,
        href: toGoogleFontHref(family),
    };
}

