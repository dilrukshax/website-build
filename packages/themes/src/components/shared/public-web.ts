'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

type ThemeContext = ThemeComponentProps['context'];
const BOOKING_SELECTED_SERVICE_STORAGE_KEY = 'booking:selected-service-id';
const BOOKING_SELECTED_SERVICE_EVENT = 'booking:selected-service-changed';

interface ApiErrorPayload {
    code?: string;
    message?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiErrorPayload;
}

interface ApiListPayload<T> {
    items?: T[];
}

export interface PublicService {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number | string;
    currency: string;
}

export interface PublicProduct {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number | string;
    currency: string;
}

export interface PublicBlogCard {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PublicBlogPost extends PublicBlogCard {
    contentHtml: string;
    seoJsonb?: Record<string, unknown> | null;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface BookingPayload {
    serviceId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
}

export interface InquiryPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    message: string;
    sourceType?: 'contact_form' | 'booking_form';
    sourcePageSlug?: string;
}

function normalizeOptionalText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function toHeaders(context?: ThemeContext, includeJson = false): Headers {
    const headers = new Headers();
    if (includeJson) {
        headers.set('Content-Type', 'application/json');
    }
    if (context?.tenantId) {
        headers.set('X-Tenant-ID', context.tenantId);
    }
    if (context?.instanceId) {
        headers.set('X-Instance-ID', context.instanceId);
    }
    return headers;
}

function parseSourceSlug(input: string | undefined, fallback: string): string {
    const raw = normalizeOptionalText(input) || normalizeOptionalText(fallback);
    if (!raw) {
        return '/';
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
}

function parseApiErrorMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== 'object') {
        return fallback;
    }
    const candidate = payload as { error?: { message?: unknown } };
    if (typeof candidate.error?.message === 'string' && candidate.error.message.trim().length > 0) {
        return candidate.error.message;
    }
    return fallback;
}

function normalizeService(item: unknown): PublicService | null {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.name !== 'string') return null;
    return {
        id: record.id,
        name: record.name,
        description: typeof record.description === 'string' ? record.description : null,
        duration: typeof record.duration === 'number' ? record.duration : Number(record.duration || 0),
        price: typeof record.price === 'number' || typeof record.price === 'string' ? record.price : 0,
        currency: typeof record.currency === 'string' ? record.currency : 'USD',
    };
}

function normalizeProduct(item: unknown): PublicProduct | null {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.name !== 'string') return null;
    return {
        id: record.id,
        name: record.name,
        description: typeof record.description === 'string' ? record.description : null,
        imageUrl: typeof record.imageUrl === 'string' && record.imageUrl.trim().length > 0 ? record.imageUrl : null,
        price: typeof record.price === 'number' || typeof record.price === 'string' ? record.price : 0,
        currency: typeof record.currency === 'string' ? record.currency : 'USD',
    };
}

function normalizeBlogCard(item: unknown): PublicBlogCard | null {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.title !== 'string' || typeof record.slug !== 'string') return null;
    return {
        id: record.id,
        title: record.title,
        slug: record.slug,
        excerpt: typeof record.excerpt === 'string' ? record.excerpt : null,
        featuredImageUrl: typeof record.featuredImageUrl === 'string' && record.featuredImageUrl.trim().length > 0
            ? record.featuredImageUrl
            : null,
        publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : null,
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    };
}

function normalizeBlogPost(item: unknown): PublicBlogPost | null {
    const card = normalizeBlogCard(item);
    if (!card) return null;
    const record = item as Record<string, unknown>;
    if (typeof record.contentHtml !== 'string') {
        return null;
    }

    return {
        ...card,
        contentHtml: record.contentHtml,
        seoJsonb: typeof record.seoJsonb === 'object' && record.seoJsonb !== null
            ? record.seoJsonb as Record<string, unknown>
            : null,
    };
}

function normalizeServices(payload: unknown): PublicService[] {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const response = payload as ApiResponse<PublicService[] | ApiListPayload<PublicService>>;
    if (!response.success || !response.data) {
        return [];
    }

    if (Array.isArray(response.data)) {
        return response.data
            .map(normalizeService)
            .filter((service): service is PublicService => service !== null);
    }

    if (Array.isArray(response.data.items)) {
        return response.data.items
            .map(normalizeService)
            .filter((service): service is PublicService => service !== null);
    }

    return [];
}

