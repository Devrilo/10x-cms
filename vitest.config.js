import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/modules/**/*.test.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/e2e/**',
    ],
    globals: true,
    environment: 'node',
    pool: 'forks', // Use forks for better CommonJS support
  },
});
