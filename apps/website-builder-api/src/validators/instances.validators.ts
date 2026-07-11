import { z } from 'zod';
import { normalizeDomainHost } from '../utils/domain';

const timezoneSchema = z.string()
    .trim()
    .min(1, 'Timezone is required')
    .max(100, 'Timezone must be 100 characters or fewer')
    .refine((value) => {
        try {
            // Throws if the timezone is invalid.
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
        } catch {
            return false;
        }
    }, 'Invalid IANA timezone');

const customDomainSchema = z.string()
    .trim()
    .min(1, 'Custom domain is required')
    .max(253, 'Custom domain must be 253 characters or fewer')
    .regex(
        /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
        'Enter a valid domain (example: example.com)',
    )
    .refine(
        (value) => value.toLowerCase() === normalizeDomainHost(value),
        'Enter a valid hostname without protocol or path',
    )
    .transform((value) => value.toLowerCase());

export const createInstanceSchema = z.object({
    name: z.string().trim().min(1, 'Website name is required').max(255, 'Website name must be 255 characters or fewer'),
    subdomain: z.string().trim().min(3, 'Subdomain must be at least 3 characters').max(63, 'Subdomain must be 63 characters or fewer')
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
    businessType: z.string().trim().max(255, 'Industry must be 255 characters or fewer').optional(),
    timezone: timezoneSchema.optional(),
});

export const updateInstanceSchema = z.object({
    name: z.string().trim().min(1, 'Website name is required').max(255, 'Website name must be 255 characters or fewer').optional(),
    businessType: z.string().trim().max(255, 'Business type must be 255 characters or fewer').optional(),
    timezone: timezoneSchema.optional(),
});

export const upsertDomainRouteSchema = z.object({
    host: customDomainSchema,
    active: z.boolean().optional().default(true),
    isPrimary: z.boolean().optional().default(true),
});