function normalizeProducts(payload: unknown): PublicProduct[] {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const response = payload as ApiResponse<PublicProduct[] | ApiListPayload<PublicProduct>>;
    if (!response.success || !response.data) {
        return [];
    }

    if (Array.isArray(response.data)) {
        return response.data
            .map(normalizeProduct)
            .filter((product): product is PublicProduct => product !== null);
    }

    if (Array.isArray(response.data.items)) {
        return response.data.items
            .map(normalizeProduct)
            .filter((product): product is PublicProduct => product !== null);
    }

    return [];
}

function normalizeBlogs(payload: unknown): PublicBlogCard[] {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const response = payload as ApiResponse<PublicBlogCard[] | ApiListPayload<PublicBlogCard>>;
    if (!response.success || !response.data) {
        return [];
    }

    if (Array.isArray(response.data)) {
        return response.data
            .map(normalizeBlogCard)
            .filter((post): post is PublicBlogCard => post !== null);
    }

    if (Array.isArray(response.data.items)) {
        return response.data.items
            .map(normalizeBlogCard)
            .filter((post): post is PublicBlogCard => post !== null);
    }

    return [];
}

function normalizeBlogDetail(payload: unknown): PublicBlogPost | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const response = payload as ApiResponse<PublicBlogPost>;
    if (!response.success || !response.data) {
        return null;
    }

    return normalizeBlogPost(response.data);
}

function toNumber(value: number | string): number {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function createApiUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized;
}

export function rememberSelectedService(serviceId: string): void {
    if (typeof window === 'undefined' || !serviceId) {
        return;
    }

    try {
        window.sessionStorage.setItem(BOOKING_SELECTED_SERVICE_STORAGE_KEY, serviceId);
    } catch {
        // Ignore storage failures in restrictive browser modes.
    }

    window.dispatchEvent(new CustomEvent(BOOKING_SELECTED_SERVICE_EVENT, {
        detail: { serviceId },
    }));
}

function readRememberedSelectedService(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        return normalizeOptionalText(window.sessionStorage.getItem(BOOKING_SELECTED_SERVICE_STORAGE_KEY));
    } catch {
        return '';
    }
}

