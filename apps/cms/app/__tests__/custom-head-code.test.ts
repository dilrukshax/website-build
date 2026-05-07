import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
    resolvePublishedManifest: vi.fn(),
    isCmsHost: vi.fn(),
    normalizeHost: vi.fn(),
    resolveRoutedRequestHost: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: () => new Headers({ host: 'www.mysalon.com' }),
}));

vi.mock('../../contexts/auth-context', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('../../contexts/theme-context', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('../../lib/published-site', () => ({
    resolvePublishedManifest: mocks.resolvePublishedManifest,
    isCmsHost: mocks.isCmsHost,
    normalizeHost: mocks.normalizeHost,
    resolveRoutedRequestHost: mocks.resolveRoutedRequestHost,
    UNKNOWN_SUBDOMAIN: '__unknown__',
}));

describe('RootLayout custom head code', () => {
    it('renders parsed publisher head markup inside the document head', async () => {
        vi.stubGlobal('React', React);
        mocks.normalizeHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
        mocks.isCmsHost.mockReturnValue(false);
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
                customCode: {
                    head: '<meta name="google-site-verification" content="abc123" />',
                },
            },
        });

        const module = await import('../layout');
        const element = await module.default({
            children: React.createElement('main', null, 'Preview'),
        });
        const markup = renderToStaticMarkup(element);

        expect(markup).toContain('<head>');
        expect(markup).toContain('google-site-verification');
        expect(markup).toContain('abc123');
        expect(markup.indexOf('google-site-verification')).toBeLessThan(markup.indexOf('<body>'));
    });

    it('skips empty publisher head markup', async () => {
        vi.stubGlobal('React', React);
        mocks.normalizeHost.mockReturnValue('www.mysalon.com');
        mocks.resolveRoutedRequestHost.mockReturnValue('www.mysalon.com');
        mocks.isCmsHost.mockReturnValue(false);
        mocks.resolvePublishedManifest.mockResolvedValue({
            manifest: {
                customCode: {
                    head: '   ',
                },
            },
        });

        const module = await import('../layout');
        const element = await module.default({
            children: React.createElement('main', null, 'Preview'),
        });
        const markup = renderToStaticMarkup(element);

        expect(markup).not.toContain('google-site-verification');
    });
});
