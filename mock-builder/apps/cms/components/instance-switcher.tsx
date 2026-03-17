'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
            >
                <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center text-gray-400">
                    <Plus size={16} />
                </div>
                <p className="text-sm text-gray-400">Create a website</p>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
            >
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {currentInstance?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {currentInstance?.name || 'Select website'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                        {currentInstance?.subdomain}.yourdomain.com
                    </p>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                    {instances.map((instance) => (
                        <button
                            key={instance.id}
                            onClick={() => handleSwitch(instance.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors ${instance.id === currentInstance?.id ? 'bg-gray-700' : ''}`}
                        >
                            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                {instance.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{instance.name}</p>
                                <p className="text-xs text-gray-400 truncate">{instance.subdomain}.yourdomain.com</p>
                            </div>
                            {instance.id === currentInstance?.id && (
                                <Check size={16} className="text-blue-400 shrink-0" />
                            )}
                        </button>
                    ))}
                    <div className="border-t border-gray-700 mt-1 pt-1">
                        <button
                            onClick={() => { setIsOpen(false); router.push('/dashboard/instances/new'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors text-gray-400"
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
