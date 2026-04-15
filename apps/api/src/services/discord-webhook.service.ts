import axios from 'axios';
import { logger } from '@booking-engine/core';

const DISCORD_EMBED_FIELD_VALUE_MAX = 1024;
const DISCORD_EMBED_TITLE_MAX = 256;
const DISCORD_EMBED_DESCRIPTION_MAX = 4096;
const DISCORD_EMBED_FIELDS_MAX = 25;

interface DiscordField {
    name: string;
    value: string;
    inline?: boolean;
}

interface DiscordEmbedPayload {
    title: string;
    description?: string;
    color?: number;
    fields?: DiscordField[];
}

interface UserRegisteredEvent {
    userId: string;
    email: string;
    fullName: string;
    whatsappNumber?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

interface WebsiteConfiguredEvent {
    userId?: string | null;
    tenantId: string;
    instanceId: string;
    websiteName: string;
    subdomain: string;
    fullDomain?: string | null;
    businessType?: string | null;
    timezone?: string | null;
}

interface CustomDomainConfiguredEvent {
    userId?: string | null;
    tenantId: string;
    instanceId: string;
    websiteName?: string | null;
    subdomain?: string | null;
    fullDomain?: string | null;
    customDomain: string;
    active: boolean;
    isPrimary: boolean;
}

function trimWrappingQuotes(value: string): string {
    return value.replace(/^['"]+|['"]+$/g, '');
}

function truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }

    if (maxLength <= 3) {
        return value.slice(0, maxLength);
    }

    return `${value.slice(0, maxLength - 3)}...`;
}

function normalizeWebhookUrl(candidate: string): string {
    const sanitized = trimWrappingQuotes(candidate.trim());
    if (!sanitized) {
        return '';
    }

    let normalized = sanitized;

    if (/^(discord\.com|discordapp\.com)\/api\/webhooks\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    } else if (/^\/?api\/webhooks\//i.test(normalized)) {
        normalized = `https://discord.com/${normalized.replace(/^\/+/, '')}`;
    }

    try {
        const parsed = new URL(normalized);
        if (!/^https?:$/i.test(parsed.protocol)) {
            return '';
        }

        if (!/^\/api\/webhooks\/[^/]+\/[^/]+/i.test(parsed.pathname)) {
            return '';
        }

        return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    } catch {
        return '';
    }
}

function sanitize(value: string | null | undefined, fallback = 'N/A'): string {
    const trimmed = (value || '').trim();
    const finalValue = trimmed || fallback;
    return truncate(finalValue, DISCORD_EMBED_FIELD_VALUE_MAX);
}

function truthy(value: boolean): string {
    return value ? 'Yes' : 'No';
}

export class DiscordWebhookService {
    private static missingWebhookWarningLogged = false;
    private static webhookResolvedInfoLogged = false;

    private static getWebhookUrl(): string {
        const candidates = [
            process.env.DISCORD_WEBHOOK_URL,
            process.env.DISCORD_WEBHOOK_ENDPOINT,
            process.env.DISCORD_WEBHOOK,
            process.env.WEBHOOK_ENDPOINT,
            process.env.WEBHOOK_URL,
        ];

        const webhookUrl = candidates
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => normalizeWebhookUrl(item))
            .find((item) => item.length > 0) || '';

        if (!webhookUrl) {
            if (!this.missingWebhookWarningLogged) {
                logger.warn('Discord webhook URL is not configured; notifications are disabled', {
                    acceptedEnvKeys: [
                        'DISCORD_WEBHOOK_URL',
                        'DISCORD_WEBHOOK_ENDPOINT',
                        'DISCORD_WEBHOOK',
                        'WEBHOOK_ENDPOINT',
                        'WEBHOOK_URL',
                    ],
                });
                this.missingWebhookWarningLogged = true;
            }
            return '';
        }

        if (!this.webhookResolvedInfoLogged) {
            logger.info('Discord webhook is configured; notification events are enabled');
            this.webhookResolvedInfoLogged = true;
        }

        return webhookUrl;
    }

    private static getTimeoutMs(): number {
        const parsed = Number(process.env.DISCORD_WEBHOOK_TIMEOUT_MS || 3500);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 3500;
    }

