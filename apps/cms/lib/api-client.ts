import { getStorageItem } from './browser-storage';

const API_PROXY_BASE_URL = (process.env.NEXT_PUBLIC_API_PROXY_BASE || '/api').trim().replace(/\/+$/, '') || '/api';

function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_PROXY_BASE_URL}${normalizedPath}`;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        field?: string;
        details?: Array<{ field: string; message: string }>;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

interface RequestOptions {
    skipAuth?: boolean;
    omitTenantHeader?: boolean;
    omitInstanceHeader?: boolean;
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
        options?: RequestOptions,
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
        if (!options?.omitTenantHeader) {
            const tenantId = getStorageItem('currentTenantId');
            if (tenantId) {
                headers['X-Tenant-ID'] = tenantId;
            }
        }
        if (!options?.omitInstanceHeader) {
            const instanceId = getStorageItem('currentInstanceId');
            if (instanceId) {
                headers['X-Instance-ID'] = instanceId;
            }
        }

        let res: Response;
        try {
            res = await fetch(buildApiUrl(path), {
                method,
                headers,
                credentials: 'include',
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Unable to reach server',
                },
            };
        }

        // Try to refresh on 401
        if (res.status === 401 && !options?.skipAuth && !path.includes('/auth/refresh')) {
            const refreshed = await this.tryRefresh();
            if (refreshed) {
                // Retry the original request with new token
                headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                let retryRes: Response;
                try {
                    retryRes = await fetch(buildApiUrl(path), {
                        method,
                        headers,
                        credentials: 'include',
                        body: body ? JSON.stringify(body) : undefined,
                    });
                } catch (error) {
                    return {
                        success: false,
                        error: {
                            code: 'NETWORK_ERROR',
                            message: error instanceof Error ? error.message : 'Unable to reach server',
                        },
                    };
                }
                return this.parseResponse<T>(retryRes);
            }
            // Refresh failed — redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } };
        }

        return this.parseResponse<T>(res);
    }

    private async parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
        let payload: unknown;
        try {
            payload = await res.json();
        } catch {
            return {
                success: false,
                error: {
                    code: 'INVALID_RESPONSE',
                    message: 'Unable to parse server response',
                },
            };
        }

        return this.normalizeResponse<T>(payload);
    }

    private normalizeResponse<T>(payload: unknown): ApiResponse<T> {
        if (!payload || typeof payload !== 'object') {
            return {
                success: false,
                error: {
                    code: 'INVALID_RESPONSE',
                    message: 'Unexpected response format',
                },
            };
        }

        const raw = payload as Record<string, unknown>;
        const isFailure = raw.success === false;

        if (!isFailure) {
            return payload as ApiResponse<T>;
        }

        const rawError = (typeof raw.error === 'object' && raw.error !== null)
            ? raw.error as Record<string, unknown>
            : null;
        const rawErrors = Array.isArray(raw.errors) ? raw.errors as Array<Record<string, unknown>> : [];

        const detailsFromError = this.normalizeDetails(rawError?.details);
        const detailsFromLegacyErrors = this.normalizeDetails(rawErrors);
        const details = detailsFromError.length > 0 ? detailsFromError : detailsFromLegacyErrors;

        const firstLegacyError = rawErrors[0];
        const code = (typeof rawError?.code === 'string' && rawError.code)
            || (typeof firstLegacyError?.code === 'string' && firstLegacyError.code)
            || 'REQUEST_FAILED';
        const message = (typeof rawError?.message === 'string' && rawError.message)
            || (typeof firstLegacyError?.message === 'string' && firstLegacyError.message)
            || 'Request failed';
        const field = (typeof rawError?.field === 'string' && rawError.field)
            || (typeof firstLegacyError?.field === 'string' && firstLegacyError.field)
            || undefined;

        return {
            success: false,
            error: {
                code,
                message,
                ...(field ? { field } : {}),
                ...(details.length > 0 ? { details } : {}),
            },
        };
    }

    private normalizeDetails(value: unknown): Array<{ field: string; message: string }> {
        if (!Array.isArray(value)) {
            return [];
        }

        const details: Array<{ field: string; message: string }> = [];
        for (const item of value) {
            if (!item || typeof item !== 'object') {
                continue;
            }

            const entry = item as Record<string, unknown>;
            if (typeof entry.message !== 'string' || !entry.message.trim()) {
                continue;
            }

            details.push({
                field: typeof entry.field === 'string' ? entry.field : '',
                message: entry.message,
            });
        }

        return details;
    }

    private async tryRefresh(): Promise<boolean> {
        try {
            const res = await fetch(buildApiUrl('/auth/refresh'), {
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
    get<T>(path: string, options?: RequestOptions) {
        return this.request<T>('GET', path, undefined, options);
    }

    post<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>('POST', path, body, options);
    }

    put<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>('PUT', path, body, options);
    }

    patch<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>('PATCH', path, body, options);
    }

    del<T>(path: string, options?: RequestOptions) {
        return this.request<T>('DELETE', path, undefined, options);
    }
}

export const api = new ApiClient();
