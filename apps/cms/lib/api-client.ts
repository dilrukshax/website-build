import { getStorageItem } from './browser-storage';

const API_PROXY_BASE_URL = (process.env.NEXT_PUBLIC_API_PROXY_BASE || '/api').trim().replace(/\/+$/, '') || '/api';
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60;
const PARALLEL_REFRESH_RECOVERY_TIMEOUT_MS = 1500;
const PARALLEL_REFRESH_RECOVERY_POLL_MS = 100;

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
    private refreshPromise: Promise<boolean> | null = null;

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (typeof document !== 'undefined') {
            if (token) {
                document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
            } else {
                document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
            }
        }
    }

    getAccessToken(): string | null {
        if (typeof document === 'undefined') {
            return this.accessToken;
        }

        const cookieToken = this.readAccessTokenFromCookie();
        this.accessToken = cookieToken;
        return cookieToken;
    }

    clearTokens() {
        this.setAccessToken(null);
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
        let activeAccessToken: string | null = null;

        if (!options?.skipAuth) {
            activeAccessToken = this.getAccessToken();
            if (activeAccessToken) {
                headers['Authorization'] = `Bearer ${activeAccessToken}`;
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
                const refreshedToken = this.getAccessToken();
                if (refreshedToken) {
                    headers['Authorization'] = `Bearer ${refreshedToken}`;
                } else {
                    delete headers['Authorization'];
                }
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

            // Another tab/process may have refreshed and rotated tokens concurrently.
            const tokenFromParallelRefresh = await this.waitForTokenUpdate(activeAccessToken);
            if (tokenFromParallelRefresh) {
                headers['Authorization'] = `Bearer ${tokenFromParallelRefresh}`;
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

                if (retryRes.status !== 401) {
                    return this.parseResponse<T>(retryRes);
                }
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

    private readAccessTokenFromCookie(): string | null {
        if (typeof document === 'undefined') {
            return this.accessToken;
        }

        const pattern = new RegExp(`(?:^|; )${ACCESS_TOKEN_COOKIE_NAME}=([^;]*)`);
        const match = document.cookie.match(pattern);
        return match ? match[1]! : null;
    }

    private async waitForTokenUpdate(previousToken: string | null): Promise<string | null> {
        if (typeof document === 'undefined') {
            return null;
        }

        const startedAt = Date.now();
        while ((Date.now() - startedAt) < PARALLEL_REFRESH_RECOVERY_TIMEOUT_MS) {
            const latestToken = this.readAccessTokenFromCookie();
            if (latestToken && latestToken !== previousToken) {
                this.accessToken = latestToken;
                return latestToken;
            }
            await new Promise((resolve) => setTimeout(resolve, PARALLEL_REFRESH_RECOVERY_POLL_MS));
        }

        return null;
    }

    async refreshSessionIfExpiringSoon(bufferMs: number = 2 * 60 * 1000): Promise<boolean> {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }

        if (!this.isTokenExpiringSoon(token, bufferMs)) {
            return true;
        }

        return this.tryRefresh();
    }

    private isTokenExpiringSoon(token: string, bufferMs: number): boolean {
        const expiresAt = this.getTokenExpiryMs(token);
        if (expiresAt === null) {
            // If we cannot parse the token safely, prefer refreshing.
            return true;
        }

        return (expiresAt - Date.now()) <= bufferMs;
    }

    private getTokenExpiryMs(token: string): number | null {
        const segments = token.split('.');
        if (segments.length < 2 || !segments[1]) {
            return null;
        }

        const payloadText = this.decodeBase64Url(segments[1]);
        if (!payloadText) {
            return null;
        }

        try {
            const parsed = JSON.parse(payloadText) as { exp?: unknown };
            if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp)) {
                return null;
            }

            return parsed.exp * 1000;
        } catch {
            return null;
        }
    }

    private decodeBase64Url(value: string): string | null {
        const paddedValue = value
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(value.length / 4) * 4, '=');

        try {
            if (typeof globalThis.atob === 'function') {
                return globalThis.atob(paddedValue);
            }
            return null;
        } catch {
            return null;
        }
    }

    private async tryRefresh(): Promise<boolean> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.performRefresh();
        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async performRefresh(): Promise<boolean> {
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
