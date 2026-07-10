'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStorageItem, setStorageItem } from '../lib/browser-storage';

export type ThemeSetting = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'be_theme';
const SHARED_THEME_TOKENS: Record<string, string> = {
    '--be-primary': '#2563eb',
    '--be-bg-light': '#f6f6f8',
    '--be-bg-dark': '#121121',
};
const FORM_THEME_TOKENS: Record<ResolvedTheme, Record<string, string>> = {
    light: {
        '--be-form-bg': '#ffffff',
        '--be-form-surface': '#f8fafc',
        '--be-form-text': '#0f172a',
        '--be-form-label': '#475569',
        '--be-form-heading': '#0f172a',
        '--be-form-muted': '#64748b',
        '--be-form-border': '#cbd5e1',
        '--be-form-active-bg': '#eff6ff',
        '--be-form-active-text': '#1d4ed8',
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
        '--be-form-active-text': '#93c5fd',
        '--be-form-swatch-border': 'rgba(148, 163, 184, 0.45)',
        '--be-form-upload-bg': '#1e293b',
        '--be-form-upload-bg-disabled': '#0f172a',
        '--be-form-danger-bg': 'rgba(127, 29, 29, 0.24)',
        '--be-form-danger-border': 'rgba(185, 28, 28, 0.6)',
        '--be-form-danger-text': '#fca5a5',
        '--be-form-error': '#fca5a5',
    },
};

interface ThemeContextValue {
    theme: ThemeSetting;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemeSetting) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: string | null): ThemeSetting {
    if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
    }
    return 'system';
}

function getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: ThemeSetting): ResolvedTheme {
    return theme === 'system' ? getSystemTheme() : theme;
}

function applyThemeTokens(root: HTMLElement, resolvedTheme: ResolvedTheme): void {
    for (const [tokenName, value] of Object.entries(SHARED_THEME_TOKENS)) {
        root.style.setProperty(tokenName, value);
    }
    for (const [tokenName, value] of Object.entries(FORM_THEME_TOKENS[resolvedTheme])) {
        root.style.setProperty(tokenName, value);
    }
}

function applyResolvedThemeToDom(resolvedTheme: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    applyThemeTokens(root, resolvedTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeSetting>('system');
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
    const [hasHydrated, setHasHydrated] = useState(false);

    const applyTheme = useCallback((nextTheme: ThemeSetting) => {
        const nextResolved = resolveTheme(nextTheme);
        setResolvedTheme(nextResolved);
        applyResolvedThemeToDom(nextResolved);
    }, []);

    useEffect(() => {
        const storedTheme = normalizeTheme(getStorageItem(THEME_STORAGE_KEY));
        setThemeState(storedTheme);
        applyTheme(storedTheme);
        setHasHydrated(true);
    }, [applyTheme]);

    useEffect(() => {
        if (!hasHydrated) return;
        setStorageItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme);
    }, [applyTheme, hasHydrated, theme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handleChange);
            return () => media.removeEventListener('change', handleChange);
        }

        media.addListener(handleChange);
        return () => media.removeListener(handleChange);
    }, [applyTheme, theme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY) return;
            const nextTheme = normalizeTheme(event.newValue);
            setThemeState(nextTheme);
            applyTheme(nextTheme);
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [applyTheme]);

    const setTheme = useCallback((nextTheme: ThemeSetting) => {
        setThemeState(nextTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((current) => {
            const currentResolved = resolveTheme(current);
            return currentResolved === 'dark' ? 'light' : 'dark';
        });
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    }), [theme, resolvedTheme, setTheme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export const themeStorageKey = THEME_STORAGE_KEY;
