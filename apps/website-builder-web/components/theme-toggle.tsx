'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/theme-context';
import type { ThemeSetting } from '../contexts/theme-context';

interface ThemeToggleProps {
    className?: string;
    align?: 'left' | 'right';
    fullWidth?: boolean;
}

const THEME_OPTIONS: Array<{ value: ThemeSetting; label: string; icon: LucideIcon }> = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeToggle({ className = '', align = 'left', fullWidth = true }: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeOption =
        THEME_OPTIONS.find((option) => option.value === theme) ||
        THEME_OPTIONS[0] ||
        { value: 'system' as const, label: 'System', icon: Monitor };
    const ActiveIcon = activeOption.icon;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 dark:border-slate-700 dark:bg-slate-800/70 ${fullWidth ? 'w-full' : ''}`}
                aria-label="Change theme"
                aria-expanded={isOpen}
            >
                <ActiveIcon size={15} className="text-slate-500 dark:text-slate-300" />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Theme: {activeOption.label}
                </span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className={`absolute z-50 mt-1 w-full min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900 ${align === 'right' ? 'right-0' : 'left-0'}`}
                >
                    {THEME_OPTIONS.map((option) => {
                        const OptionIcon = option.icon;
                        const selected = option.value === theme;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setTheme(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#2563eb]/5 ${selected ? 'bg-[#2563eb]/10' : ''}`}
                            >
                                <OptionIcon size={14} className="text-slate-500 dark:text-slate-300" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-900 dark:text-slate-100">{option.label}</p>
                                    {option.value === 'system' && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Following {resolvedTheme} mode
                                        </p>
                                    )}
                                </div>
                                {selected && <Check size={14} className="shrink-0 text-[#2563eb]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
