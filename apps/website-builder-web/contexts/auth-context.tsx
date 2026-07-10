'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api-client';
import { getStorageItem, removeStorageItem, setStorageItem } from '../lib/browser-storage';
import type { FingerprintResult } from '../lib/fingerprint/types';

interface User {
    id: string;
    email: string;
    fullName: string;
    status?: string;
    isSuperAdmin?: boolean;
}

interface TenantInfo {
    id: string;
    businessName: string;
    role: string;
    isOwner: boolean;
    status: string;
    permissions: string[];
    plan: 'free' | 'starter' | 'freelance' | 'enterprise';
    billingInterval: 'monthly' | 'annual';
    addonBundles: number;
    usageSummary: {
        instances: { used: number; limit: number | null };
        customDomains: { used: number; limit: number | null };
        staffAccounts: { used: number; allowed: boolean };
    };
}

interface InstanceInfo {
    id: string;
    name: string;
    subdomain: string;
    fullDomain?: string | null;
    customDomain?: string | null;
    customDomainHostnameStatus?: string | null;
    customDomainSslStatus?: string | null;
    customDomainIsActive?: boolean;
    customDomainLastCheckedAt?: string | null;
    customDomainActivatedAt?: string | null;
    timezone: string;
    businessType: string | null;
    status: string;
}

interface AuthState {
    user: User | null;
    tenants: TenantInfo[];
    currentTenant: TenantInfo | null;
    instances: InstanceInfo[];
    currentInstance: InstanceInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthErrorDetail {
    field: string;
    message: string;
}

interface AuthActionResult {
    success: boolean;
    code?: string;
    error?: string;
    field?: string;
    details?: AuthErrorDetail[];
    redirectTo?: string;
}

interface RegisterResult extends AuthActionResult {
    userId?: string;
}

interface TenantCreationResult extends AuthActionResult {
    tenantId?: string;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<AuthActionResult>;
    register: (data: RegisterData) => Promise<RegisterResult>;
    logout: () => Promise<void>;
    switchTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
    switchInstance: (instanceId: string) => void;
    createTenant: (businessName: string) => Promise<TenantCreationResult>;
    loadInstances: () => Promise<void>;
    hasPermission: (key: string) => boolean;
}

interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    whatsappNumber: string;
    _deviceFingerprint?: FingerprintResult | null;
    referralCode?: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    'click',
    'mousedown',
    'mousemove',
    'pointerdown',
    'pointermove',
    'keydown',
    'touchstart',
    'scroll',
    'focus',
];
const SESSION_REFRESH_CHECK_INTERVAL_MS = 60 * 1000;
const SESSION_REFRESH_BUFFER_MS = 2 * 60 * 1000;
const SESSION_IDLE_COUNTDOWN_TICK_MS = 1000;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const DEFAULT_IDLE_WARNING_COUNTDOWN_SECONDS = 60;
const SESSION_IDLE_TIMEOUT_MS = (() => {
    const configuredMinutes = Number(process.env.NEXT_PUBLIC_AUTH_IDLE_TIMEOUT_MINUTES);
    if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
        return configuredMinutes * 60 * 1000;
    }
    return DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;
})();
const SESSION_IDLE_WARNING_COUNTDOWN_MS = DEFAULT_IDLE_WARNING_COUNTDOWN_SECONDS * 1000;

function buildAuthFailure(input: {
    error?: { code?: string; message?: string; field?: string; details?: Array<{ field: string; message: string }> };
    fallbackMessage: string;
}): AuthActionResult {
    const details = input.error?.details?.length
        ? input.error.details
        : input.error?.field
            ? [{ field: input.error.field, message: input.error.message || input.fallbackMessage }]
            : undefined;

    return {
        success: false,
        code: input.error?.code,
        error: input.error?.message || input.fallbackMessage,
        field: input.error?.field,
        details,
    };
}

