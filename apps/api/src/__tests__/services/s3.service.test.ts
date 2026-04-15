import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());
const originalEnv = { ...process.env };

vi.mock('@aws-sdk/client-s3', () => {
    class MockCommand {
        input: unknown;

        constructor(input: unknown) {
            this.input = input;
        }
    }

    class S3Client {
        send = sendMock;
    }

    class PutObjectCommand extends MockCommand {}
    class GetObjectCommand extends MockCommand {}
    class ListObjectsV2Command extends MockCommand {}
    class DeleteObjectsCommand extends MockCommand {}

    return {
        S3Client,
        PutObjectCommand,
        GetObjectCommand,
        ListObjectsV2Command,
        DeleteObjectsCommand,
    };
});

import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from '../../services/s3.service';

function setRequiredS3Env(): void {
    process.env.R2_ENDPOINT = 'https://example-account.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_BUCKET_NAME = 'published-sites';
    process.env.PUBLISHED_SITES_BASE_URL = 'https://cdn.example.com';
}

describe('S3Service publish artifact retention', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
        setRequiredS3Env();
        delete process.env.PUBLISHED_SITES_PRUNE_OLD_VERSIONS;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('prunes older versioned manifest files after upload by default', async () => {
        sendMock.mockImplementation(async (command: unknown) => {
            if (command instanceof PutObjectCommand) {
                return {};
            }

            if (command instanceof ListObjectsV2Command) {
                return {
                    Contents: [
                        { Key: 'sites/inst-1/v1/manifest.json' },
                        { Key: 'sites/inst-1/v2/manifest.json' },
                        { Key: 'sites/inst-1/current.json' },
                    ],
                    IsTruncated: false,
                };
            }

            if (command instanceof DeleteObjectsCommand) {
                return {};
            }

            throw new Error(`Unexpected command: ${(command as { constructor?: { name?: string } })?.constructor?.name || 'unknown'}`);
        });

        const service = new S3Service();
        await service.uploadPublishedWebsite({
            instanceId: 'inst-1',
            subdomain: 'mysalon',
            version: 2,
            manifest: { pages: [] },
        });

        const deleteCall = sendMock.mock.calls.find(([command]) => command instanceof DeleteObjectsCommand);
        expect(deleteCall).toBeDefined();
        expect((deleteCall?.[0] as { input: unknown }).input).toMatchObject({
            Bucket: 'published-sites',
            Delete: {
                Objects: [{ Key: 'sites/inst-1/v1/manifest.json' }],
                Quiet: true,
            },
        });
    });

    it('skips pruning when env flag disables it', async () => {
        process.env.PUBLISHED_SITES_PRUNE_OLD_VERSIONS = 'false';

        sendMock.mockImplementation(async (command: unknown) => {
            if (command instanceof PutObjectCommand) {
                return {};
            }

            if (command instanceof ListObjectsV2Command || command instanceof DeleteObjectsCommand) {
                throw new Error('Prune should not run when disabled');
            }

            return {};
        });

        const service = new S3Service();
        await service.uploadPublishedWebsite({
            instanceId: 'inst-2',
            subdomain: 'wellness',
            version: 3,
            manifest: { pages: [] },
        });

        expect(sendMock.mock.calls.filter(([command]) => command instanceof ListObjectsV2Command)).toHaveLength(0);
        expect(sendMock.mock.calls.filter(([command]) => command instanceof DeleteObjectsCommand)).toHaveLength(0);
    });

    it('allows per-request override to keep previous versions', async () => {
        process.env.PUBLISHED_SITES_PRUNE_OLD_VERSIONS = 'true';

        sendMock.mockImplementation(async (command: unknown) => {
            if (command instanceof PutObjectCommand) {
                return {};
            }

            if (command instanceof ListObjectsV2Command || command instanceof DeleteObjectsCommand) {
                throw new Error('Prune should not run when request override is false');
            }

            return {};
        });

        const service = new S3Service();
        await service.uploadPublishedWebsite({
            instanceId: 'inst-3',
            subdomain: 'spa',
            version: 4,
            manifest: { pages: [] },
            prunePreviousVersions: false,
        });

        expect(sendMock.mock.calls.filter(([command]) => command instanceof ListObjectsV2Command)).toHaveLength(0);
        expect(sendMock.mock.calls.filter(([command]) => command instanceof DeleteObjectsCommand)).toHaveLength(0);
    });
});

describe('S3Service instance artifact cleanup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
        setRequiredS3Env();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('deletes published and media artifacts for an instance', async () => {
        sendMock.mockImplementation(async (command: unknown) => {
            if (command instanceof ListObjectsV2Command) {
                const prefix = (command as { input: { Prefix?: string } }).input.Prefix || '';
                if (prefix === 'sites/inst-1/') {
                    return {
                        Contents: [
                            { Key: 'sites/inst-1/current.json' },
                            { Key: 'sites/inst-1/v2/manifest.json' },
                        ],
                        IsTruncated: false,
                    };
                }

                if (prefix === 'uploads/tenant-1/inst-1/') {
                    return {
                        Contents: [
                            { Key: 'uploads/tenant-1/inst-1/2026/04/03/a.png' },
                        ],
                        IsTruncated: false,
                    };
                }

                return {
                    Contents: [],
                    IsTruncated: false,
                };
            }

            if (command instanceof DeleteObjectsCommand) {
                return {};
            }

            throw new Error(`Unexpected command: ${(command as { constructor?: { name?: string } })?.constructor?.name || 'unknown'}`);
        });

        const service = new S3Service();
        const result = await service.deleteInstanceArtifacts({
            tenantId: 'tenant-1',
            instanceId: 'inst-1',
            mediaObjectKeys: [
                'uploads/tenant-1/inst-1/2026/04/03/a.png',
                'legacy-media/tenant-1/inst-1/old.png',
            ],
        });

        expect(result).toEqual({
            deletedPublishedObjectCount: 2,
            deletedMediaObjectCount: 2,
            deletedTotalCount: 4,
        });

        const deleteCalls = sendMock.mock.calls
            .map(([command]) => command)
            .filter((command) => command instanceof DeleteObjectsCommand) as Array<{ input: { Delete?: { Objects?: Array<{ Key: string }> } } }>;

        const deletedKeys = deleteCalls
            .flatMap((call) => call.input.Delete?.Objects || [])
            .map((entry) => entry.Key)
            .sort();

        expect(deletedKeys).toEqual([
            'legacy-media/tenant-1/inst-1/old.png',
            'sites/inst-1/current.json',
            'sites/inst-1/v2/manifest.json',
            'uploads/tenant-1/inst-1/2026/04/03/a.png',
        ]);
    });
});
