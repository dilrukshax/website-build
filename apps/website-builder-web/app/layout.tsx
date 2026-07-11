import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import { ThemeProvider } from '../contexts/theme-context';
import './globals.css';

export const metadata: Metadata = {
    title: {
        template: '%s | iroh',
        default: 'iroh',
    },
    description:
        'A multi-tenant website builder for creating, managing, and publishing websites.',
    metadataBase: new URL(
        process.env.WEBSITE_BUILDER_WEB_URL ||
            process.env.CMS_URL ||
            'https://buildmyonlineweb.site'
    ),
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/favicon.svg',
    },
    openGraph: {
        title: 'iroh',
        description:
            'Create, manage, and publish websites with iroh.',
        url: '/',
        siteName: 'iroh',
        locale: 'en_US',
        type: 'website',
        images: [{ url: '/logo.svg', width: 320, height: 80, alt: 'iroh' }],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    twitter: {
        title: 'iroh',
        card: 'summary_large_image',
        images: ['/logo.svg'],
    },
};

import { headers } from 'next/headers';
import parseHtml from 'html-react-parser';
import { normalizeCustomHtmlFragment, renderCustomBodyHtml } from '../lib/custom-html';
import { resolvePublishedManifest, isCmsHost, resolveRoutedRequestHost, UNKNOWN_SUBDOMAIN } from '../lib/published-site';

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const requestHeaders = headers();
    const host = resolveRoutedRequestHost(requestHeaders);
    let customHeadCode: string | null = null;
    let customBodyTopCode: string | null = null;
    let customBodyBottomCode: string | null = null;
    let ga4MeasurementId: string | null = null;

    if (!isCmsHost(host)) {
        const { manifest } = await resolvePublishedManifest({
            subdomain: UNKNOWN_SUBDOMAIN,
            hostname: host,
        });
        if (manifest?.customCode?.head) {
            customHeadCode = normalizeCustomHtmlFragment(manifest.customCode.head, 'head');
        }
        if (manifest?.customCode?.bodyTop) {
            customBodyTopCode = manifest.customCode.bodyTop;
        }
        if (manifest?.customCode?.bodyBottom) {
            customBodyBottomCode = manifest.customCode.bodyBottom;
        }
        if (manifest?.analytics?.ga4MeasurementId) {
            ga4MeasurementId = manifest.analytics.ga4MeasurementId;
        }
    }

    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();
  const ecommexMerchantId = process.env.NEXT_PUBLIC_ECOMMEX_MERCHANT_ID?.trim();
    const themeInitScript = `(() => {
  const key = 'be_theme';
  const root = document.documentElement;
  const sharedTokens = {
    '--be-primary': '#dc2626',
    '--be-bg-light': '#f6f6f8',
    '--be-bg-dark': '#121121',
  };
  const formTokens = {
    light: {
      '--be-form-bg': '#ffffff',
      '--be-form-surface': '#f8fafc',
      '--be-form-text': '#0f172a',
      '--be-form-label': '#475569',
      '--be-form-heading': '#0f172a',
      '--be-form-muted': '#64748b',
      '--be-form-border': '#cbd5e1',
      '--be-form-active-bg': '#fef2f2',
      '--be-form-active-text': '#b91c1c',
      '--be-form-swatch-border': 'rgba(15, 23, 42, 0.15)',
      '--be-form-upload-bg': '#ffffff',
      '--be-form-upload-bg-disabled': '#f1f5f9',
      '--be-form-danger-bg': '#fef2f2',
      '--be-form-danger-border': '#fecaca',
      '--be-form-danger-text': '#b91c1c',
      '--be-form-error': '#dc2626',
    },
    dark: {
      '--be-form-bg': '#0f172a',
      '--be-form-surface': '#111827',
      '--be-form-text': '#e2e8f0',
      '--be-form-label': '#cbd5e1',
      '--be-form-heading': '#f8fafc',
      '--be-form-muted': '#94a3b8',
      '--be-form-border': '#334155',
      '--be-form-active-bg': '#1e293b',
      '--be-form-active-text': '#fca5a5',
      '--be-form-swatch-border': 'rgba(148, 163, 184, 0.45)',
      '--be-form-upload-bg': '#1e293b',
      '--be-form-upload-bg-disabled': '#0f172a',
      '--be-form-danger-bg': 'rgba(127, 29, 29, 0.24)',
      '--be-form-danger-border': 'rgba(185, 28, 28, 0.6)',
      '--be-form-danger-text': '#fca5a5',
      '--be-form-error': '#fca5a5',
    },
  };

  const applyThemeTokens = (resolved) => {
    for (const [tokenName, value] of Object.entries(sharedTokens)) {
      root.style.setProperty(tokenName, value);
    }
    const activeTokens = resolved === 'dark' ? formTokens.dark : formTokens.light;
    for (const [tokenName, value] of Object.entries(activeTokens)) {
      root.style.setProperty(tokenName, value);
    }
    root.style.colorScheme = resolved;
  };

  const setResolvedTheme = (resolved) => {
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = resolved;
    applyThemeTokens(resolved);
  };

  try {
    const stored = window.localStorage.getItem(key);
    const setting = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const resolved = setting === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : setting;
    setResolvedTheme(resolved);
  } catch {
    setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
})();`;
    const chunkRecoveryScript = `(() => {
  const CHUNK_RELOAD_KEY = 'be_chunk_reload_at';
  const CHUNK_RELOAD_COOLDOWN_MS = 30_000;
  const CHUNK_ERROR_PATTERNS = [
    /ChunkLoadError/i,
    /Loading chunk [0-9]+ failed/i,
    /Failed to fetch dynamically imported module/i,
    /Failed to fetch RSC payload/i,
  ];

  const canRetryReload = () => {
    try {
      const previous = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
      return !previous || (Date.now() - previous) > CHUNK_RELOAD_COOLDOWN_MS;
    } catch {
      return true;
    }
  };

  const markRetry = () => {
    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures
    }
  };

  const shouldRecoverFromReason = (input) => {
    if (!input) return false;

    let message = '';

    if (typeof input === 'string') {
      message = input;
    } else if (input instanceof Error) {
      message = [input.name, input.message].filter(Boolean).join(': ');
    } else if (typeof input === 'object' && 'message' in input && typeof input.message === 'string') {
      message = input.message;
    }

    if (!message) return false;
    return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
  };

  const recover = () => {
    if (!canRetryReload()) return;

    markRetry();
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('_chunk_retry', String(Date.now()));
    window.location.replace(nextUrl.toString());
  };

  window.addEventListener('error', (event) => {
    const target = event.target;

    if (target instanceof HTMLScriptElement) {
      const src = target.src || '';
      const isNextAssetScript = src.includes('/_next/static/chunks/')
        || src.includes('/_next/undefined')
        || /\/\_next\/.+undefined/i.test(src);
      if (!isNextAssetScript) return;
      recover();
      return;
    }

    if (shouldRecoverFromReason(event.message) || shouldRecoverFromReason(event.error)) {
      recover();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (shouldRecoverFromReason(event.reason)) {
      recover();
    }
  });
})();`;
    const clarityInitScript = clarityId ? `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${clarityId}");` : '';

    const ga4InitScript = ga4MeasurementId ? `(function(){
  var id="${ga4MeasurementId}";
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', id);
  var s=document.createElement('script');s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+id;
  var x=document.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);
})();` : '';

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="apple-touch-icon" href="/favicon.svg" />
                <link rel="manifest" href="/site.webmanifest" />
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
                {clarityInitScript ? <script dangerouslySetInnerHTML={{ __html: clarityInitScript }} /> : null}
                {ga4InitScript ? <script dangerouslySetInnerHTML={{ __html: ga4InitScript }} /> : null}
                {ecommexMerchantId ? (
                    <script
                        src="https://inbox-backend-fignp.sevalla.app/widget/ecommex-widget.js"
                        data-api-url="https://inbox-backend-fignp.sevalla.app/"
                        data-merchant-id="356"
                        defer
                    />
                ) : null}
                {customHeadCode ? parseHtml(customHeadCode) : null}
            </head>
            <body>
                {renderCustomBodyHtml(customBodyTopCode, 'body-top')}
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
                {renderCustomBodyHtml(customBodyBottomCode, 'body-bottom')}
            </body>
        </html>
    );
}
