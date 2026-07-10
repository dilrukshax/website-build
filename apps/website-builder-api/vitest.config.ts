import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@project-aurora/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
            '@project-aurora/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
            '@project-aurora/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
            '@project-aurora/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: [],
        clearMocks: true,
        testTimeout: 10000,
        include: [
            'src/**/*.test.ts',
            'src/**/*.test.mjs',
        ],
        exclude: [
            'node_modules/**',
            'src/__tests__/archived/**',
        ],
    },
});
