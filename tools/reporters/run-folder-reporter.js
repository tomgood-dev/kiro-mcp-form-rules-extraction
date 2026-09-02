// Custom Playwright reporter: produces a single report.md per spec file per run under
// the test-runs/ convention. The report is self-contained: results table at the top,
// followed by detailed failure records with screenshots embedded inline (base64).
//
// Output structure:
//   <app>/test-runs/<spec-slug>/<timestamp>/report.md
//   <app>/test-runs/<spec-slug>/<timestamp>/native/  (trace.zip etc for deep debugging)
const fs = require('fs');
const path = require('path');
const { REPO_ROOT, PENDING_ROOT, formatRunTimestamp, slugifySpecFile, getRunDir, pendingDir, embedImage } = require('../artifact-helpers');

class RunFolderReporter {
  constructor(options = {}) {
    this.runTimestamp = options.runTimestamp || formatRunTimestamp();
    this.bySpecFile = new Map();

    // Sweep stale holding-area folders from previous runs.
    if (fs.existsSync(PENDING_ROOT)) {
      for (const entry of fs.readdirSync(PENDING_ROOT)) {
        if (entry !== this.runTimestamp) {
          try { fs.rmSync(path.join(PENDING_ROOT, entry), { recursive: true, force: true }); } catch (_) {}
        }
      }
    }
  }

