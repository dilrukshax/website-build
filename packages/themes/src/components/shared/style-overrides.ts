import type { ThemeComponentProps } from '../../types';

type ThemeStyles = ThemeComponentProps['styles'];

function readColorValue(styles: ThemeStyles, aliases: string[]): string {
    for (const alias of aliases) {
        const value = styles?.[alias];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return '';
}

export function readSectionBackground(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['sectionBackgroundColor', 'backgroundColor', 'bgColor']) || fallback;
}

export function readSectionText(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['sectionTextColor', 'textColor', 'foregroundColor', 'color']) || fallback;
}

export function readPrimaryButtonBackground(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['primaryButtonBackgroundColor', 'primaryButtonColor', 'buttonColor']) || fallback;
}

export function readPrimaryButtonText(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['primaryButtonTextColor', 'buttonTextColor']) || fallback;
}

export function readSecondaryButtonBackground(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['secondaryButtonBackgroundColor', 'secondaryButtonColor']) || fallback;
}

export function readSecondaryButtonText(styles: ThemeStyles, fallback: string): string {
    return readColorValue(styles, ['secondaryButtonTextColor', 'secondaryButtonLabelColor']) || fallback;
}

