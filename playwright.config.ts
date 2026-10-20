import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the MoroSystems automation assignment.
 *
 * The API project uses Playwright's request fixture and does not launch a
 * browser. GUI projects execute the same browser tests in three engines.
 *
 * The Google E2E test needs manual CAPTCHA assistance. GitHub Actions excludes
 * its @manual-captcha tag; local developers can still run it explicitly.
 */
const isCI = Boolean(process.env.CI);

export default defineConfig({
  // Keep API and GUI tests in separate projects with their own test folders.
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,

  // Retry once on CI to help identify intermittent failures in the report.
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : 2,
  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  // Show individual steps in the console and preserve a shareable HTML report.
  reporter: [
    ['list', { printSteps: true }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  // Failure artifacts are available locally and in GitHub Actions reports.
  use: {
    locale: 'en-US',
    timezoneId: 'Europe/Prague',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // Used by the request fixture and relative URLs in TodoApiClient.
        baseURL: process.env.TODO_API_URL ?? 'http://localhost:8080',
      },
    },
    {
      name: 'chromium',
      testDir: './tests/gui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/gui',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/gui',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
