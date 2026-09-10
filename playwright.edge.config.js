const { defineConfig, devices } = require('@playwright/test');
const { formatRunTimestamp, pendingDir } = require('./tools/artifact-helpers');

// Load .env (project root, apps/, or the asteron app folder) so credentials/BASE_URL can live in a
// gitignored .env instead of inline command env vars. Mirrors playwright.config.js. IMPORTANT: only
// sets a var if it is NOT already set — so an inline `$env:X=...` still overrides the .env value
// (needed for per-run account overrides like AUTH_STATE_FILENAME / ASTERON_LOGIN_EMAIL in parallel runs).
const fs = require('fs');
const path = require('path');
(function loadEnv() {
  const paths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, 'apps', '.env'),
    path.join(__dirname, 'apps', 'asteron-quote-apply', '.env'),
  ];
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
})();

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
    screenshot: 'on', // capture a screenshot for EVERY test (pass or fail) — proof for the xlsx workbook, not just failures
    ignoreHTTPSErrors: true,
    channel: 'msedge',
    storageState: './apps/asteron-quote-apply/.auth/' + (process.env.AUTH_STATE_FILENAME || 'state.json'),
  },
  projects: [
    // viewport 1920x1080: the quote-screen FOOTER ACTION BAR (Close / View PDF / Save as New / Save /
    // Apply) is viewport-dependent — it does NOT render at the devices['Desktop Edge'] default of
    // 1280x720 (confirmed 2026-09-09). A large viewport is required for Save/Apply to be present.
    { name: 'edge', use: { ...devices['Desktop Edge'], viewport: { width: 1920, height: 1080 } } },
  ],
});
