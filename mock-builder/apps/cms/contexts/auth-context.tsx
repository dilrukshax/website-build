'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api-client';

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
}

interface InstanceInfo {
    id: string;
    name: string;
    subdomain: string;
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

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    switchTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
    switchInstance: (instanceId: string) => void;
    createTenant: (businessName: string) => Promise<{ success: boolean; error?: string; tenantId?: string }>;
    loadInstances: () => Promise<void>;
    hasPermission: (key: string) => boolean;
}

interface RegisterData {
    email: string;
    password: string;
    fullName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
            const storedTenantId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentTenantId') : null;
            const currentTenant = res.data.tenants.find((t) => t.id === storedTenantId) || res.data.tenants[0] || null;

            if (currentTenant && typeof localStorage !== 'undefined') {
                localStorage.setItem('currentTenantId', currentTenant.id);
            }

            setState({
                user: res.data.user,
                tenants: res.data.tenants,
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
        const res = await api.get<InstanceInfo[]>('/cms/instances');
        if (res.success && res.data) {
            const storedInstanceId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentInstanceId') : null;
            const currentInstance = res.data.find((i) => i.id === storedInstanceId) || res.data[0] || null;

            if (currentInstance && typeof localStorage !== 'undefined') {
                localStorage.setItem('currentInstanceId', currentInstance.id);
            }

            setState((s) => ({
                ...s,
                instances: res.data!,
                currentInstance,
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
            return { success: false, error: res.error?.message || 'Login failed' };
        }

        api.setAccessToken(res.data.accessToken);

        const firstTenant = res.data.tenants[0] || null;
        if (firstTenant && typeof localStorage !== 'undefined') {
            localStorage.setItem('currentTenantId', firstTenant.id);
        }

        setState({
            user: res.data.user,
            tenants: res.data.tenants,
            currentTenant: firstTenant,
            instances: [],
            currentInstance: null,
            isLoading: false,
            isAuthenticated: true,
        });

        // Load instances for the first tenant
        if (firstTenant) {
            // Need to ensure tenant header is set before loading instances
            const instanceRes = await api.get<InstanceInfo[]>('/cms/instances');
            if (instanceRes.success && instanceRes.data) {
                const storedInstanceId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentInstanceId') : null;
                const currentInstance = instanceRes.data.find((i) => i.id === storedInstanceId) || instanceRes.data[0] || null;
                if (currentInstance && typeof localStorage !== 'undefined') {
                    localStorage.setItem('currentInstanceId', currentInstance.id);
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
            return { success: false, error: res.error?.message || 'Registration failed' };
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

        return { success: true };
    }, []);

    const createTenant = useCallback(async (businessName: string) => {
        const res = await api.post<{
            accessToken: string;
            tenant: TenantInfo;
        }>('/cms/tenants', { businessName });

        if (!res.success || !res.data) {
            return { success: false, error: res.error?.message || 'Failed to create organization' };
        }

        api.setAccessToken(res.data.accessToken);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentTenantId', res.data.tenant.id);
        }

        setState((s) => ({
            ...s,
            tenants: [...s.tenants, res.data!.tenant],
            currentTenant: res.data!.tenant,
            instances: [],
            currentInstance: null,
        }));

        return { success: true, tenantId: res.data.tenant.id };
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        api.clearTokens();
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentTenantId');
            localStorage.removeItem('currentInstanceId');
        }
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

        api.setAccessToken(res.data.accessToken);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentTenantId', tenantId);
            localStorage.removeItem('currentInstanceId');
        }

        setState((s) => ({
            ...s,
            currentTenant: res.data!.tenant,
            tenants: s.tenants.map((t) =>
                t.id === tenantId ? res.data!.tenant : t,
            ),
            instances: [],
            currentInstance: null,
        }));

        // Load instances for the new tenant
        const instanceRes = await api.get<InstanceInfo[]>('/cms/instances');
        if (instanceRes.success && instanceRes.data) {
            const currentInstance = instanceRes.data[0] || null;
            if (currentInstance && typeof localStorage !== 'undefined') {
                localStorage.setItem('currentInstanceId', currentInstance.id);
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
            if (instance && typeof localStorage !== 'undefined') {
                localStorage.setItem('currentInstanceId', instance.id);
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
