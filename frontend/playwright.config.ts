/**
 * Playwright Configuration
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Comprehensive E2E test configuration for:
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Mobile responsive testing (multiple viewports)
 * - Devnet blockchain integration
 * - Wallet automation and mocking
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel for faster execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI for flaky network-dependent tests
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers in CI to prevent resource exhaustion
  workers: process.env.CI ? 4 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Global test configuration
  use: {
    // Base URL for navigation (configurable via environment variable)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot on failure for debugging
    screenshot: 'only-on-failure',

    // Video on failure for debugging
    video: 'retain-on-failure',

    // Action timeout (30 seconds to account for blockchain transactions)
    actionTimeout: 30000,

    // Navigation timeout (30 seconds for devnet interactions)
    navigationTimeout: 30000,
  },

  // Test timeout (2 minutes for blockchain-dependent tests)
  timeout: 120000,

  // Browser projects for cross-browser testing
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
    },

    // Tablet viewport for responsive testing
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
    },
  ],

  // Run dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
