import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    globals: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
