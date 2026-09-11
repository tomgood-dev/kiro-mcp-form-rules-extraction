// Load .env from project root, apps/, or the target app folder
const fs = require('fs');
const path = require('path');

// The target app is resolvable via TARGET_APP so this framework works with ANY app under apps/.
// Defaults to the bundled worked example for back-compat.
const TARGET_APP = process.env.TARGET_APP || 'asteron-quote-apply';
const APP_DIR = path.join(__dirname, 'apps', TARGET_APP);

(function loadEnv() {
  const paths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, 'apps', '.env'),
    path.join(APP_DIR, '.env'),
  ];
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
  globalSetup: require.resolve(path.join(APP_DIR, 'global-setup.js')),
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['./tools/reporters/run-folder-reporter.js', { runTimestamp: RUN_TIMESTAMP }],
    ['html', { open: 'never', outputFolder: path.join(APP_DIR, 'playwright-report') }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    storageState: path.join(APP_DIR, '.auth', process.env.AUTH_STATE_FILENAME || 'state.json'),
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
