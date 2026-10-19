
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for MoroSystems QA assignment.
 *
 * Test groups:
 * - tests/api: REST API integration tests
 * - tests/gui: browser-based UI tests
 *
 * GUI tests run against Chromium, Firefox and WebKit.
 * API tests run without requiring a browser.
 */

const isCI = !!process.env.CI;

export default defineConfig({

  // Root directory containing all test files.
  testDir: './tests',

  // Allow independent tests to run in parallel.
  fullyParallel: true,

  // Prevent accidentally committed test.only().
  forbidOnly: isCI,

  // Retry failed tests once on CI.
  retries: isCI ? 1 : 0,

  // Limit concurrency to avoid resource exhaustion.
  workers: isCI ? 1 : 2,

  // Default timeout for each test.
  timeout: 30_000,

  // Default timeout for Playwright expect assertions.
  expect: {
    timeout: 10_000,
  },

  // Terminal and HTML reporting.
  reporter: [
    ['list', { printSteps: true }],
    [
      'html',
      {
        open: 'never',
        outputFolder: 'playwright-report',
      },
    ],
  ],

  // Settings shared by all test projects.
  use: {

    locale: 'en-US',

    timezoneId: 'Europe/Prague',

    screenshot: 'only-on-failure',

    trace: 'retain-on-failure',

    launchOptions: {
      slowMo: 0,
    },
  },

  projects: [

    /**
     * API PROJECT
     *
     * Uses Playwright APIRequestContext.
     * No browser needs to be launched by the tests.
     */
    {
      name: 'api',

      testDir: './tests/api',

      use: {
        baseURL:
          process.env.TODO_API_URL ??
          'http://localhost:8080',
      },
    },

    /**
     * GUI - CHROMIUM
     */
    {
      name: 'chromium',

      testDir: './tests/gui',

      use: {
        ...devices['Desktop Chrome'],
      },
    },

    /**
     * GUI - FIREFOX
     */
    {
      name: 'firefox',

      testDir: './tests/gui',

      use: {
        ...devices['Desktop Firefox'],
      },
    },

    /**
     * GUI - WEBKIT
     */
    {
      name: 'webkit',

      testDir: './tests/gui',

      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
});
