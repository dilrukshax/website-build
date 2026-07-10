'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { getInstanceDisplayDomain } from '../lib/domain';

export function InstanceSwitcher() {
    const { instances, currentInstance, switchInstance } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSwitch(instanceId: string) {
        if (instanceId === currentInstance?.id) {
            setIsOpen(false);
            return;
        }
        switchInstance(instanceId);
        setIsOpen(false);
    }

    if (instances.length === 0) {
        return (
            <button
                onClick={() => router.push('/dashboard/instances/new')}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#5048e5]/40 bg-[#5048e5]/5 px-3 py-2.5 text-left transition-colors hover:bg-[#5048e5]/10"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#5048e5]">
                    <Plus size={16} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Create a website</p>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-[#5048e5]/30 hover:bg-[#5048e5]/5 dark:border-slate-700 dark:bg-slate-800/70"
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#5048e5] text-sm font-semibold text-white">
                    {currentInstance?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {currentInstance?.name || 'Select website'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {getInstanceDisplayDomain(currentInstance)}
                    </p>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {instances.map((instance) => (
                        <button
                            key={instance.id}
                            onClick={() => handleSwitch(instance.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#5048e5]/5 ${instance.id === currentInstance?.id ? 'bg-[#5048e5]/10' : ''}`}
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5048e5] text-xs font-semibold text-white">
                                {instance.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm text-slate-900 dark:text-slate-100">{instance.name}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{getInstanceDisplayDomain(instance)}</p>
                            </div>
                            {instance.id === currentInstance?.id && (
                                <Check size={16} className="shrink-0 text-[#5048e5]" />
                            )}
                        </button>
                    ))}
                    <div className="mt-1 border-t border-slate-200 pt-1 dark:border-slate-700">
                        <button
                            onClick={() => { setIsOpen(false); router.push('/dashboard/instances/new'); }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-slate-600 transition-colors hover:bg-[#5048e5]/5 dark:text-slate-300"
                        >
                            <Plus size={16} />
                            <span className="text-sm">New website</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