  onTestEnd(test, result) {
    const specFile = test.location.file;
    if (!this.bySpecFile.has(specFile)) this.bySpecFile.set(specFile, []);

    const screenshot = result.attachments.find((a) => a.contentType === 'image/png' && a.path);

    const parentTitle = test.parent && test.parent.title;
    const hasDescribeParent = parentTitle && !parentTitle.includes('.spec.js');
    const fullTitle = hasDescribeParent ? `${parentTitle} › ${test.title}` : test.title;

    // Extract acceptance-criteria annotation if present
    const acAnnotation = test.annotations ? test.annotations.find((a) => a.type === 'acceptance-criteria') : null;

    // Extract the skip/fixme reason, if any. See recordCheck's JSDoc / the AC annotation
    // convention doc for why this can't just be pulled from a test.fixme(title, fn) call —
    // that form never runs its body. The reason lives on a {type:'fixme'|'skip', description}
    // annotation instead, produced by the inline test.fixme(true, 'reason') / test.skip(true, 'reason') form.
    const skipAnnotation = test.annotations
      ? test.annotations.find((a) => (a.type === 'fixme' || a.type === 'skip') && a.description)
      : null;

    // Extract structured value-check annotations (see tools/artifact-helpers.js recordCheck) —
    // additive, optional per test; older tests simply won't have any.
    const valueChecks = (test.annotations || [])
      .filter((a) => a.type === 'value-check')
      .map((a) => {
        try { return JSON.parse(a.description); } catch (_) { return null; }
      })
      .filter(Boolean);

    // Strip ANSI color codes from error messages so they render cleanly in Markdown
    const rawError = result.error ? result.error.message : null;
    const cleanError = rawError ? rawError.replace(/\x1b\[[0-9;]*m/g, '') : null;

    this.bySpecFile.get(specFile).push({
      title: fullTitle,
      status: result.status,
      duration: result.duration,
      error: cleanError,
      screenshotPath: screenshot ? screenshot.path : null,
      acceptanceCriteria: acAnnotation ? acAnnotation.description : null,
      skipReason: skipAnnotation ? skipAnnotation.description : null,
      valueChecks,
    });
  }

  onEnd(result) {
    try {
      return this._generateReports(result);
    } catch (err) {
      console.error('RunFolderReporter onEnd error:', err.message, err.stack);
    }
  }

  _generateReports(result) {
    const totalDuration = result.duration ? `${(result.duration / 60000).toFixed(1)} min` : 'unknown';

    for (const [specFile, tests] of this.bySpecFile) {
      const runDir = getRunDir(specFile, this.runTimestamp);
      const slug = slugifySpecFile(specFile);
      const relSpecFile = path.relative(REPO_ROOT, specFile).split(path.sep).join('/');

      const passed = tests.filter((t) => t.status === 'passed').length;
      const failed = tests.filter((t) => t.status === 'failed').length;
      const skipped = tests.filter((t) => t.status === 'skipped').length;
      const total = tests.length;
      const other = total - passed - failed - skipped;

      // ── Header ──
      const lines = [
        `# ${slug.replace(/-/g, ' ').replace(/\bv\d+$/, '').trim()} — Test Run Report`,
        '',
        `**Test file:** \`${relSpecFile}\``,
        `**Run:** ${this.runTimestamp} · Edge headless · ${totalDuration}`,
        `**Environment:** ${process.env.BASE_URL || process.env.ASTERON_BASE_URL || 'outsystems-dev.asteronlife.co.nz'}`,
        `**Result:** ${passed} passed, ${failed} failed${skipped > 0 ? `, ${skipped} skipped` : ''}${other > 0 ? `, ${other} other` : ''}`,
        '',
        '---',
        '',
      ];

      // ── Results table ── kept minimal/scannable on purpose — full evidence lives in the
      // collapsible detail sections below, not forced into every row.
      lines.push('## Results', '');
      lines.push('| # | Test | Status |');
      lines.push('|---|---|---|');
      tests.forEach((t, i) => {
        const statusLabel = t.status === 'passed' ? '✅ Passed' : t.status === 'failed' ? '❌ Failed' : t.status === 'skipped' ? '⏭️ Skipped' : t.status;
        lines.push(`| ${i + 1} | ${t.title.replace(/\|/g, '\\|')} | ${statusLabel} |`);
      });
      lines.push('');

      // ── Failure details ──
      const failures = tests.filter((t) => t.status === 'failed');
      if (failures.length > 0) {
        lines.push('---', '', '## Failed Tests — Detail', '');

        failures.forEach((t, i) => {
          lines.push(`### ❌ ${t.title}`, '');

          // Acceptance criteria from annotation (verbatim from user story)
          if (t.acceptanceCriteria) {
            lines.push('**Acceptance Criteria (from user story):**', '');
            const acLines = t.acceptanceCriteria.split('\n');
            acLines.forEach((l) => lines.push(`> ${l}`));
            lines.push('');
          }

          // Structured expected/actual values, if the test recorded any (see recordCheck) —
          // a quick-scan table alongside the raw assertion error below.
          if (t.valueChecks.length > 0) {
            lines.push('**What was compared:**', '');
            lines.push(...renderValueCheckTable(t.valueChecks));
            lines.push('');
          }

          // Error message (contains the assertion label which typically includes the AC reference)
          if (t.error) {
            lines.push('**Assertion failure:**', '');
            lines.push('```');
            // Limit to first 5 lines of the error to keep it scannable
            const errorLines = t.error.split('\n').slice(0, 5);
            errorLines.forEach((l) => lines.push(l));
            lines.push('```', '');
          }

          // Inline screenshot
          if (t.screenshotPath && fs.existsSync(t.screenshotPath)) {
            lines.push(embedImage(t.screenshotPath, t.title), '');
          }

          if (i < failures.length - 1) lines.push('---', '');
        });
      }

      // ── Skipped / blocked details — the reason a test didn't run, right here instead of
      // buried in a generation log. See the AC annotation convention doc for why this needs
      // test.fixme(true, 'reason')/test.skip(true, 'reason') rather than test.fixme(title, fn).
      const skips = tests.filter((t) => t.status === 'skipped');
      if (skips.length > 0) {
        lines.push('---', '', '## Skipped / Blocked Tests — Detail', '');

        skips.forEach((t, i) => {
          lines.push(`### ⏭️ ${t.title}`, '');

          if (t.acceptanceCriteria) {
            lines.push('**Acceptance Criteria (from user story):**', '');
            t.acceptanceCriteria.split('\n').forEach((l) => lines.push(`> ${l}`));
            lines.push('');
          }

          lines.push('**Why skipped:**', '');
          lines.push(t.skipReason ? `> ${t.skipReason}` : '> No reason recorded — see the spec file / generation log.');
          lines.push('');

          if (i < skips.length - 1) lines.push('---', '');
        });
      }

      // ── What passing tests actually checked — collapsed by default so the report stays
      // scannable; only rendered for tests that recorded checks (older tests without
      // recordCheck calls are silently omitted here, not shown as empty).
      const passesWithChecks = tests.filter((t) => t.status === 'passed' && t.valueChecks.length > 0);
      if (passesWithChecks.length > 0) {
        lines.push('---', '', '## What Each Passing Test Checked', '');
        passesWithChecks.forEach((t) => {
          lines.push('<details>');
          lines.push(`<summary>✅ ${t.title}</summary>`, '');
          lines.push(...renderValueCheckTable(t.valueChecks));
          lines.push('', '</details>', '');
        });
      }

      // ── Notes ──
      lines.push('---', '', '## Notes', '');
      const bits = [`${passed}/${total} tests passing`];
      if (failed > 0) bits.push(`${failed} failure(s)`);
      if (skipped > 0) bits.push(`${skipped} skipped`);
      lines.push(`- ${bits.join(', ')}. ${failed > 0 ? 'Check the Failed Tests — Detail section above for AC details.' : ''}`.trim());
      lines.push(`- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.`);
      lines.push('');

      // ── Write report ──
      fs.writeFileSync(path.join(runDir, 'report.md'), lines.join('\n'));
    }

    // Clean up the transient holding area.
    try { fs.rmSync(pendingDir(this.runTimestamp), { recursive: true, force: true }); } catch (_) {}
  }
}

/** Renders a compact `Check | Expected | Actual` markdown table from recordCheck()'d entries. */
function renderValueCheckTable(valueChecks) {
  const lines = ['| Check | Expected | Actual |', '|---|---|---|'];
  valueChecks.forEach((c) => {
    const fmt = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${fmt(c.label)} | ${fmt(c.expected)} | ${fmt(c.actual)} |`);
  });
  return lines;
}

module.exports = RunFolderReporter;
