import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.spec.ts',
      ],
    },
  },
});

