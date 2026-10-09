import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    // Set PW_CHROMIUM to use a pre-installed browser (e.g. /opt/pw-browsers/chromium) instead of downloading one.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    env: { VITE_SUPABASE_URL: 'https://mock.supabase.co', VITE_SUPABASE_ANON_KEY: 'mock-anon-key' },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
}); 