function normalizeTenantInfo(tenant: Partial<TenantInfo> & Pick<TenantInfo, 'id' | 'businessName' | 'role' | 'isOwner' | 'status' | 'permissions'>): TenantInfo {
    const plan = (tenant.plan || 'free') as TenantInfo['plan'];
    const billingInterval = (tenant.billingInterval || 'monthly') as TenantInfo['billingInterval'];

    return {
        ...tenant,
        plan,
        billingInterval,
        addonBundles: tenant.addonBundles ?? 0,
        usageSummary: tenant.usageSummary || {
            instances: { used: 0, limit: 1 },
            customDomains: { used: 0, limit: 1 },
            staffAccounts: { used: 0, allowed: true },
        },
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        tenants: [],
        currentTenant: null,
        instances: [],
        currentInstance: null,
        isLoading: true,
        isAuthenticated: false,
    });
    const [idleCountdownSecondsLeft, setIdleCountdownSecondsLeft] = useState<number | null>(null);
    const lastActivityAtRef = useRef<number>(Date.now());
    const keepAliveInFlightRef = useRef(false);
    const idleCountdownDeadlineRef = useRef<number | null>(null);
    const idleLogoutTriggeredRef = useRef(false);

    const clearLocalSession = useCallback((redirectToLogin: boolean) => {
        api.clearTokens();
        keepAliveInFlightRef.current = false;
        idleCountdownDeadlineRef.current = null;
        setIdleCountdownSecondsLeft(null);
        removeStorageItem('currentTenantId');
        removeStorageItem('currentInstanceId');
        setState({ user: null, tenants: [], currentTenant: null, instances: [], currentInstance: null, isLoading: false, isAuthenticated: false });
        if (redirectToLogin && typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }, []);

    const clearIdleCountdown = useCallback(() => {
        idleCountdownDeadlineRef.current = null;
        setIdleCountdownSecondsLeft(null);
    }, []);

    const beginIdleCountdown = useCallback(() => {
        if (idleCountdownDeadlineRef.current !== null) {
            return;
        }

        idleCountdownDeadlineRef.current = Date.now() + SESSION_IDLE_WARNING_COUNTDOWN_MS;
        setIdleCountdownSecondsLeft(Math.ceil(SESSION_IDLE_WARNING_COUNTDOWN_MS / 1000));
    }, []);

    const resumeSessionFromIdleWarning = useCallback(async () => {
        const hadIdleWarning = idleCountdownDeadlineRef.current !== null;
        clearIdleCountdown();
        if (!hadIdleWarning) {
            return;
        }

        const refreshed = await api.refreshSessionIfExpiringSoon(SESSION_REFRESH_BUFFER_MS);
        if (!refreshed) {
            clearLocalSession(true);
        }
    }, [clearIdleCountdown, clearLocalSession]);

    const handleStaySignedIn = useCallback(() => {
        lastActivityAtRef.current = Date.now();
        void resumeSessionFromIdleWarning();
    }, [resumeSessionFromIdleWarning]);

    // Load user on mount
    useEffect(() => {
        const token = api.getAccessToken();
        if (token) {
            loadUser();
        } else {
            setState((s) => ({ ...s, isLoading: false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearLocalSession]);

    async function loadUser() {
        const res = await api.get<{ user: User; tenants: TenantInfo[] }>('/auth/me');
        if (res.success && res.data) {
            const tenants = res.data.tenants.map((tenant) => normalizeTenantInfo(tenant));
            const storedTenantId = getStorageItem('currentTenantId');
            const currentTenant = tenants.find((t) => t.id === storedTenantId) || tenants[0] || null;

            if (currentTenant) {
                setStorageItem('currentTenantId', currentTenant.id);
            }

            setState({
                user: res.data.user,
                tenants,
                currentTenant,
                instances: [],
                currentInstance: null,
                isLoading: false,
                isAuthenticated: true,
            });

            // If we have a tenant, load its instances
            if (currentTenant) {
                await loadInstancesForTenant(currentTenant.id);
            }
        } else {
            clearLocalSession(false);
        }
    }

    async function loadInstancesForTenant(_tenantId?: string) {
        const res = await api.get<InstanceInfo[]>('/cms/instances', { omitInstanceHeader: true });
        if (res.success && res.data) {
            const storedInstanceId = getStorageItem('currentInstanceId');
            const currentInstance = res.data.find((i) => i.id === storedInstanceId) || res.data[0] || null;
            const customDomainCount = res.data.filter((instance) => Boolean(instance.customDomain)).length;

            if (currentInstance) {
                setStorageItem('currentInstanceId', currentInstance.id);
            }

            setState((s) => ({
                ...s,
                instances: res.data!,
                currentInstance,
                currentTenant: s.currentTenant
                    ? {
                        ...s.currentTenant,
                        usageSummary: {
                            ...s.currentTenant.usageSummary,
                            instances: {
                                ...s.currentTenant.usageSummary.instances,
                                used: res.data!.length,
                            },
                            customDomains: {
                                ...s.currentTenant.usageSummary.customDomains,
                                used: customDomainCount,
                            },
                        },
                    }
                    : null,
            }));
        }
    }

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post<{
            accessToken: string;
            user: User;
            tenants: TenantInfo[];
        }>('/auth/login', { email, password }, { skipAuth: true });

        if (!res.success || !res.data) {
            return buildAuthFailure({ error: res.error, fallbackMessage: 'Login failed' });
        }

        api.setAccessToken(res.data.accessToken);
        lastActivityAtRef.current = Date.now();

        const tenants = res.data.tenants.map((tenant) => normalizeTenantInfo(tenant));
        const firstTenant = tenants[0] || null;
        const isSuperAdmin = res.data.user.isSuperAdmin === true;
        let redirectTo = isSuperAdmin ? '/dashboard/superadmin' : '/dashboard';
        if (firstTenant) {
            setStorageItem('currentTenantId', firstTenant.id);
        } else if (!isSuperAdmin) {
            redirectTo = '/onboarding/create-organization?domainMode=customDomain';
        }

        setState({
            user: res.data.user,
            tenants,
            currentTenant: firstTenant,
            instances: [],
            currentInstance: null,
            isLoading: false,
            isAuthenticated: true,
        });

        // Load instances for the first tenant (not required for super admins).
        if (firstTenant && !isSuperAdmin) {
            // Need to ensure tenant header is set before loading instances
            const instanceRes = await api.get<InstanceInfo[]>('/cms/instances', { omitInstanceHeader: true });
            if (instanceRes.success && instanceRes.data) {
                const storedInstanceId = getStorageItem('currentInstanceId');
                const currentInstance = instanceRes.data.find((i) => i.id === storedInstanceId) || instanceRes.data[0] || null;
                if (instanceRes.data.length === 0) {
                    redirectTo = '/onboarding/create-organization?domainMode=customDomain';
                }
                if (currentInstance) {
                    setStorageItem('currentInstanceId', currentInstance.id);
                }
                setState((s) => ({
                    ...s,
                    instances: instanceRes.data!,
                    currentInstance,
                }));
            }
        }

        return { success: true, redirectTo };
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const res = await api.post<{
            accessToken: string;
            user: User;
        }>('/auth/register', data, { skipAuth: true });

        if (!res.success || !res.data) {
            return buildAuthFailure({ error: res.error, fallbackMessage: 'Registration failed' });
        }

        api.setAccessToken(res.data.accessToken);
        lastActivityAtRef.current = Date.now();

        setState({
            user: res.data.user,
            tenants: [],
            currentTenant: null,
            instances: [],
            currentInstance: null,
            isLoading: false,
            isAuthenticated: true,
        });

        return { success: true, userId: res.data.user.id };
    }, []);

    const createTenant = useCallback(async (businessName: string) => {
        const res = await api.post<{
            accessToken: string;
            tenant: TenantInfo;
        }>('/cms/tenants', { businessName });

        if (!res.success || !res.data) {
            return buildAuthFailure({ error: res.error, fallbackMessage: 'Failed to create organization' });
        }

        const normalizedTenant = normalizeTenantInfo(res.data.tenant);
        api.setAccessToken(res.data.accessToken);
        lastActivityAtRef.current = Date.now();
        setStorageItem('currentTenantId', normalizedTenant.id);

        setState((s) => ({
            ...s,
            tenants: [...s.tenants, normalizedTenant],
            currentTenant: normalizedTenant,
            instances: [],
            currentInstance: null,
        }));

        return { success: true, tenantId: normalizedTenant.id };
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        clearLocalSession(true);
    }, [clearLocalSession]);

    const switchTenant = useCallback(async (tenantId: string) => {
        const res = await api.post<{
            accessToken: string;
            tenant: TenantInfo;
        }>('/auth/switch-tenant', { tenantId });

        if (!res.success || !res.data) {
            return { success: false, error: res.error?.message || 'Failed to switch organization' };
        }

        const normalizedTenant = normalizeTenantInfo(res.data.tenant);
        api.setAccessToken(res.data.accessToken);
        lastActivityAtRef.current = Date.now();
        setStorageItem('currentTenantId', tenantId);
        removeStorageItem('currentInstanceId');

        setState((s) => ({
            ...s,
            currentTenant: normalizedTenant,
            tenants: s.tenants.map((t) =>
                t.id === tenantId ? normalizedTenant : t,
            ),
            instances: [],
            currentInstance: null,
        }));

        // Load instances for the new tenant
        const instanceRes = await api.get<InstanceInfo[]>('/cms/instances', { omitInstanceHeader: true });
        if (instanceRes.success && instanceRes.data) {
            const currentInstance = instanceRes.data[0] || null;
            if (currentInstance) {
                setStorageItem('currentInstanceId', currentInstance.id);
            }
            setState((s) => ({
                ...s,
                instances: instanceRes.data!,
                currentInstance,
            }));
        }

        return { success: true };
    }, []);

    const switchInstance = useCallback((instanceId: string) => {
        setState((s) => {
            const instance = s.instances.find((i) => i.id === instanceId) || null;
            if (instance) {
                setStorageItem('currentInstanceId', instance.id);
            }
            return { ...s, currentInstance: instance };
        });
    }, []);

    const loadInstances = useCallback(async () => {
        await loadInstancesForTenant();
    }, []);

    const hasPermission = useCallback((key: string) => {
        if (!state.currentTenant) return false;
        if (state.currentTenant.isOwner) return true;
        return state.currentTenant.permissions.includes(key);
    }, [state.currentTenant]);

    useEffect(() => {
        if (state.isAuthenticated) {
            return;
        }

        idleCountdownDeadlineRef.current = null;
        idleLogoutTriggeredRef.current = false;
        setIdleCountdownSecondsLeft(null);
    }, [state.isAuthenticated]);

    useEffect(() => {
        if (!state.isAuthenticated || typeof window === 'undefined') {
            return;
        }

        lastActivityAtRef.current = Date.now();
        idleLogoutTriggeredRef.current = false;

        const updateIdleCountdown = () => {
            const deadline = idleCountdownDeadlineRef.current;
            if (deadline === null) {
                return;
            }

            const remainingMs = deadline - Date.now();
            if (remainingMs <= 0) {
                if (idleLogoutTriggeredRef.current) {
                    return;
                }

                idleLogoutTriggeredRef.current = true;
                clearLocalSession(true);
                return;
            }

            const remainingSeconds = Math.ceil(remainingMs / 1000);
            setIdleCountdownSecondsLeft((current) => (current === remainingSeconds ? current : remainingSeconds));
        };

        const startIdleCountdownIfNeeded = () => {
            if (idleCountdownDeadlineRef.current !== null) {
                updateIdleCountdown();
                return true;
            }

            const idleDurationMs = Date.now() - lastActivityAtRef.current;
            if (idleDurationMs <= SESSION_IDLE_TIMEOUT_MS) {
                return false;
            }

            beginIdleCountdown();
            updateIdleCountdown();
            return true;
        };

        const markActivity = () => {
            lastActivityAtRef.current = Date.now();
            if (idleCountdownDeadlineRef.current !== null) {
                void resumeSessionFromIdleWarning();
            }
        };
        const markVisibleAsActivity = () => {
            if (document.visibilityState === 'visible') {
                markActivity();
            }
        };

        const keepSessionAlive = async () => {
            const token = api.getAccessToken();
            if (!token) {
                clearLocalSession(true);
                return;
            }

            if (startIdleCountdownIfNeeded()) {
                return;
            }

            if (keepAliveInFlightRef.current) {
                return;
            }

            keepAliveInFlightRef.current = true;
            try {
                const refreshed = await api.refreshSessionIfExpiringSoon(SESSION_REFRESH_BUFFER_MS);
                if (!refreshed) {
                    clearLocalSession(true);
                }
            } finally {
                keepAliveInFlightRef.current = false;
            }
        };

        const monitorIdleState = () => {
            const isIdle = startIdleCountdownIfNeeded();
            if (!isIdle) {
                if (idleCountdownDeadlineRef.current !== null) {
                    clearIdleCountdown();
                }
                return;
            }

            updateIdleCountdown();
        };

        for (const eventName of USER_ACTIVITY_EVENTS) {
            window.addEventListener(eventName, markActivity, { passive: true });
        }
        document.addEventListener('visibilitychange', markVisibleAsActivity);

        const keepAliveIntervalId = window.setInterval(() => {
            void keepSessionAlive();
        }, SESSION_REFRESH_CHECK_INTERVAL_MS);
        const idleMonitorIntervalId = window.setInterval(() => {
            monitorIdleState();
        }, SESSION_IDLE_COUNTDOWN_TICK_MS);

        void keepSessionAlive();
        monitorIdleState();

        return () => {
            window.clearInterval(keepAliveIntervalId);
            window.clearInterval(idleMonitorIntervalId);
            for (const eventName of USER_ACTIVITY_EVENTS) {
                window.removeEventListener(eventName, markActivity);
            }
            document.removeEventListener('visibilitychange', markVisibleAsActivity);
        };
    }, [
        state.isAuthenticated,
        beginIdleCountdown,
        clearIdleCountdown,
        clearLocalSession,
        resumeSessionFromIdleWarning,
    ]);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                register,
                logout,
                switchTenant,
                switchInstance,
                createTenant,
                loadInstances,
                hasPermission,
            }}
        >
            {children}
            {state.isAuthenticated && idleCountdownSecondsLeft !== null && (
                <div className="fixed inset-x-4 bottom-4 z-[120] sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-lg dark:border-amber-900/50 dark:bg-amber-950/80">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Session will expire soon</p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                            No activity detected. You will be signed out in {idleCountdownSecondsLeft}
                            {' '}
                            second{idleCountdownSecondsLeft === 1 ? '' : 's'}.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleStaySignedIn}
                                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                            >
                                Stay signed in
                            </button>
                            <button
                                type="button"
                                onClick={() => void logout()}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
