import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
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
