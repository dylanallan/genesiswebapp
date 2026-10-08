import { defineConfig } from 'vitest/config';

// Unit tests only. Browser tests live in e2e/ (Playwright); Edge Function tests run under Deno.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
