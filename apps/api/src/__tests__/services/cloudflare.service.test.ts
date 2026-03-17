import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    chunkPurgeHosts,
    chunkPurgeFiles,
    CloudflareService,
    normalizePurgeHosts,
    normalizePurgeFiles,
} from '../../services/cloudflare.service';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('CloudflareService purge batching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.CLOUDFLARE_API_TOKEN = 'test-token';
        process.env.CLOUDFLARE_ZONE_ID = 'test-zone-id';
    });

    it('dedupes purge file list and removes empty items', () => {
        const files = normalizePurgeFiles(['https://a.com/', '   ', 'https://a.com/', 'https://b.com/page']);
        expect(files).toEqual(['https://a.com/', 'https://b.com/page']);
    });

    it('chunks files in fixed-size batches', () => {
        const chunks = chunkPurgeFiles(['a', 'b', 'c', 'd', 'e'], 2);
        expect(chunks).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('normalizes and dedupes purge hosts', () => {
        const hosts = normalizePurgeHosts([
            'WWW.Example.com:443',
            'example.com',
            'https://www.example.com/path',
            ' ',
        ]);
        expect(hosts).toEqual(['www.example.com', 'example.com']);
    });

    it('chunks hosts in fixed-size batches', () => {
        const chunks = chunkPurgeHosts(['a.com', 'b.com', 'c.com'], 2);
        expect(chunks).toEqual([['a.com', 'b.com'], ['c.com']]);
    });

    it('returns early on empty input without API calls', async () => {
        const service = new CloudflareService();
        const result = await service.purgeFiles([]);

        expect(result).toEqual({ attempted: 0, purged: 0, failed: [] });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('returns early for empty purge host input without API calls', async () => {
        const service = new CloudflareService();
        const result = await service.purgeHosts([]);

        expect(result).toEqual({ attempted: 0, purged: 0, failed: [] });
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('batches and dedupes URL purge requests', async () => {
        const uniqueUrls = Array.from({ length: 35 }, (_v, index) => `https://example.com/page-${index}`);
        const input = [...uniqueUrls, ...uniqueUrls.slice(0, 5)];

        vi.mocked(axios.post).mockResolvedValue({ data: { success: true } } as never);

        const service = new CloudflareService();
        const result = await service.purgeFiles(input);

        expect(result.attempted).toBe(35);
        expect(result.purged).toBe(35);
        expect(result.failed.length).toBe(0);
        expect(axios.post).toHaveBeenCalledTimes(2);

        const firstPayload = vi.mocked(axios.post).mock.calls[0]?.[1] as { files: string[] };
        const secondPayload = vi.mocked(axios.post).mock.calls[1]?.[1] as { files: string[] };
        expect(firstPayload.files.length).toBe(30);
        expect(secondPayload.files.length).toBe(5);
    });

    it('batches and dedupes host purge requests', async () => {
        const uniqueHosts = Array.from({ length: 35 }, (_v, index) => `sub-${index}.example.com`);
        const input = [...uniqueHosts, ...uniqueHosts.slice(0, 5)];

        vi.mocked(axios.post).mockResolvedValue({ data: { success: true } } as never);

        const service = new CloudflareService();
        const result = await service.purgeHosts(input);

        expect(result.attempted).toBe(35);
        expect(result.purged).toBe(35);
        expect(result.failed.length).toBe(0);
        expect(axios.post).toHaveBeenCalledTimes(2);

        const firstPayload = vi.mocked(axios.post).mock.calls[0]?.[1] as { hosts: string[] };
        const secondPayload = vi.mocked(axios.post).mock.calls[1]?.[1] as { hosts: string[] };
        expect(firstPayload.hosts.length).toBe(30);
        expect(secondPayload.hosts.length).toBe(5);
    });

    it('captures failed host batches when Cloudflare marks a batch unsuccessful', async () => {
        vi.mocked(axios.post)
            .mockResolvedValueOnce({ data: { success: true } } as never)
            .mockResolvedValueOnce({ data: { success: false } } as never);

        const hosts = Array.from({ length: 31 }, (_v, index) => `sub-${index}.example.com`);

        const service = new CloudflareService();
        const result = await service.purgeHosts(hosts);

        expect(result.attempted).toBe(31);
        expect(result.purged).toBe(30);
        expect(result.failed).toEqual(['sub-30.example.com']);
    });
});