    private static normalizeEmbedPayload(payload: DiscordEmbedPayload): DiscordEmbedPayload {
        const normalizedFields = (payload.fields || [])
            .slice(0, DISCORD_EMBED_FIELDS_MAX)
            .map((field) => ({
                name: truncate((field.name || '').trim() || 'Field', DISCORD_EMBED_TITLE_MAX),
                value: sanitize(field.value),
                inline: field.inline,
            }));

        return {
            ...payload,
            title: truncate(payload.title || 'Notification', DISCORD_EMBED_TITLE_MAX),
            description: payload.description
                ? truncate(payload.description, DISCORD_EMBED_DESCRIPTION_MAX)
                : undefined,
            fields: normalizedFields,
        };
    }

    private static async sendEmbed(payload: DiscordEmbedPayload): Promise<void> {
        const webhookUrl = this.getWebhookUrl();
        if (!webhookUrl) {
            return;
        }

        const normalizedPayload = this.normalizeEmbedPayload(payload);

        try {
            await axios.post(
                webhookUrl,
                {
                    allowed_mentions: { parse: [] },
                    embeds: [
                        {
                            ...normalizedPayload,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                },
                {
                    timeout: this.getTimeoutMs(),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        } catch (error) {
            const isAxiosError = axios.isAxiosError(error);
            const responseStatus = isAxiosError ? error.response?.status : undefined;
            const responseBody = isAxiosError && error.response?.data !== undefined
                ? truncate(
                    typeof error.response.data === 'string'
                        ? error.response.data
                        : JSON.stringify(error.response.data),
                    400,
                )
                : undefined;

            logger.warn('Discord webhook notification failed (fail-open)', {
                title: normalizedPayload.title,
                status: responseStatus,
                responseBody,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    static async notifyUserRegistered(event: UserRegisteredEvent): Promise<void> {
        await this.sendEmbed({
            title: 'New User Registered',
            color: 0x4f46e5,
            fields: [
                { name: 'User ID', value: sanitize(event.userId), inline: false },
                { name: 'Full Name', value: sanitize(event.fullName), inline: true },
                { name: 'Email', value: sanitize(event.email), inline: true },
                { name: 'WhatsApp', value: sanitize(event.whatsappNumber), inline: true },
                { name: 'IP Address', value: sanitize(event.ipAddress), inline: true },
                { name: 'User Agent', value: sanitize(event.userAgent), inline: false },
            ],
        });
    }

    static async notifyWebsiteConfigured(event: WebsiteConfiguredEvent): Promise<void> {
        await this.sendEmbed({
            title: 'Website Setup (Step 1) Submitted',
            color: 0xf59e0b,
            fields: [
                { name: 'User ID', value: sanitize(event.userId), inline: true },
                { name: 'Tenant ID', value: sanitize(event.tenantId), inline: true },
                { name: 'Instance ID', value: sanitize(event.instanceId), inline: true },
                { name: 'Website Name', value: sanitize(event.websiteName), inline: true },
                { name: 'Subdomain', value: sanitize(event.subdomain), inline: true },
                { name: 'Full Domain', value: sanitize(event.fullDomain), inline: true },
                { name: 'Industry', value: sanitize(event.businessType), inline: true },
                { name: 'Timezone', value: sanitize(event.timezone, 'UTC'), inline: true },
            ],
        });
    }

    static async notifyCustomDomainConfigured(event: CustomDomainConfiguredEvent): Promise<void> {
        await this.sendEmbed({
            title: 'Custom Domain Configured',
            color: 0x22c55e,
            fields: [
                { name: 'User ID', value: sanitize(event.userId), inline: true },
                { name: 'Tenant ID', value: sanitize(event.tenantId), inline: true },
                { name: 'Instance ID', value: sanitize(event.instanceId), inline: true },
                { name: 'Website Name', value: sanitize(event.websiteName), inline: true },
                { name: 'Subdomain', value: sanitize(event.subdomain), inline: true },
                { name: 'CNAME Target', value: sanitize(event.fullDomain), inline: true },
                { name: 'Custom Domain', value: sanitize(event.customDomain), inline: true },
                { name: 'Primary Route', value: truthy(event.isPrimary), inline: true },
                { name: 'Active Route', value: truthy(event.active), inline: true },
            ],
        });
    }
}
