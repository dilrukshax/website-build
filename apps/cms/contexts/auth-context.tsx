'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    _deviceFingerprint?: FingerprintResult | null;
    referralCode?: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
            staffAccounts: { used: 0, allowed: plan !== 'free' },
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

    // Load user on mount
    useEffect(() => {
        const token = api.getAccessToken();
        if (token) {
            loadUser();
        } else {
            setState((s) => ({ ...s, isLoading: false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            api.clearTokens();
            setState({ user: null, tenants: [], currentTenant: null, instances: [], currentInstance: null, isLoading: false, isAuthenticated: false });
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

        const tenants = res.data.tenants.map((tenant) => normalizeTenantInfo(tenant));
        const firstTenant = tenants[0] || null;
        if (firstTenant) {
            setStorageItem('currentTenantId', firstTenant.id);
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

        // Load instances for the first tenant
        if (firstTenant) {
            // Need to ensure tenant header is set before loading instances
            const instanceRes = await api.get<InstanceInfo[]>('/cms/instances', { omitInstanceHeader: true });
            if (instanceRes.success && instanceRes.data) {
                const storedInstanceId = getStorageItem('currentInstanceId');
                const currentInstance = instanceRes.data.find((i) => i.id === storedInstanceId) || instanceRes.data[0] || null;
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

        return { success: true };
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
        api.clearTokens();
        removeStorageItem('currentTenantId');
        removeStorageItem('currentInstanceId');
        setState({ user: null, tenants: [], currentTenant: null, instances: [], currentInstance: null, isLoading: false, isAuthenticated: false });
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }, []);

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
