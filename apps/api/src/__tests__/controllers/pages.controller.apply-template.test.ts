import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesController } from '../../controllers/pages.controller';

const mocks = vi.hoisted(() => ({
    pageFindFirst: vi.fn(),
    pageTemplateFindUnique: vi.fn(),
    themeFindMany: vi.fn(),
    pageSectionFindMany: vi.fn(),
    dbTransaction: vi.fn(),
    txPageSectionDeleteMany: vi.fn(),
    txPageSectionCreate: vi.fn(),
    txInstanceFindUnique: vi.fn(),
    txInstanceUpdate: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        page: {
            findFirst: mocks.pageFindFirst,
        },
        pageTemplate: {
            findUnique: mocks.pageTemplateFindUnique,
        },
        theme: {
            findMany: mocks.themeFindMany,
        },
        pageSection: {
            findMany: mocks.pageSectionFindMany,
        },
        $transaction: mocks.dbTransaction,
    },
}));

function createResponse() {
    const res: {
        status: ReturnType<typeof vi.fn>;
        json: ReturnType<typeof vi.fn>;
    } = {
        status: vi.fn(),
        json: vi.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
}

describe('PagesController.applyTemplate', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.pageFindFirst.mockResolvedValue({ id: 'page-1', instanceId: 'instance-1' });

        let createdIndex = 0;
        mocks.txPageSectionCreate.mockImplementation(async ({ data }: any) => {
            createdIndex += 1;
            return {
                id: `sec-${createdIndex}`,
                ...data,
            };
        });

        mocks.txPageSectionDeleteMany.mockResolvedValue({ count: 0 });
        mocks.txInstanceFindUnique.mockResolvedValue({
            settingsJsonb: {
                tokens: {
                    primary: '#000000',
                    secondary: '#ffffff',
                    accent: '#ef4444',
                    text: '#111111',
                    background: '#f8fafc',
                    font: 'Inter, sans-serif',
                },
            },
        });
        mocks.txInstanceUpdate.mockResolvedValue({ id: 'instance-1' });

        mocks.dbTransaction.mockImplementation(async (callback: any) => callback({
            pageSection: {
                deleteMany: mocks.txPageSectionDeleteMany,
                create: mocks.txPageSectionCreate,
            },
            instance: {
                findUnique: mocks.txInstanceFindUnique,
                update: mocks.txInstanceUpdate,
            },
        }));
    });

    it('extracts template token overrides from header section only', async () => {
        mocks.pageTemplateFindUnique.mockResolvedValue({
            id: 'tpl-1',
            isActive: true,
            sectionsJsonb: [
                {
                    themeComponentKey: 'header/v2',
                    defaultContent: { businessName: 'Header Brand' },
                    defaultStyles: {
                        themeTokens: {
                            primary: '#123456',
                            font: 'Outfit, sans-serif',
                        },
                    },
                },
                {
                    themeComponentKey: 'hero/v2',
                    defaultContent: { title: 'Hero Title' },
                    defaultStyles: {
                        themeTokens: {
                            primary: '#999999',
                        },
                    },
                },
            ],
        });

        mocks.themeFindMany.mockResolvedValue([
            {
                id: 'theme-header-v2',
                componentKey: 'header/v2',
                version: 2,
            },
            {
                id: 'theme-hero-v2',
                componentKey: 'hero/v2',
                version: 2,
            },
        ]);

        mocks.pageSectionFindMany.mockResolvedValue([]);

        const req = {
            instance: { id: 'instance-1' },
            tenant: { id: 'tenant-1' },
            params: { id: 'page-1' },
            body: { templateId: 'tpl-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await PagesController.applyTemplate(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.txInstanceUpdate).toHaveBeenCalledTimes(1);

        const updateCall = mocks.txInstanceUpdate.mock.calls[0]?.[0];
        expect(updateCall?.data?.settingsJsonb?.tokens?.primary).toBe('#123456');
        expect(updateCall?.data?.settingsJsonb?.tokens?.font).toBe('Outfit, sans-serif');
    });

    it('keeps existing header content but switches to template header version', async () => {
        mocks.pageTemplateFindUnique.mockResolvedValue({
            id: 'tpl-2',
            isActive: true,
            sectionsJsonb: [
                {
                    themeComponentKey: 'header/v2',
                    defaultContent: { businessName: 'Template Header' },
                    defaultStyles: { tone: 'template' },
                },
                {
                    themeComponentKey: 'about/v2',
                    defaultContent: { title: 'About Section' },
                    defaultStyles: {},
                },
            ],
        });

        mocks.themeFindMany.mockResolvedValue([
            {
                id: 'theme-header-v2',
                componentKey: 'header/v2',
                version: 2,
            },
            {
                id: 'theme-about-v2',
                componentKey: 'about/v2',
                version: 2,
            },
        ]);

        mocks.pageSectionFindMany.mockResolvedValue([
            {
                id: 'sec-existing-header',
                pageId: 'page-1',
                instanceId: 'instance-1',
                themeId: 'theme-header-v1',
                themeVersionUsed: 1,
                enabled: true,
                contentJsonb: { businessName: 'Existing Header Content' },
                stylesJsonb: { tone: 'existing' },
                conditionsJsonb: null,
                theme: {
                    componentKey: 'header/v1',
                },
            },
        ]);

        const req = {
            instance: { id: 'instance-1' },
            tenant: { id: 'tenant-1' },
            params: { id: 'page-1' },
            body: { templateId: 'tpl-2' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await PagesController.applyTemplate(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.txPageSectionCreate).toHaveBeenCalled();

        const firstCreatedSection = mocks.txPageSectionCreate.mock.calls[0]?.[0]?.data;
        expect(firstCreatedSection?.themeId).toBe('theme-header-v2');
        expect(firstCreatedSection?.themeVersionUsed).toBe(2);
        expect(firstCreatedSection?.contentJsonb).toEqual({ businessName: 'Existing Header Content' });
        expect(firstCreatedSection?.stylesJsonb).toEqual({ tone: 'existing' });

        const secondCreatedSection = mocks.txPageSectionCreate.mock.calls[1]?.[0]?.data;
        expect(secondCreatedSection?.themeId).toBe('theme-about-v2');
    });

    it('preserves existing header/footer content while applying a higher lane template version', async () => {
        mocks.pageTemplateFindUnique.mockResolvedValue({
            id: 'tpl-lane-8',
            isActive: true,
            sectionsJsonb: [
                {
                    themeComponentKey: 'header/v8',
                    defaultContent: { projectName: 'Template Header' },
                    defaultStyles: { shell: 'template' },
                },
                {
                    themeComponentKey: 'footer/v8',
                    defaultContent: { businessName: 'Template Footer' },
                    defaultStyles: { tone: 'template' },
                },
                {
                    themeComponentKey: 'hero/v8',
                    defaultContent: { title: 'Hero Lane 8' },
                    defaultStyles: {},
                },
            ],
        });

        mocks.themeFindMany.mockResolvedValue([
            {
                id: 'theme-header-v8',
                componentKey: 'header/v8',
                version: 8,
            },
            {
                id: 'theme-footer-v8',
                componentKey: 'footer/v8',
                version: 8,
            },
            {
                id: 'theme-hero-v8',
                componentKey: 'hero/v8',
                version: 8,
            },
        ]);

        mocks.pageSectionFindMany.mockResolvedValue([
            {
                id: 'sec-existing-header',
                pageId: 'page-1',
                instanceId: 'instance-1',
                themeId: 'theme-header-v4',
                themeVersionUsed: 4,
                enabled: true,
                contentJsonb: { projectName: 'Existing Header Content' },
                stylesJsonb: { shell: 'existing' },
                conditionsJsonb: null,
                theme: {
                    componentKey: 'header/v4',
                },
            },
            {
                id: 'sec-existing-footer',
                pageId: 'page-1',
                instanceId: 'instance-1',
                themeId: 'theme-footer-v4',
                themeVersionUsed: 4,
                enabled: true,
                contentJsonb: { businessName: 'Existing Footer Content' },
                stylesJsonb: { tone: 'existing' },
                conditionsJsonb: null,
                theme: {
                    componentKey: 'footer/v4',
                },
            },
        ]);

        const req = {
            instance: { id: 'instance-1' },
            tenant: { id: 'tenant-1' },
            params: { id: 'page-1' },
            body: { templateId: 'tpl-lane-8' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await PagesController.applyTemplate(req, res as any, next);

        expect(next).not.toHaveBeenCalled();

        const createdSections = mocks.txPageSectionCreate.mock.calls.map((call) => call?.[0]?.data);

        const headerCreated = createdSections.find((section) => section?.themeId === 'theme-header-v8');
        expect(headerCreated?.themeId).toBe('theme-header-v8');
        expect(headerCreated?.themeVersionUsed).toBe(8);
        expect(headerCreated?.contentJsonb).toEqual({ projectName: 'Existing Header Content' });
        expect(headerCreated?.stylesJsonb).toEqual({ shell: 'existing' });

        const footerCreated = createdSections.find((section) => section?.themeId === 'theme-footer-v8');
        expect(footerCreated?.themeId).toBe('theme-footer-v8');
        expect(footerCreated?.themeVersionUsed).toBe(8);
        expect(footerCreated?.contentJsonb).toEqual({ businessName: 'Existing Footer Content' });
        expect(footerCreated?.stylesJsonb).toEqual({ tone: 'existing' });

        const heroCreated = createdSections.find((section) => section?.themeId === 'theme-hero-v8');
        expect(heroCreated?.themeId).toBe('theme-hero-v8');
    });
});
