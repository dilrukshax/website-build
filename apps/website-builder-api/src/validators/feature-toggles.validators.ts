import { z } from 'zod';

export const upsertFeatureToggleSchema = z.object({
    toggleKey: z.string().min(1).max(100),
    isEnabled: z.boolean(),
});

export const bulkUpdateFeatureTogglesSchema = z.object({
    toggles: z.array(z.object({
        toggleKey: z.string().min(1).max(100),
        isEnabled: z.boolean(),
    })).min(1),
});
