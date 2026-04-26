import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        pool: 'forks',
        globals: true, // to use describe, it, expect without importing
    },
    coverage: {
        provider: 'v8',
        all: false,
        include: ['src/**'],
        exclude: ['public/**', 'src/index.ts', 'src/init.ts', 'src/client-terminal.ts'],
        thresholds: {
            lines: 80,
            functions: 80,
            branches: 70,
            statements: 80,
        },
    },
});