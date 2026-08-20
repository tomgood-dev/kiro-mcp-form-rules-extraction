const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './apps',
  // Nested under the app, not repo root - only one app exists today; if a second app
  // is added, this (and playwright.config.js) should become per-app or parameterized.
  outputDir: './apps/asteron-quote-apply/test-results',
  timeout: 780_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['line']],
  use: {
    headless: true,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    channel: 'msedge',
  },
  projects: [
    { name: 'edge', use: { ...devices['Desktop Edge'] } },
  ],
});
