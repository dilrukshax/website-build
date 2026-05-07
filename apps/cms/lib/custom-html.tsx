import type { CSSProperties, ReactElement } from 'react';

function trimToNull(input: string | null | undefined): string | null {
    if (typeof input !== 'string') {
        return null;
    }

    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCustomHtmlFragment(
    input: string | null | undefined,
    target: 'head' | 'body',
): string | null {
    let html = trimToNull(input);
    if (!html) {
        return null;
    }

    html = html.replace(/<!doctype[^>]*>/gi, '').trim();

    if (target === 'head') {
        const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (headMatch?.[1]) {
            html = headMatch[1].trim();
        }
    } else {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch?.[1]) {
            html = bodyMatch[1].trim();
        }
    }

    html = html.replace(/<\/?(html|head|body)[^>]*>/gi, '').trim();
    return html || null;
}

const SLOT_STYLE: CSSProperties = {
    display: 'contents',
};

export function renderCustomBodyHtml(
    input: string | null | undefined,
    slot: 'body-top' | 'body-bottom',
): ReactElement | null {
    const html = normalizeCustomHtmlFragment(input, 'body');
    if (!html) {
        return null;
    }

    return (
        <div
            data-custom-html-slot={slot}
            style={SLOT_STYLE}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
