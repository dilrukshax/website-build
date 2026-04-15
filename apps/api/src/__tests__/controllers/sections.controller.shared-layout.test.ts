import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionsController } from '../../controllers/sections.controller';

const mocks = vi.hoisted(() => ({
    pageFindFirst: vi.fn(),
    themeFindUnique: vi.fn(),
    pageSectionFindMany: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        page: {
            findFirst: mocks.pageFindFirst,
        },
        theme: {
            findUnique: mocks.themeFindUnique,
        },
        pageSection: {
            findMany: mocks.pageSectionFindMany,
        },
    },
}));

describe('SectionsController shared layout guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects creating header/v2 when another header version already exists on the same page', async () => {
        mocks.pageFindFirst.mockResolvedValue({ id: 'page-1', instanceId: 'instance-1' });
        mocks.themeFindUnique.mockResolvedValue({
            id: 'theme-header-v2',
            name: 'Header V2',
            componentKey: 'header/v2',
            version: 2,
            isActive: true,
        });
        mocks.pageSectionFindMany.mockResolvedValue([
            {
                id: 'existing-header',
                theme: {
                    componentKey: 'header/v1',
                },
            },
        ]);

        const req = {
            instance: { id: 'instance-1' },
            tenant: { id: 'tenant-1' },
            params: { pageId: 'page-1' },
            body: { themeId: 'theme-header-v2' },
        } as any;
        const res = {
            status: vi.fn(),
            json: vi.fn(),
        } as any;
        const next = vi.fn();

        await SectionsController.create(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0]?.[0] as Error;
        expect(error?.message).toContain('already exists on this page');
    });

    it('rejects creating footer/v9 when another footer version already exists on the same page', async () => {
        mocks.pageFindFirst.mockResolvedValue({ id: 'page-1', instanceId: 'instance-1' });
        mocks.themeFindUnique.mockResolvedValue({
            id: 'theme-footer-v9',
            name: 'Footer V9',
            componentKey: 'footer/v9',
            version: 9,
            isActive: true,
        });
        mocks.pageSectionFindMany.mockResolvedValue([
            {
                id: 'existing-footer',
                theme: {
                    componentKey: 'footer/v4',
                },
            },
        ]);

        const req = {
            instance: { id: 'instance-1' },
            tenant: { id: 'tenant-1' },
            params: { pageId: 'page-1' },
            body: { themeId: 'theme-footer-v9' },
        } as any;
        const res = {
            status: vi.fn(),
            json: vi.fn(),
        } as any;
        const next = vi.fn();

        await SectionsController.create(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0]?.[0] as Error;
        expect(error?.message).toContain('already exists on this page');
    });
});
