// Custom Playwright reporter implementing the test-runs/ artifact convention: one folder per
// spec file, one dated subfolder per run, containing a results.md (pass/fail table with failure
// screenshots embedded inline as base64) plus a native/ subfolder holding the original
// trace.zip/attachments for deep debugging (npx playwright show-trace). Replaces the old
// test-results/ hashed-folder-name output entirely — see playwright.config.js's outputDir.
const fs = require('fs');
const path = require('path');
const { REPO_ROOT, PENDING_ROOT, formatRunTimestamp, slugifySpecFile, getRunDir, pendingDir, embedImage } = require('../artifact-helpers');

class RunFolderReporter {
  constructor(options = {}) {
    this.runTimestamp = options.runTimestamp || formatRunTimestamp();
    this.bySpecFile = new Map(); // specFilePath -> [{ title, status, duration, error, screenshotPath, nativeDir }]

    // Sweep stale holding-area folders left by previous runs (Playwright writes a
    // .last-run.json into outputDir after onEnd() finishes, so our own onEnd cleanup below
    // can never fully empty the CURRENT run's folder - this catches everything OLDER instead).
    if (fs.existsSync(PENDING_ROOT)) {
      for (const entry of fs.readdirSync(PENDING_ROOT)) {
        if (entry !== this.runTimestamp) fs.rmSync(path.join(PENDING_ROOT, entry), { recursive: true, force: true });
      }
    }
  }

  onTestEnd(test, result) {
    const specFile = test.location.file;
    if (!this.bySpecFile.has(specFile)) this.bySpecFile.set(specFile, []);

    const screenshot = result.attachments.find((a) => a.contentType === 'image/png' && a.path);
    const firstWithPath = result.attachments.find((a) => a.path);
    const nativeDir = screenshot ? path.dirname(screenshot.path) : firstWithPath ? path.dirname(firstWithPath.path) : null;

    // test.parent is a describe() block when nested, but the file-level Suite itself
    // (title = the file path) when the test sits at the top level - only prefix in the
    // former case, or every top-level test gets an ugly file-path-prefixed title.
    const parentTitle = test.parent && test.parent.title;
    const hasDescribeParent = parentTitle && !parentTitle.includes('.spec.js');
    this.bySpecFile.get(specFile).push({
      title: hasDescribeParent ? `${parentTitle} › ${test.title}` : test.title,
      status: result.status,
      duration: result.duration,
      error: result.error ? result.error.message : null,
      screenshotPath: screenshot ? screenshot.path : null,
      nativeDir,
    });
  }

  onEnd() {
    for (const [specFile, tests] of this.bySpecFile) {
      const runDir = getRunDir(specFile, this.runTimestamp);
      const lines = [
        `# Test run — ${slugifySpecFile(specFile)}`,
        '',
        `**Run:** ${this.runTimestamp} · **Spec file:** \`${path.relative(REPO_ROOT, specFile)}\``,
        '',
        '| Test | Status | Duration | Error |',
        '|---|---|---|---|',
      ];
      for (const t of tests) {
        const statusLabel = t.status === 'passed' ? '✅ passed' : t.status === 'failed' ? '❌ failed' : t.status;
        const errorSummary = t.error ? t.error.split('\n')[0].slice(0, 150).replace(/\|/g, '\\|') : '';
        lines.push(`| ${t.title} | ${statusLabel} | ${(t.duration / 1000).toFixed(1)}s | ${errorSummary} |`);
      }

      const nativeRoot = path.join(runDir, 'native');
      const seenNativeDirs = new Set();
      for (const t of tests) {
        if (t.nativeDir && fs.existsSync(t.nativeDir) && !seenNativeDirs.has(t.nativeDir)) {
          seenNativeDirs.add(t.nativeDir);
          fs.mkdirSync(nativeRoot, { recursive: true });
          fs.cpSync(t.nativeDir, path.join(nativeRoot, path.basename(t.nativeDir)), { recursive: true });
        }
        if (t.screenshotPath && fs.existsSync(t.screenshotPath)) {
          lines.push('', `### ${t.title} — screenshot`, '', embedImage(t.screenshotPath, t.title));
        }
      }

      fs.writeFileSync(path.join(runDir, 'results.md'), lines.join('\n') + '\n');
    }

    // Clean up the transient holding area now that everything needed has been copied out.
    fs.rmSync(pendingDir(this.runTimestamp), { recursive: true, force: true });
  }
}

module.exports = RunFolderReporter;
