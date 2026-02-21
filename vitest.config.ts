import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json-summary'],
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 80,
            },
        },
    },
});
