import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        clearMocks: true,
        testTimeout: 10000,
        include: [
            'lib/**/*.test.ts',
            'lib/**/__tests__/**/*.test.ts',
            'hooks/**/*.test.ts',
            'app/**/*.test.ts',
        ],
        exclude: [
            'node_modules/**',
        ],
    },
});
