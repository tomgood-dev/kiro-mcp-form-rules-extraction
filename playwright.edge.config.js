const { defineConfig, devices } = require('@playwright/test');
const { formatRunTimestamp, pendingDir } = require('./tools/artifact-helpers');

// See playwright.config.js for why this exists - shared by outputDir and the run-folder reporter.
const RUN_TIMESTAMP = formatRunTimestamp();

module.exports = defineConfig({
  testDir: './apps',
  // Transient - see playwright.config.js's outputDir comment.
  outputDir: pendingDir(RUN_TIMESTAMP),
  timeout: 780_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['line'], ['./tools/reporters/run-folder-reporter.js', { runTimestamp: RUN_TIMESTAMP }]],
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
