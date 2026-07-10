function decodeHtmlEntities(input: string): string {
    return input
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&apos;/g, '\'');
}

function stripInlineHtml(input: string): string {
    const withoutTags = input.replace(/<[^>]+>/g, ' ');
    return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function toMarkdownLink(text: string, href: string): string {
    const label = stripInlineHtml(text) || 'Link';
    const url = decodeHtmlEntities(href).trim();
    if (!url) {
        return label;
    }
    return `[${label}](${url})`;
}

export function htmlToMarkdown(input: string | null | undefined): string {
    const source = (input || '').trim();
    if (!source) {
        return '';
    }

    let text = source
        .replace(/\r\n/g, '\n')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '');

    text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, content) => {
        const headingLevel = Math.max(1, Math.min(6, Number(level)));
        const headingText = stripInlineHtml(content);
        return headingText ? `\n\n${'#'.repeat(headingLevel)} ${headingText}\n\n` : '\n\n';
    });

    text = text.replace(/<a[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi, (_match, href, content) => (
        toMarkdownLink(content, href)
    ));

    text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, content) => {
        const value = stripInlineHtml(content);
        return value ? `**${value}**` : '';
    });

    text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, content) => {
        const value = stripInlineHtml(content);
        return value ? `_${value}_` : '';
    });

    text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_match, content) => {
        const value = stripInlineHtml(content);
        return value ? `\`${value}\`` : '';
    });

    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, content) => {
        const value = stripInlineHtml(content);
        return value ? `\n- ${value}` : '\n';
    });

    text = text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|section|article|blockquote|pre|ul|ol)>/gi, '\n\n')
        .replace(/<(p|div|section|article|blockquote|pre|ul|ol)[^>]*>/gi, '\n\n');

    text = text.replace(/<[^>]+>/g, ' ');
    text = decodeHtmlEntities(text);
    text = text
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

    return text;
}

export function toMarkdownDate(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toISOString().slice(0, 10);
}
