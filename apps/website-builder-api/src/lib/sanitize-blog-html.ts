import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'mark',
    'span',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'pre',
    'code',
    'hr',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'data-layout', 'data-size'],
    mark: ['style', 'class'],
    span: ['style', 'class'],
    '*': ['class'],
};

const ALLOWED_STYLES: sanitizeHtml.IOptions['allowedStyles'] = {
    span: {
        'font-family': [/^[a-zA-Z0-9\-\s,'\"]+$/],
    },
    mark: {
        'background-color': [
            /^#[0-9a-fA-F]{3,8}$/,
            /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
            /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/,
            /^hsl\((\s*\d+\s*,){2}\s*\d+%\s*\)$/,
            /^hsla\((\s*\d+\s*,){2}\s*\d+%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
        ],
        color: [
            /^#[0-9a-fA-F]{3,8}$/,
            /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/,
            /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/,
            /^hsl\((\s*\d+\s*,){2}\s*\d+%\s*\)$/,
            /^hsla\((\s*\d+\s*,){2}\s*\d+%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
        ],
    },
};

export function sanitizeBlogHtml(input: string): string {
    return sanitizeHtml(input || '', {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedStyles: ALLOWED_STYLES,
        allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
        allowedSchemesByTag: {
            img: ['http', 'https', 'data'],
        },
        allowedSchemesAppliedToAttributes: ['href', 'src'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
        },
    }).trim();
}
