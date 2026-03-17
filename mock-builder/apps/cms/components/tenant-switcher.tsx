'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';

export function TenantSwitcher() {
    const { tenants, currentTenant, switchTenant } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    if (tenants.length <= 1) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSwitching}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors text-left"
            >
                <span className="text-xs text-gray-500 truncate flex-1">
                    {currentTenant?.businessName || 'Select org'}
                </span>
                <ChevronDown
                    size={12}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                    {tenants.map((tenant) => (
                        <button
                            key={tenant.id}
                            onClick={() => handleSwitch(tenant.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 transition-colors ${tenant.id === currentTenant?.id ? 'bg-gray-700' : ''}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{tenant.businessName}</p>
                                <p className="text-xs text-gray-400">{tenant.role}</p>
                            </div>
                            {tenant.id === currentTenant?.id && (
                                <Check size={14} className="text-blue-400 shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
