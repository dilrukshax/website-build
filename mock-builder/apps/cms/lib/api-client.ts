const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Array<{ field: string; message: string }>;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

class ApiClient {
    private accessToken: string | null = null;

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (typeof document !== 'undefined') {
            if (token) {
                document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60}; SameSite=Lax`;
            } else {
                document.cookie = 'accessToken=; path=/; max-age=0';
            }
        }
    }

    getAccessToken(): string | null {
        if (this.accessToken) return this.accessToken;
        // Read from cookie
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/);
            return match ? match[1]! : null;
        }
        return null;
    }

    clearTokens() {
        this.accessToken = null;
        if (typeof document !== 'undefined') {
            document.cookie = 'accessToken=; path=/; max-age=0';
        }
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        options?: { skipAuth?: boolean },
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (!options?.skipAuth) {
            const token = this.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Attach tenant and instance context for scoped routes
        const tenantId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentTenantId') : null;
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }
        const instanceId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentInstanceId') : null;
        if (instanceId) {
            headers['X-Instance-ID'] = instanceId;
        }

        const res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
        });

        // Try to refresh on 401
        if (res.status === 401 && !options?.skipAuth && !path.includes('/auth/refresh')) {
            const refreshed = await this.tryRefresh();
            if (refreshed) {
                // Retry the original request with new token
                headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                const retryRes = await fetch(`${API_BASE_URL}${path}`, {
                    method,
                    headers,
                    credentials: 'include',
                    body: body ? JSON.stringify(body) : undefined,
                });
                return retryRes.json() as Promise<ApiResponse<T>>;
            }
            // Refresh failed — redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } };
        }

        return res.json() as Promise<ApiResponse<T>>;
    }

    private async tryRefresh(): Promise<boolean> {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}),
            });
            if (!res.ok) return false;
            const data = (await res.json()) as ApiResponse<{ accessToken: string }>;
            if (data.success && data.data?.accessToken) {
                this.setAccessToken(data.data.accessToken);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // Public API methods
    get<T>(path: string, options?: { skipAuth?: boolean }) {
        return this.request<T>('GET', path, undefined, options);
    }

    post<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) {
        return this.request<T>('POST', path, body, options);
    }

    put<T>(path: string, body?: unknown) {
        return this.request<T>('PUT', path, body);
    }

    patch<T>(path: string, body?: unknown) {
        return this.request<T>('PATCH', path, body);
    }

    del<T>(path: string) {
        return this.request<T>('DELETE', path);
    }
}

export const api = new ApiClient();
