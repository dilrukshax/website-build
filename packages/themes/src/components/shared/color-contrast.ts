type RGB = { r: number; g: number; b: number };

const HEX_SHORT_REGEX = /^#([0-9a-f]{3})$/i;
const HEX_LONG_REGEX = /^#([0-9a-f]{6})$/i;
const RGB_REGEX = /^rgba?\(([^)]+)\)$/i;

function clampChannel(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(255, value));
}

function parseHexColor(color: string): RGB | null {
    const shortMatch = color.match(HEX_SHORT_REGEX);
    if (shortMatch?.[1]) {
        const expanded = shortMatch[1]
            .split('')
            .map((char) => `${char}${char}`)
            .join('');
        const numeric = Number.parseInt(expanded, 16);
        return {
            r: (numeric >> 16) & 0xff,
            g: (numeric >> 8) & 0xff,
            b: numeric & 0xff,
        };
    }

    const longMatch = color.match(HEX_LONG_REGEX);
    if (longMatch?.[1]) {
        const numeric = Number.parseInt(longMatch[1], 16);
        return {
            r: (numeric >> 16) & 0xff,
            g: (numeric >> 8) & 0xff,
            b: numeric & 0xff,
        };
    }

    return null;
}

function parseRgbColor(color: string): RGB | null {
    const rgbMatch = color.match(RGB_REGEX);
    if (!rgbMatch?.[1]) return null;

    const channels = rgbMatch[1]
        .split(',')
        .slice(0, 3)
        .map((token) => clampChannel(Number.parseFloat(token.trim())));

    if (channels.length < 3) return null;

    return {
        r: channels[0] || 0,
        g: channels[1] || 0,
        b: channels[2] || 0,
    };
}

function parseColor(color: string): RGB | null {
    const normalized = color.trim();
    if (!normalized) return null;

    return parseHexColor(normalized) || parseRgbColor(normalized);
}

function toLinear(channel: number): number {
    const normalized = channel / 255;
    return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number | null {
    const parsed = parseColor(color);
    if (!parsed) return null;

    const r = toLinear(parsed.r);
    const g = toLinear(parsed.g);
    const b = toLinear(parsed.b);
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

export function getContrastRatio(foreground: string, background: string): number {
    const foregroundLum = luminance(foreground);
    const backgroundLum = luminance(background);

    if (foregroundLum === null || backgroundLum === null) {
        return 1;
    }

    const lighter = Math.max(foregroundLum, backgroundLum);
    const darker = Math.min(foregroundLum, backgroundLum);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks a text color that remains readable on a given background.
 * If preferred does not meet minContrast, falls back to a high-contrast candidate.
 */
export function getReadableTextColor(background: string, preferred: string, minContrast = 4.5): string {
    const candidates = [
        preferred,
        '#111827',
        '#0f172a',
        '#000000',
        '#f8fafc',
        '#ffffff',
    ];

    let best = candidates[0] || '#111827';
    let bestRatio = 0;

    for (const candidate of candidates) {
        const ratio = getContrastRatio(candidate, background);
        if (ratio >= minContrast) {
            return candidate;
        }

        if (ratio > bestRatio) {
            best = candidate;
            bestRatio = ratio;
        }
    }

    return best;
}
