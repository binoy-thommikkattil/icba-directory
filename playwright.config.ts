import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
          NEXT_PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:test',
          GEMINI_API_KEY: 'test-gemini-key',
          FIREBASE_PROJECT_ID: 'test-project',
          FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@test-project.iam.gserviceaccount.com',
          FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----\\n',
        },
      },
});
