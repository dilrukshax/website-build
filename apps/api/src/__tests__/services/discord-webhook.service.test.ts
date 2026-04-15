import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
}));

vi.mock('@booking-engine/core', () => ({
    logger: {
        info: mocks.info,
        warn: mocks.warn,
    },
}));

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        isAxiosError: vi.fn((value: unknown) => Boolean(
            value
            && typeof value === 'object'
            && 'isAxiosError' in value
            && (value as { isAxiosError?: boolean }).isAxiosError,
        )),
    },
}));

async function loadService() {
    const module = await import('../../services/discord-webhook.service');
    return module.DiscordWebhookService;
}

describe('DiscordWebhookService', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        delete process.env.DISCORD_WEBHOOK_URL;
        delete process.env.DISCORD_WEBHOOK_ENDPOINT;
        delete process.env.DISCORD_WEBHOOK;
        delete process.env.WEBHOOK_ENDPOINT;
        delete process.env.WEBHOOK_URL;
        delete process.env.DISCORD_WEBHOOK_TIMEOUT_MS;
    });

    it('normalizes discord endpoint values without protocol', async () => {
        process.env.DISCORD_WEBHOOK_URL = '"discord.com/api/webhooks/123/token"';
        vi.mocked(axios.post).mockResolvedValue({ status: 204 } as never);

        const DiscordWebhookService = await loadService();
        await DiscordWebhookService.notifyUserRegistered({
            userId: 'user-1',
            email: 'user@example.com',
            fullName: 'Webhook User',
            whatsappNumber: '+1 555 0123',
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
        });

        expect(axios.post).toHaveBeenCalledTimes(1);
        const [url] = vi.mocked(axios.post).mock.calls[0]!;
        expect(url).toBe('https://discord.com/api/webhooks/123/token');
    });

    it('supports webhook path-only values from legacy env keys', async () => {
        process.env.WEBHOOK_ENDPOINT = '/api/webhooks/abc/xyz';
        vi.mocked(axios.post).mockResolvedValue({ status: 204 } as never);

        const DiscordWebhookService = await loadService();
        await DiscordWebhookService.notifyWebsiteConfigured({
            userId: 'user-2',
            tenantId: 'tenant-1',
            instanceId: 'instance-1',
            websiteName: 'Demo',
            subdomain: 'demo',
            fullDomain: 'demo.example.com',
            businessType: 'salon',
            timezone: 'UTC',
        });

        expect(axios.post).toHaveBeenCalledTimes(1);
        const [url] = vi.mocked(axios.post).mock.calls[0]!;
        expect(url).toBe('https://discord.com/api/webhooks/abc/xyz');
    });

    it('truncates oversized embed field values to Discord limits', async () => {
        process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/token';
        vi.mocked(axios.post).mockResolvedValue({ status: 204 } as never);

        const DiscordWebhookService = await loadService();
        await DiscordWebhookService.notifyUserRegistered({
            userId: 'user-3',
            email: 'user3@example.com',
            fullName: 'User Three',
            whatsappNumber: '+1 555 0000',
            ipAddress: '127.0.0.1',
            userAgent: 'x'.repeat(3000),
        });

        const [, payload] = vi.mocked(axios.post).mock.calls[0]!;
        const firstEmbed = (payload as {
            embeds: Array<{ fields: Array<{ name: string; value: string }> }>;
        }).embeds[0];

        expect(firstEmbed).toBeDefined();
        if (!firstEmbed) {
            return;
        }

        const userAgentField = firstEmbed.fields.find((field) => field.name === 'User Agent');

        expect(userAgentField).toBeDefined();
        expect(userAgentField!.value.length).toBeLessThanOrEqual(1024);
    });

    it('skips sending when no webhook URL is configured', async () => {
        const DiscordWebhookService = await loadService();
        await DiscordWebhookService.notifyCustomDomainConfigured({
            userId: 'user-4',
            tenantId: 'tenant-2',
            instanceId: 'instance-2',
            websiteName: 'No URL',
            subdomain: 'nou',
            fullDomain: 'nou.example.com',
            customDomain: 'example.org',
            active: true,
            isPrimary: true,
        });

        expect(axios.post).not.toHaveBeenCalled();
        expect(mocks.warn).toHaveBeenCalledWith(
            'Discord webhook URL is not configured; notifications are disabled',
            expect.objectContaining({
                acceptedEnvKeys: expect.any(Array),
            }),
        );
    });
});
