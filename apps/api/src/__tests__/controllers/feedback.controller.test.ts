import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackController } from '../../controllers/feedback.controller';

const mocks = vi.hoisted(() => ({
    feedbackFindMany: vi.fn(),
    feedbackCount: vi.fn(),
    feedbackCreate: vi.fn(),
    userFindUnique: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        feedback: {
            findMany: mocks.feedbackFindMany,
            count: mocks.feedbackCount,
            create: mocks.feedbackCreate,
        },
        user: {
            findUnique: mocks.userFindUnique,
        },
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

describe('FeedbackController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a tenant-scoped rating entry with submitter metadata', async () => {
        mocks.userFindUnique.mockResolvedValue({ email: 'owner@tenant.com', fullName: 'Tenant Owner' });
        mocks.feedbackCreate.mockResolvedValue({ id: 'feedback-1' });

        const req = {
            tenant: { id: 'tenant-1' },
            auth: { userId: 'user-1' },
            user: { email: 'owner@tenant.com' },
            body: { score: 5, note: 'Very useful for daily operations' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await FeedbackController.createRating(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.feedbackCreate).toHaveBeenCalledWith({
            data: {
                tenantId: 'tenant-1',
                type: 'rating',
                score: 5,
                note: 'Very useful for daily operations',
                title: null,
                message: null,
                submittedByUserId: 'user-1',
                submittedByEmail: 'owner@tenant.com',
                submittedByName: 'Tenant Owner',
            },
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('creates a tenant-scoped suggestion entry with submitter metadata', async () => {
        mocks.userFindUnique.mockResolvedValue({ email: 'staff@tenant.com', fullName: 'Tenant Staff' });
        mocks.feedbackCreate.mockResolvedValue({ id: 'feedback-2' });

        const req = {
            tenant: { id: 'tenant-1' },
            auth: { userId: 'user-9' },
            user: { email: 'staff@tenant.com' },
            body: {
                title: 'Need easier exports',
                message: 'Please add CSV export filters by date and service.',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await FeedbackController.createSuggestion(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.feedbackCreate).toHaveBeenCalledWith({
            data: {
                tenantId: 'tenant-1',
                type: 'suggestion',
                score: null,
                note: null,
                title: 'Need easier exports',
                message: 'Please add CSV export filters by date and service.',
                submittedByUserId: 'user-9',
                submittedByEmail: 'staff@tenant.com',
                submittedByName: 'Tenant Staff',
            },
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('scopes tenant list endpoints to the current tenant only', async () => {
        mocks.feedbackFindMany.mockResolvedValue([]);
        mocks.feedbackCount.mockResolvedValue(0);

        const req = {
            tenant: { id: 'tenant-current' },
            query: { page: '1', limit: '10', tenantId: 'tenant-other' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await FeedbackController.listSuggestions(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.feedbackFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    tenantId: 'tenant-current',
                    type: 'suggestion',
                },
            }),
        );
    });

    it('supports superadmin filters for tenant and type with pagination', async () => {
        mocks.feedbackFindMany.mockResolvedValue([]);
        mocks.feedbackCount.mockResolvedValue(0);

        const req = {
            query: {
                tenantId: 'tenant-1',
                type: 'suggestion',
                page: '2',
                limit: '10',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await FeedbackController.listSuperAdmin(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.feedbackFindMany).toHaveBeenCalledWith({
            where: {
                tenantId: 'tenant-1',
                type: 'suggestion',
            },
            skip: 10,
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: {
                    select: {
                        id: true,
                        businessName: true,
                    },
                },
            },
        });
    });
});
