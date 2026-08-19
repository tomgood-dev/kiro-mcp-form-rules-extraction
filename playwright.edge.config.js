const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './apps',
  timeout: 660_000,
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
