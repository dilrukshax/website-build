import { z } from 'zod';

const fingerprintComponentsSchema = z.object({
    canvas: z.string().max(100_000),
    webgl: z.object({
        vendor: z.string().max(512),
        renderer: z.string().max(512),
        version: z.string().max(512).optional(),
        shadingLanguageVersion: z.string().max(512).optional(),
        extensions: z.string().max(10_000).optional(),
    }),
    audioHash: z.string().max(512),
    fonts: z.array(z.string().max(128)).max(128),
    screen: z.string().max(10_000),
    hardware: z.string().max(10_000),
    timezone: z.string().max(512),
});

const evasionFlagsSchema = z.object({
    webdriver: z.boolean(),
    noPlugins: z.boolean(),
    defaultResolution: z.boolean(),
    phantomjs: z.boolean(),
});

export const deviceCheckSchema = z.object({
    fingerprintHash: z.string().min(1).max(256),
    persistentToken: z.string().min(1).max(256).optional(),
    components: fingerprintComponentsSchema,
    evasionFlags: evasionFlagsSchema,
    referralCode: z.string().trim().max(64).optional(),
    accountId: z.string().trim().max(128).optional(),
});
