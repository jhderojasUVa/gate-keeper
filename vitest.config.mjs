import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // to use describe, it, expect without importing
  },
  coverage: {
    provider: 'v8',
  },
});