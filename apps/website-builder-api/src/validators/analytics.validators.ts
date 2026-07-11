import { z } from 'zod';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function defaultRange(): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
}

export const analyticsSummaryQuery = z
    .object({
        startDate: z
            .string()
            .regex(datePattern, 'startDate must be YYYY-MM-DD')
            .optional(),
        endDate: z
            .string()
            .regex(datePattern, 'endDate must be YYYY-MM-DD')
            .optional(),
    })
    .optional()
    .default({})
    .transform((value) => {
        const { startDate, endDate } = defaultRange();
        return {
            startDate: value?.startDate || startDate,
            endDate: value?.endDate || endDate,
        };
    });

export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuery>;