export function formatServicePrice(price: number | string, currency: string): string {
    const amount = toNumber(price);
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency || 'USD'}`;
    }
}

export function formatServiceDuration(durationInMinutes: number): string {
    if (!Number.isFinite(durationInMinutes) || durationInMinutes <= 0) {
        return '';
    }

    if (durationInMinutes % 60 === 0) {
        const hours = durationInMinutes / 60;
        return hours === 1 ? '1 hour' : `${hours} hours`;
    }

    return `${durationInMinutes} min`;
}

function getDefaultDateTimeParts(): { date: string; time: string } {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { date, time };
}

export async function fetchPublicServices(context?: ThemeContext): Promise<PublicService[]> {
    const response = await fetch(createApiUrl('/web/services'), {
        method: 'GET',
        headers: toHeaders(context),
        cache: 'no-store',
    });

    if (!response.ok) {
        return [];
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        return [];
    }

    return normalizeServices(payload);
}

export async function fetchPublicProducts(context?: ThemeContext): Promise<PublicProduct[]> {
    const response = await fetch(createApiUrl('/web/products'), {
        method: 'GET',
        headers: toHeaders(context),
        cache: 'no-store',
    });

    if (!response.ok) {
        return [];
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        return [];
    }

    return normalizeProducts(payload);
}

export async function fetchPublicBlogs(context?: ThemeContext): Promise<PublicBlogCard[]> {
    const response = await fetch(createApiUrl('/web/blogs'), {
        method: 'GET',
        headers: toHeaders(context),
        cache: 'no-store',
    });

    if (!response.ok) {
        return [];
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        return [];
    }

    return normalizeBlogs(payload);
}

export async function fetchPublicBlogBySlug(slug: string, context?: ThemeContext): Promise<PublicBlogPost | null> {
    const normalizedSlug = normalizeOptionalText(slug);
    if (!normalizedSlug) {
        return null;
    }

    const response = await fetch(createApiUrl(`/web/blogs/${encodeURIComponent(normalizedSlug)}`), {
        method: 'GET',
        headers: toHeaders(context),
        cache: 'no-store',
    });

    if (!response.ok) {
        return null;
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        return null;
    }

    return normalizeBlogDetail(payload);
}

export async function createPublicInquiry(payload: InquiryPayload, context?: ThemeContext): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(createApiUrl('/web/inquiries'), {
        method: 'POST',
        headers: toHeaders(context, true),
        body: JSON.stringify(payload),
    });

    let responsePayload: unknown = null;
    try {
        responsePayload = await response.json();
    } catch {
        // Ignore parse errors and use generic status text fallback.
    }

    if (!response.ok) {
        return {
            success: false,
            message: parseApiErrorMessage(responsePayload, 'Could not send your message. Please try again.'),
        };
    }

    const data = responsePayload as ApiResponse<unknown> | null;
    if (!data?.success) {
        return {
            success: false,
            message: parseApiErrorMessage(responsePayload, 'Could not send your message. Please try again.'),
        };
    }

    return { success: true };
}

export async function createPublicBooking(payload: BookingPayload, context?: ThemeContext): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(createApiUrl('/web/bookings'), {
        method: 'POST',
        headers: toHeaders(context, true),
        body: JSON.stringify(payload),
    });

    let responsePayload: unknown = null;
    try {
        responsePayload = await response.json();
    } catch {
        // Ignore parse errors and use generic status text fallback.
    }

    if (!response.ok) {
        return {
            success: false,
            message: parseApiErrorMessage(responsePayload, 'Could not complete booking. Please try again.'),
        };
    }

    const data = responsePayload as ApiResponse<unknown> | null;
    if (!data?.success) {
        return {
            success: false,
            message: parseApiErrorMessage(responsePayload, 'Could not complete booking. Please try again.'),
        };
    }

    return { success: true };
}

export function usePublicServices(context?: ThemeContext) {
    const [services, setServices] = useState<PublicService[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enabled = context?.dataMode !== 'preview';

    useEffect(() => {
        if (!enabled) {
            setServices([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(null);

        void (async () => {
            try {
                const nextServices = await fetchPublicServices(context);
                if (!mounted) return;
                setServices(nextServices);
            } catch (err) {
                if (!mounted) return;
                const message = err instanceof Error ? err.message : 'Could not load services right now.';
                setError(message);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [enabled, context?.tenantId, context?.instanceId]);

    return { services, loading, error };
}

export function usePublicProducts(context?: ThemeContext) {
    const [products, setProducts] = useState<PublicProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enabled = context?.dataMode !== 'preview';

    useEffect(() => {
        if (!enabled) {
            setProducts([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(null);

        void (async () => {
            try {
                const nextProducts = await fetchPublicProducts(context);
                if (!mounted) return;
                setProducts(nextProducts);
            } catch (err) {
                if (!mounted) return;
                const message = err instanceof Error ? err.message : 'Could not load products right now.';
                setError(message);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [enabled, context?.tenantId, context?.instanceId]);

    return { products, loading, error };
}

export function usePublicBlogs(context?: ThemeContext) {
    const [blogs, setBlogs] = useState<PublicBlogCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enabled = context?.dataMode !== 'preview';

    useEffect(() => {
        if (!enabled) {
            setBlogs([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(null);

        void (async () => {
            try {
                const nextBlogs = await fetchPublicBlogs(context);
                if (!mounted) return;
                setBlogs(nextBlogs);
            } catch (err) {
                if (!mounted) return;
                const message = err instanceof Error ? err.message : 'Could not load blog posts right now.';
                setError(message);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [enabled, context?.tenantId, context?.instanceId]);

    return { blogs, loading, error };
}

export function useContactInquiryForm(context?: ThemeContext) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<AsyncStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const reset = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setStatus('idle');
        setErrorMessage('');
    };

    const submit = async (): Promise<boolean> => {
        const normalizedFirstName = normalizeOptionalText(firstName);
        const normalizedLastName = normalizeOptionalText(lastName);
        const normalizedEmail = normalizeOptionalText(email);
        const normalizedPhone = normalizeOptionalText(phone);
        const normalizedMessage = normalizeOptionalText(message);

        if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedMessage) {
            setStatus('error');
            setErrorMessage('Please fill in first name, last name, email, and message.');
            return false;
        }

        setStatus('loading');
        setErrorMessage('');

        const result = await createPublicInquiry(
            {
                firstName: normalizedFirstName,
                lastName: normalizedLastName,
                email: normalizedEmail,
                phone: normalizedPhone || undefined,
                message: normalizedMessage,
                sourceType: 'contact_form',
                sourcePageSlug: parseSourceSlug(context?.pageSlug, '/'),
            },
            context,
        );

        if (!result.success) {
            setStatus('error');
            setErrorMessage(result.message || 'Could not send your message. Please try again.');
            return false;
        }

        setStatus('success');
        return true;
    };

    return {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        phone,
        setPhone,
        message,
        setMessage,
        status,
        errorMessage,
        submit,
        reset,
    };
}

export function useBookingForm(context?: ThemeContext) {
    const { services, loading: servicesLoading } = usePublicServices(context);
    const defaults = useMemo(getDefaultDateTimeParts, []);

    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [date, setDate] = useState(defaults.date);
    const [time, setTime] = useState(defaults.time);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<AsyncStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!selectedServiceId && services.length > 0) {
            setSelectedServiceId(services[0]!.id);
        }
    }, [services, selectedServiceId]);

    useEffect(() => {
        if (typeof window === 'undefined' || services.length === 0) {
            return;
        }

        const applyRememberedService = (serviceId: string) => {
            if (!serviceId) return;
            const matched = services.some((service) => service.id === serviceId);
            if (matched) {
                setSelectedServiceId(serviceId);
            }
        };

        applyRememberedService(readRememberedSelectedService());

        const handler = (event: Event) => {
            const custom = event as CustomEvent<{ serviceId?: string }>;
            applyRememberedService(normalizeOptionalText(custom.detail?.serviceId));
        };

        window.addEventListener(BOOKING_SELECTED_SERVICE_EVENT, handler as EventListener);
        return () => {
            window.removeEventListener(BOOKING_SELECTED_SERVICE_EVENT, handler as EventListener);
        };
    }, [services]);

    const selectedService = useMemo(
        () => services.find((service) => service.id === selectedServiceId) || null,
        [services, selectedServiceId],
    );

    const submit = async (): Promise<boolean> => {
        const normalizedFirstName = normalizeOptionalText(firstName);
        const normalizedLastName = normalizeOptionalText(lastName);
        const normalizedEmail = normalizeOptionalText(email);
        const normalizedPhone = normalizeOptionalText(phone);
        const normalizedDate = normalizeOptionalText(date);
        const normalizedTime = normalizeOptionalText(time);
        const normalizedNotes = normalizeOptionalText(notes);

        if (!selectedService) {
            setStatus('error');
            setErrorMessage('Please select a service.');
            return false;
        }

        if (!normalizedDate || !normalizedTime) {
            setStatus('error');
            setErrorMessage('Please choose a date and time.');
            return false;
        }

        if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
            setStatus('error');
            setErrorMessage('Please fill in first name, last name, and email.');
            return false;
        }

        const startDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
        if (Number.isNaN(startDateTime.getTime())) {
            setStatus('error');
            setErrorMessage('Please provide a valid booking date and time.');
            return false;
        }

        const durationMinutes = Number.isFinite(selectedService.duration) && selectedService.duration > 0
            ? selectedService.duration
            : 60;
        const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60_000));

        setStatus('loading');
        setErrorMessage('');

        const result = await createPublicBooking(
            {
                serviceId: selectedService.id,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                notes: normalizedNotes || undefined,
                customer: {
                    firstName: normalizedFirstName,
                    lastName: normalizedLastName,
                    email: normalizedEmail,
                    phone: normalizedPhone || undefined,
                },
            },
            context,
        );

        if (!result.success) {
            setStatus('error');
            setErrorMessage(result.message || 'Could not complete booking. Please try again.');
            return false;
        }

        setStatus('success');
        return true;
    };

    return {
        services,
        servicesLoading,
        selectedServiceId,
        setSelectedServiceId,
        selectedService,
        date,
        setDate,
        time,
        setTime,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        phone,
        setPhone,
        notes,
        setNotes,
        status,
        errorMessage,
        submit,
    };
}
