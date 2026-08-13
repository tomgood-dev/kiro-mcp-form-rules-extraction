// Minimal .env loader (no dotenv dependency) — same variables as server.js/login.spec.js use.
const fs = require('fs');
const path = require('path');
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
})();

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // OutSystems session/backend seems to dislike heavy concurrency — start serial, raise workers later if it holds up
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: require.resolve('./tests/global-setup.js'),
  use: {
    baseURL: 'https://outsystems-dev.asteronlife.co.nz',
    storageState: 'tests/.auth/state.json',
    headless: process.env.HEADLESS !== 'false', // set HEADLESS=false to watch it run
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
