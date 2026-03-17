import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: [],
        clearMocks: true,
        testTimeout: 10000,
    },
});
