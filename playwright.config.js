// Load .env from project root or app-specific folder
const fs = require('fs');
const path = require('path');
(function loadEnv() {
  const paths = [path.join(__dirname, '.env'), path.join(__dirname, 'apps', '.env')];
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
})();

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './apps',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: process.env.HEADLESS !== 'false',
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
