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

/**
 * Captures a labeled PROOF screenshot for the current test and attaches it, so the run-folder
 * reporter can embed it (with its label as a caption) into that test's "Test N" worksheet in the
 * generated .xlsx workbook. Unlike the config's `screenshot: 'on'` (which only fires at
 * success/failure boundaries), this lets a test drop a proof shot at each meaningful ACTION —
 * matching the tester template where every Action produces screenshots of proof.
 *
 * Call it liberally in a spec, e.g. right after a state change you want evidenced:
 *   const { recordShot } = require('../../../tools/artifact-helpers');
 *   await recordShot(testInfo, page, 'Bundling discount shows 15% for 2 covers');
 *
 * Screenshots are attached with contentType image/png and a name prefixed `proof:` +
 * the label, so the reporter can distinguish ordered proof shots from Playwright's own
 * auto screenshots and keep them in call order.
 *
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {import('@playwright/test').Page} page
 * @param {string} label  business-readable caption for this proof shot
 * @param {{fullPage?: boolean}} [opts]
 */
async function recordShot(testInfo, page, label, opts = {}) {
  try {
    // Wait for the page to actually PAINT before capturing, so we never grab a blank white frame
    // (the failure mode when a screenshot fires right after a domcontentloaded/redirect). Best-effort:
    // settle the network, wait for a non-trivial body, then a short RAF/paint delay.
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page
      .waitForFunction(() => document.body && (document.body.innerText || '').trim().length > 20, { timeout: 6000 })
      .catch(() => {});
    await page.waitForTimeout(400); // let the compositor paint
    // Stamp a banner with the LIVE page URL (read from location.href) into the page before capture.
    // Playwright screenshots capture page CONTENT only — not the browser address bar — so a check
    // like "the URL is /QuoteAndApply" can't otherwise be seen in the image. The banner is injected,
    // captured, then removed, so it never affects the test. Read live => it's genuine proof, not a caption.
    const stamp = opts.stampUrl !== false;
    if (stamp) {
      await page
        .evaluate((cap) => {
          var el = document.createElement('div');
          el.id = '__proof_url_banner__';
          el.textContent = 'URL: ' + location.href + (cap ? '   •   ' + cap : '');
          el.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#1f4e79;color:#fff;' +
            'font:600 13px/1.4 Consolas,monospace;padding:6px 12px;box-shadow:0 1px 4px rgba(0,0,0,.4);' +
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          document.body.appendChild(el);
        }, label)
        .catch(() => {});
    }
    // Attach by PATH (not body): the run-folder reporter only picks up attachments that have a
    // .path (body-only attachments have no path and were being silently dropped — which collapsed
    // multiple recordShot calls down to just the one auto screenshot). Write a unique file per shot.
    const idx = (testInfo.__proofShotIdx = (testInfo.__proofShotIdx || 0) + 1);
    const safe = String(label).replace(/[^a-z0-9]+/gi, '-').slice(0, 40).replace(/^-|-$/g, '') || 'shot';
    const file = testInfo.outputPath(`proof-${String(idx).padStart(2, '0')}-${safe}.png`);
    await page.screenshot({ path: file, fullPage: !!opts.fullPage });
    if (stamp) {
      await page.evaluate(() => { var b = document.getElementById('__proof_url_banner__'); if (b) b.remove(); }).catch(() => {});
    }
    await testInfo.attach(`proof: ${label}`, { path: file, contentType: 'image/png' });
  } catch (err) {
    // Never let an evidence screenshot fail the test itself.
    console.error('[recordShot] skipped:', err && err.message);
  }
}

/**
 * Authors ONE sub-test (one row in the Script sheet + its own Test sheet with a screenshot) in a
 * single call — the reference-quality unit of a tester script. Combines what recordCheck (values
 * for pass/fail) and recordShot (proof image) do, but adds DETAILED Action and Expected Result
 * text so the workbook reads like the client's manual template rather than a terse AC dump.
 *
 * Each recordStep() call:
 *   • records a `value-check` annotation carrying { label, action, expected, actual } — the reporter
 *     uses `action` for the Action column, `expected` for Expected Result, and expected-vs-actual +
 *     the test's real status for Pass/Fail + Comments.
 *   • captures a proof screenshot routed to THIS sub-test's sheet (Test 1, Test 1a, ...), in call order.
 *
 * Author `action` and `expected` as multi-line, specific prose (exact inputs, exact expected
 * message/value) — see the client reference sheet. Example:
 *   await recordStep(testInfo, page, {
 *     label: 'Age 16 — Cancer min ANB',
 *     action: 'Create quote - Personal\nLife Cover SI $50,000 + Accl Cancer SI $9,999\nAge 16',
 *     expected: 'Only message shown: "The minimum Age Next Birthday for Cancer Cover is 17"',
 *     actual: observedMessage,
 *     shot: 'Age 16 validation message',
 *   });
 *
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {import('@playwright/test').Page} page
 * @param {{label: string, action?: string, expected: unknown, actual: unknown, shot?: string, fullPage?: boolean}} step
 */
async function recordStep(testInfo, page, step) {
  const { label, action, expected, actual, shot, fullPage } = step;
  testInfo.annotations.push({
    type: 'value-check',
    description: JSON.stringify({ label, action: action != null ? action : label, expected, actual }),
  });
  await recordShot(testInfo, page, shot || label, { fullPage });
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
  recordShot,
  recordStep,
};
