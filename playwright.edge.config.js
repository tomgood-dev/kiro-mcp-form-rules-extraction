const { defineConfig, devices } = require('@playwright/test');
const { formatRunTimestamp, pendingDir } = require('./tools/artifact-helpers');

// See playwright.config.js for why this exists - shared by outputDir and the run-folder reporter.
const RUN_TIMESTAMP = formatRunTimestamp();

module.exports = defineConfig({
  testDir: './apps',
  globalSetup: require.resolve('./apps/asteron-quote-apply/global-setup.js'),
  // Transient - see playwright.config.js's outputDir comment.
  outputDir: pendingDir(RUN_TIMESTAMP),
  timeout: 780_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['line'], ['./tools/reporters/run-folder-reporter.js', { runTimestamp: RUN_TIMESTAMP }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz',
    headless: true,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    channel: 'msedge',
    storageState: './apps/asteron-quote-apply/.auth/' + (process.env.AUTH_STATE_FILENAME || 'state.json'),
  },
  projects: [
    { name: 'edge', use: { ...devices['Desktop Edge'] } },
  ],
});
