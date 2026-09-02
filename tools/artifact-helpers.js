// Shared, app-agnostic logic for the test-runs/ artifact convention (see
// .kiro/steering/test-expansion-process.md, "Test-run artifact structure"): one folder per
// spec file, one dated subfolder per run, holding that run's results table plus any bug
// reports — with screenshots embedded directly in the markdown as base64 data URIs rather
// than sibling .png files. Deliberately distinct from the older "evidence/" numbered-
// subfolder convention used for reverse-engineering probe write-ups, which stays as-is.
//
// Lives in tools/ (not under any one app) because it has no app-specific logic - the only
// thing that varies per app is WHERE test-runs/ lands, which findAppRoot() below derives
// from the spec file's own path rather than from this file's location.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
// Shared staging area for Playwright's native outputDir, used transiently before the
// run-folder reporter sorts artifacts into their app-specific test-runs/ home and deletes
// this. Lives at the repo root, not inside any one app, since a single `playwright test`
// invocation can span multiple apps' spec files at once (testDir: './apps').
const PENDING_ROOT = path.join(REPO_ROOT, '.test-runs-pending');

function pad(n) {
  return String(n).padStart(2, '0');
}

function computeTimestamp(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/**
 * Filesystem-safe timestamp for a run folder name, e.g. "2026-08-25T15-42-10" - stable
 * for the whole `playwright test` invocation, not just one process. Playwright spawns a
 * separate worker process per test file/retry, and each one re-evaluates
 * playwright.config.js independently - computing a fresh Date() per call would give each
 * worker a DIFFERENT timestamp, fragmenting one run's output across several mismatched
 * test-runs/_pending/<timestamp>/ folders. Caching it in an env var (inherited by forked
 * workers from the top-level CLI process that loads the config first) keeps every worker
 * on the same value for the duration of one invocation.
 */
function formatRunTimestamp(date) {
  if (date) return computeTimestamp(date); // explicit date -> always fresh, used by tests
  if (!process.env.RUN_TIMESTAMP) process.env.RUN_TIMESTAMP = computeTimestamp();
  return process.env.RUN_TIMESTAMP;
}

/** Derives a script-slug from a spec file's path, e.g. ".../lump-sum-covers.spec.js" -> "lump-sum-covers". */
function slugifySpecFile(specFilePath) {
  return path.basename(specFilePath).replace(/\.spec\.js$/, '');
}

/**
 * Finds the target app's root directory from a spec file's path, so test-runs/ lands
 * inside that app's own folder (this repo's "apps/<name>/" convention - see root
 * README's "Add Your App" section) rather than under this shared tools/ directory.
 * Falls back to the spec file's own directory for a spec tree that isn't organized under
 * apps/, so this still degrades gracefully rather than throwing.
 */
function findAppRoot(specFilePath) {
  const parts = path.resolve(specFilePath).split(path.sep);
  const appsIdx = parts.lastIndexOf('apps');
  if (appsIdx !== -1 && parts[appsIdx + 1]) {
    return parts.slice(0, appsIdx + 2).join(path.sep);
  }
  return path.dirname(specFilePath);
}

/** Returns (creating if needed) the run folder for a given spec file + run timestamp. */
function getRunDir(specFilePath, runTimestamp) {
  const dir = path.join(findAppRoot(specFilePath), 'test-runs', slugifySpecFile(specFilePath), runTimestamp);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** The transient holding folder for one run's native Playwright output (see PENDING_ROOT above). */
function pendingDir(runTimestamp) {
  return path.join(PENDING_ROOT, runTimestamp);
}

/**
 * Reads an image file and returns a markdown image tag with the data embedded as a base64
 * data URI, for embedding directly inside a bug report or results table instead of saving a
 * sibling .png file that the markdown merely links to.
 */
function embedImage(imagePath, altText = '') {
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).slice(1) || 'png';
  const base64 = buffer.toString('base64');
  return `![${altText}](data:image/${ext};base64,${base64})`;
}

/**
 * Records a labeled expected/actual comparison for the report, independent of pass/fail.
 * Call this ALONGSIDE (not instead of) a normal expect() call right next to it — this never
 * asserts anything itself, it only records what was compared so the reporter can show real
 * evidence (values, not just a pass/fail dot) for every test, including passing ones.
 *
 * Additive by design: existing specs already write `expect(actual, 'label').toBe(expected)`
 * everywhere. Wrapping/replacing expect() to capture this automatically would risk subtly
 * changing assertion behavior across every spec in the repo for a reporting feature — too much
 * blast radius for the benefit. Calling recordCheck() next to an existing expect() is zero-risk
 * and can be adopted incrementally, spec by spec.
 *
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {{label: string, expected: unknown, actual: unknown}} check
 */
function recordCheck(testInfo, { label, expected, actual }) {
  testInfo.annotations.push({
    type: 'value-check',
    description: JSON.stringify({ label, expected, actual }),
  });
}

module.exports = {
  REPO_ROOT,
  PENDING_ROOT,
  formatRunTimestamp,
  slugifySpecFile,
  findAppRoot,
  getRunDir,
  pendingDir,
  embedImage,
  recordCheck,
};
