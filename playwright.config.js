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
const { formatRunTimestamp, pendingDir } = require('./tools/artifact-helpers');

// Computed once per `playwright test` invocation - shared by outputDir (a transient holding
// area) and the run-folder reporter, which reorganizes that output into each app's own
// test-runs/<spec-file>/<RUN_TIMESTAMP>/ and deletes the holding area once done. See
// "Test-run artifact structure" in .kiro/steering/test-expansion-process.md.
const RUN_TIMESTAMP = formatRunTimestamp();

module.exports = defineConfig({
  testDir: './apps',
  // Transient - the run-folder reporter sorts each test's output into its own app's
  // test-runs/ (derived from the spec file's path, see tools/artifact-helpers.js
  // findAppRoot()) and deletes this. Not under any one app since testDir spans all apps.
  outputDir: pendingDir(RUN_TIMESTAMP),
  globalSetup: require.resolve('./apps/asteron-quote-apply/global-setup.js'),
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['./tools/reporters/run-folder-reporter.js', { runTimestamp: RUN_TIMESTAMP }],
    ['html', { open: 'never', outputFolder: './apps/asteron-quote-apply/playwright-report' }],
  ],
  use: {
    baseURL: 'https://outsystems-dev.asteronlife.co.nz',
    storageState: './apps/asteron-quote-apply/.auth/' + (process.env.AUTH_STATE_FILENAME || 'state.json'),
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
