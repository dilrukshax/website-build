export type DomainMode = 'subdomain' | 'customDomain';

export type WebsiteSetupField = 'name' | 'subdomain' | 'businessType' | 'timezone' | 'customDomain' | 'domainMode';

export interface WebsiteSetupFormData {
    name: string;
    subdomain: string;
    businessType: string;
    timezone: string;
    customDomain: string;
    domainMode: DomainMode;
}

export interface WebsiteSetupValidationResult {
    cleanedName: string;
    cleanedSubdomain: string;
    cleanedBusinessType: string;
    cleanedTimezone: string;
    cleanedCustomDomain: string;
    domainMode: DomainMode;
    nextErrors: Partial<Record<WebsiteSetupField, string>>;
}

interface WorkspaceNameInput {
    fullName?: string | null;
    email?: string | null;
}

const ONBOARDING_DRAFT_STORAGE_KEY = 'onboardingWebsiteSetupDraft/v1';

const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const CUSTOM_DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const EDGE_HYPHEN_PATTERN = /^-+|-+$/g;

const COMMON_TIMEZONES = [
    'UTC',
    'Asia/Colombo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney',
] as const;

const COMMON_INDUSTRIES = [
    'Salon & Spa',
    'Restaurant & Cafe',
    'Fitness & Gym',
    'Medical & Healthcare',
    'Education & Tutoring',
    'Photography & Studio',
    'Consulting & Professional',
    'Events & Entertainment',
] as const;

export const WEBSITE_SETUP_TIMEZONE_SUGGESTIONS = COMMON_TIMEZONES;
export const WEBSITE_SETUP_INDUSTRY_SUGGESTIONS = COMMON_INDUSTRIES;

export function isValidIanaTimezone(value: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: value });
        return true;
    } catch {
        return false;
    }
}

export function getDefaultTimezone(): string {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        return isValidIanaTimezone(timezone) ? timezone : 'UTC';
    } catch {
        return 'UTC';
    }
}

export function getDefaultWebsiteSetupFormData(): WebsiteSetupFormData {
    return {
        name: '',
        subdomain: '',
        businessType: '',
        timezone: getDefaultTimezone(),
        customDomain: '',
        domainMode: 'subdomain',
    };
}

export function sanitizeSubdomainInput(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function normalizeSubdomainCandidate(value: string): string {
    return sanitizeSubdomainInput(value).replace(EDGE_HYPHEN_PATTERN, '');
}

export function normalizeDomainHost(input: string): string {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) {
        return '';
    }

    if (trimmed.includes('://') || trimmed.includes('/') || trimmed.includes('?') || trimmed.includes('#')) {
        return '';
    }

    return trimmed;
}

export function isValidCustomDomainHostname(value: string): boolean {
    const normalized = normalizeDomainHost(value);
    return Boolean(normalized && CUSTOM_DOMAIN_PATTERN.test(normalized));
}

export function validateWebsiteSetupForm(formData: WebsiteSetupFormData): WebsiteSetupValidationResult {
    const cleanedName = formData.name.trim();
    const cleanedSubdomain = formData.subdomain.trim().toLowerCase();
    const cleanedBusinessType = formData.businessType.trim();
    const cleanedTimezone = formData.timezone.trim();
    const cleanedCustomDomain = normalizeDomainHost(formData.customDomain);
    const domainMode: DomainMode = formData.domainMode === 'customDomain' ? 'customDomain' : 'subdomain';
    const nextErrors: Partial<Record<WebsiteSetupField, string>> = {};

    if (!cleanedName) {
        nextErrors.name = 'Website name is required';
    } else if (cleanedName.length > 255) {
        nextErrors.name = 'Website name must be 255 characters or fewer';
    }

    if (domainMode === 'subdomain') {
        if (!cleanedSubdomain) {
            nextErrors.subdomain = 'Subdomain is required';
        } else if (cleanedSubdomain.length < 3) {
            nextErrors.subdomain = 'Subdomain must be at least 3 characters';
        } else if (cleanedSubdomain.length > 63) {
            nextErrors.subdomain = 'Subdomain must be 63 characters or fewer';
        } else if (!SUBDOMAIN_PATTERN.test(cleanedSubdomain)) {
            nextErrors.subdomain = 'Use lowercase letters, numbers, and hyphens only';
        }
    }

    if (!cleanedBusinessType) {
        nextErrors.businessType = 'Industry is required';
    } else if (cleanedBusinessType.length > 255) {
        nextErrors.businessType = 'Industry must be 255 characters or fewer';
    }

    if (!cleanedTimezone) {
        nextErrors.timezone = 'Timezone is required';
    } else if (!isValidIanaTimezone(cleanedTimezone)) {
        nextErrors.timezone = 'Please enter a valid IANA timezone (e.g., Asia/Colombo)';
    }

    if (domainMode === 'customDomain') {
        if (!cleanedCustomDomain) {
            nextErrors.customDomain = 'Custom domain is required';
        } else if (!isValidCustomDomainHostname(cleanedCustomDomain)) {
            nextErrors.customDomain = 'Enter a valid domain (example: example.com)';
        }
    }

    return {
        cleanedName,
        cleanedSubdomain,
        cleanedBusinessType,
        cleanedTimezone,
        cleanedCustomDomain,
        domainMode,
        nextErrors,
    };
}

