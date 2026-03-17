'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';

export function TenantSwitcher() {
    const { tenants, currentTenant, switchTenant } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasMultipleTenants = tenants.length > 1;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleSwitch(tenantId: string) {
        if (tenantId === currentTenant?.id) {
            setIsOpen(false);
            return;
        }
        setIsSwitching(true);
        await switchTenant(tenantId);
        setIsSwitching(false);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => {
                    if (!hasMultipleTenants) return;
                    setIsOpen(!isOpen);
                }}
                disabled={isSwitching || !hasMultipleTenants}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left transition-colors hover:border-[#5048e5]/30 hover:bg-[#5048e5]/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/70"
            >
                <span className="flex-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {currentTenant?.businessName || 'Select org'}
                </span>
                <ChevronDown
                    size={12}
                    className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && hasMultipleTenants && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {tenants.map((tenant) => (
                        <button
                            key={tenant.id}
                            onClick={() => handleSwitch(tenant.id)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#5048e5]/5 ${tenant.id === currentTenant?.id ? 'bg-[#5048e5]/10' : ''}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm text-slate-900 dark:text-slate-100">{tenant.businessName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{tenant.role}</p>
                            </div>
                            {tenant.id === currentTenant?.id && (
                                <Check size={14} className="shrink-0 text-[#5048e5]" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