export function generateAutoSubdomain(input: {
    name: string;
    customDomain?: string | null;
    seed?: string;
}): string {
    const normalizedDomain = normalizeDomainHost(input.customDomain || '');
    const domainLabel = normalizedDomain ? normalizedDomain.split('.')[0] || '' : '';
    const fromDomain = normalizeSubdomainCandidate(domainLabel);
    const fromName = normalizeSubdomainCandidate(input.name);
    const base = [fromDomain, fromName, 'site'].find((value) => value.length >= 3) || 'site';

    const providedSeed = input.seed?.trim() || '';
    const rawSeed = providedSeed || Date.now().toString(36).slice(-6);
    const seed = normalizeSubdomainCandidate(rawSeed) || Date.now().toString(36).slice(-4);
    const maxBaseLength = Math.max(3, 63 - seed.length - 1);
    const baseTrimmed = base.slice(0, maxBaseLength).replace(EDGE_HYPHEN_PATTERN, '') || 'site';
    const candidate = `${baseTrimmed}-${seed}`.slice(0, 63).replace(/-+$/g, '');

    if (candidate.length >= 3 && SUBDOMAIN_PATTERN.test(candidate)) {
        return candidate;
    }

    const fallback = `site-${Date.now().toString(36).slice(-4)}`;
    return fallback.length >= 3 && SUBDOMAIN_PATTERN.test(fallback) ? fallback : 'site001';
}

export function mapWebsiteSetupServerField(rawField: string): WebsiteSetupField | null {
    const normalized = rawField.trim().toLowerCase();
    if (!normalized) {
        return null;
    }

    if (normalized.endsWith('customdomain') || normalized.endsWith('custom_domain')) {
        return 'customDomain';
    }
    if (normalized.endsWith('subdomain')) {
        return 'subdomain';
    }
    if (normalized.endsWith('businesstype') || normalized.endsWith('business_type')) {
        return 'businessType';
    }
    if (normalized.endsWith('timezone')) {
        return 'timezone';
    }
    if (normalized.endsWith('name')) {
        return 'name';
    }
    if (normalized.endsWith('domainmode') || normalized.endsWith('domain_mode')) {
        return 'domainMode';
    }

    return null;
}

export function loadOnboardingWebsiteSetupDraft(): WebsiteSetupFormData | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<WebsiteSetupFormData>;
        return {
            ...getDefaultWebsiteSetupFormData(),
            name: typeof parsed.name === 'string' ? parsed.name : '',
            subdomain: typeof parsed.subdomain === 'string' ? parsed.subdomain : '',
            businessType: typeof parsed.businessType === 'string' ? parsed.businessType : '',
            timezone: typeof parsed.timezone === 'string' ? parsed.timezone : getDefaultTimezone(),
            customDomain: typeof parsed.customDomain === 'string' ? parsed.customDomain : '',
            domainMode: parsed.domainMode === 'customDomain' ? 'customDomain' : 'subdomain',
        };
    } catch {
        return null;
    }
}

export function saveOnboardingWebsiteSetupDraft(formData: WebsiteSetupFormData): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(formData));
    } catch {
        // Ignore storage failures.
    }
}

export function clearOnboardingWebsiteSetupDraft(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    } catch {
        // Ignore storage failures.
    }
}

export function buildWorkspaceName(input: WorkspaceNameInput): string {
    const fullName = input.fullName?.trim();
    if (fullName) {
        return `${fullName} Workspace`.slice(0, 255);
    }

    const emailLocalPartRaw = input.email?.split('@')[0]?.trim();
    if (emailLocalPartRaw) {
        const readable = emailLocalPartRaw
            .replace(/[._-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const titleCased = (readable || emailLocalPartRaw)
            .split(' ')
            .map((word) => word ? `${word[0]!.toUpperCase()}${word.slice(1)}` : '')
            .join(' ')
            .trim();

        return `${titleCased || 'My'} Workspace`.slice(0, 255);
    }

    return 'My Workspace';
}
