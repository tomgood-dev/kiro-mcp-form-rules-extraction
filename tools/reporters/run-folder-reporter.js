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
const { Workbook } = require('../lib/xlsx-writer');

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

    // Collect png attachments. Prefer recordShot proof shots (named `proof: <label>`, captured at
    // a meaningful moment) — if any exist, use ONLY those and drop Playwright's auto end-of-test
    // screenshot, which can be a coincidental frame (e.g. a page that navigated away at test end).
    // If a test recorded no proof shots, fall back to the single auto screenshot so there's still proof.
    const allImgs = result.attachments
      .filter((a) => a.contentType === 'image/png' && a.path)
      .map((a) => ({
        path: a.path,
        isProof: !!(a.name && a.name.startsWith('proof: ')),
        label: a.name && a.name.startsWith('proof: ') ? a.name.slice('proof: '.length) : (a.name || 'screenshot'),
      }));
    const proofs = allImgs.filter((s) => s.isProof);
    const shots = proofs.length ? proofs : allImgs;

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
      shots,
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

      // ── Write machine-readable summary.json (source of truth for the suite dashboard) ──
      // Detect a filtered (-g/--grep) run so the dashboard can avoid treating a single-test
      // re-run as if it were the whole spec's latest state.
      const argv = process.argv.join(' ');
      const filtered = / -g\b|--grep\b/.test(argv);
      const summary = {
        specSlug: slug,
        specFile: relSpecFile,
        runTimestamp: this.runTimestamp,
        environment: process.env.BASE_URL || process.env.ASTERON_BASE_URL || 'outsystems-dev.asteronlife.co.nz',
        durationMs: result.duration || 0,
        filtered,
        total, passed, failed, skipped, other,
        tests: tests.map((t) => ({ title: t.title, status: t.status, durationMs: t.duration || 0 })),
      };
      fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));

      // ── Write the SharePoint-style Excel workbook (the tester deliverable) ──
      // Script sheet (Test|Description|Action|Expected Result|Pass/Fail|Comments) + one
      // "Test N" sheet per test containing that test's proof screenshots.
      try {
        this._buildWorkbook(runDir, slug, relSpecFile, tests);
      } catch (err) {
        console.error('[xlsx] skipped (non-fatal):', err.message, err.stack);
      }
    }

    // Clean up the transient holding area.
    try { fs.rmSync(pendingDir(this.runTimestamp), { recursive: true, force: true }); } catch (_) {}

    // ── Auto-update the suite-level dashboard (best-effort; never fail the run over it) ──
    try {
      const appRoots = new Set();
      for (const specFile of this.bySpecFile.keys()) {
        const parts = path.resolve(specFile).split(path.sep);
        const idx = parts.lastIndexOf('apps');
        if (idx !== -1 && parts[idx + 1]) appRoots.add(parts.slice(0, idx + 2).join(path.sep));
      }
      const { buildDashboard } = require('../build-dashboard');
      for (const appRoot of appRoots) buildDashboard(appRoot);
    } catch (err) {
      console.error('[dashboard] skipped (non-fatal):', err.message);
    }
  }

  /**
   * Builds the SharePoint-style .xlsx deliverable for one spec's run.
   *
   *   Script sheet: Test | Description | Action | Expected Result | Pass/Fail | Comments
   *     - One row per SUB-test (1, 1a, 1b, ...). A sub-test = one recordCheck value-check
   *       (or the whole test if it recorded none).
   *     - The Description cell (col B) is MERGED vertically across all of a test's sub-test
   *       rows, matching the client template (value only in the block's top row).
   *     - Pass/Fail cell is colour-filled (green/red/blue). Comments cell is yellow fill +
   *       red text (the template's bug-note style) when it carries a note.
   *   Test sheets: one sheet per SUB-test (Test 1, Test 1a, ...), containing ONLY that
   *     sub-test's proof screenshots — no title/result/AC/steps text.
   */
  _buildWorkbook(runDir, slug, relSpecFile, tests) {
    const wb = new Workbook();
    const S = Workbook.STYLE;
    const storyTitle = slug.replace(/-/g, ' ').replace(/\bv\d+$/, '').trim();
    const statusFill = (status) => (status === 'passed' ? S.PASS : status === 'failed' ? S.FAIL : S.SKIP);
    const passFailText = (status) => (status === 'passed' ? 'Pass' : status === 'failed' ? 'Fail' : status === 'skipped' ? 'Blocked' : status);
    const subLetter = (i) => (i === 0 ? '' : String.fromCharCode(96 + i)); // 0->'', 1->'a', 2->'b'

    // Pull the "Steps to reproduce" block out of an AC annotation so specs that only used
    // recordCheck (not recordStep) still get a detailed Action column derived from the story steps.
    const extractSteps = (ac) => {
      if (!ac) return '';
      const m = String(ac).match(/Steps to reproduce:\s*([\s\S]*?)(?:\n\s*\n|Expected:|$)/i);
      return m ? m[1].trim() : '';
    };
    // Render an Expected cell as a readable sentence when the test only supplied a bare value.
    const renderExpected = (label, expected) => {
      const e = String(expected);
      if (e.length > 24 || /\n/.test(e)) return e; // already detailed prose — use as-is
      // e.g. label "Bundling discount (2 covers)" + expected "15%" -> "Bundling discount (2 covers) = 15%"
      if (label && !/^(true|false)$/i.test(e)) return `${label} = ${e}`;
      if (/^true$/i.test(e)) return `${label} — yes/present`;
      if (/^false$/i.test(e)) return `${label} — no/absent`;
      return e;
    };

    // Pre-compute each test's sub-tests so we know how many rows/sheets it spans.
    const model = tests.map((t, ti) => {
      const testNum = ti + 1;
      const checks = t.valueChecks || [];
      const shots = (t.shots || []).filter((s) => s.path && fs.existsSync(s.path));
      const steps = extractSteps(t.acceptanceCriteria);
      const subs = checks.length
        ? checks.map((c, ci) => ({
            id: `${testNum}${subLetter(ci)}`,
            // Action: explicit detailed action (recordStep) wins; otherwise the check label, and for
            // the FIRST check append the story's Steps to reproduce so the reader sees the exact setup.
            action: c.action != null
              ? String(c.action)
              : (ci === 0 && steps ? `${c.label}\n\nSteps:\n${steps}` : c.label),
            expected: c.action != null ? String(c.expected) : renderExpected(c.label, c.expected),
            actual: String(c.actual),
            // Pass/Fail is the test's REAL Playwright status — recordCheck is always called next to
            // an expect(), so a passing test means every recorded check held. Do NOT string-compare
            // expected vs actual here: many expected values are conditions ("status < 400"), not
            // literals, so "status < 400" !== "200" would wrongly read as a failure.
            pass: t.status === 'passed',
            // Surface the raw actual as a bug-note when the test failed OR when actual differs from a
            // literal expected (so the reader always sees what was observed on a discrepancy).
            comment: t.status === 'failed' ? `Actual: ${String(c.actual)}` : '',
          }))
        : [{ id: String(testNum), action: steps ? `${t.title}\n\nSteps:\n${steps}` : t.title, expected: '', actual: '', pass: t.status === 'passed', comment: '' }];
      return { t, testNum, subs, shots };
    });

    // ── Script sheet ──
    const script = wb.addSheet('Script');
    script.setColumns([{ width: 10 }, { width: 46 }, { width: 40 }, { width: 40 }, { width: 12 }, { width: 46 }]);
    script.mergeTitle(`${storyTitle}  (${relSpecFile})`, 6, S.HEADER);
    script.addRow([''], { styleId: S.NORMAL }); // spacer row (matches template's blank row 2)
    script.addRow(['Test', 'Description', 'Action', 'Expected Result', 'Pass/Fail', 'Comments'], { styleId: S.HEADER });

    model.forEach(({ t, subs }) => {
      const description = t.acceptanceCriteria || t.title;
      // A whole-test comment (failure/skip reason) lands on the FIRST sub-row's Comments.
      const testComment = t.status === 'failed'
        ? (t.error ? String(t.error).split('\n').slice(0, 4).join(' ') : '')
        : t.status === 'skipped'
          ? (t.skipReason || 'Deferred — see spec.')
          : '';

      const firstRowNum = script.rows.length + 1; // 1-based, next row to be added
      subs.forEach((sub, si) => {
        // Pass/Fail cell: colour by the sub-test's own pass state (fail overrides), skip = whole test skipped.
        const status = t.status === 'skipped' ? 'skipped' : sub.pass ? 'passed' : 'failed';
        const comment = si === 0 ? (sub.comment || testComment) : sub.comment;
        script.addRow(
          [
            { v: sub.id, styleId: S.WRAP },
            { v: si === 0 ? description : '', styleId: S.WRAP }, // only top cell carries the merged value
            { v: sub.action, styleId: S.WRAP },
            { v: sub.expected, styleId: S.WRAP },
            { v: passFailText(status), styleId: statusFill(status) },
            { v: comment, styleId: comment ? S.COMMENT : S.WRAP },
          ],
          { styleId: S.WRAP }
        );
      });
      const lastRowNum = script.rows.length;
      // Merge the Description column (B = col 2) vertically across this test's sub rows.
      if (lastRowNum > firstRowNum) {
        script.mergeRange(firstRowNum, 2, lastRowNum, 2);
      }
    });

    // ── One screenshots-only sheet per SUB-test that HAS a screenshot ──
    // A test's proof shots (in call order) are assigned to its sub-tests in order: shot 0 -> the
    // first sub-test's sheet (Test 1), shot 1 -> Test 1a, etc. A sub-test with no shot gets NO
    // sheet (per the "if there's no screenshot, don't add the sheet" rule). Any extra shots beyond
    // the sub-test count are appended to the last created sheet so no proof is lost.
    model.forEach(({ subs, shots }) => {
      if (!shots.length) return; // whole test produced no proof -> no Test sheets at all
      let lastSheet = null;
      shots.forEach((s, shotIdx) => {
        const sub = subs[shotIdx];
        let sheet;
        if (sub) {
          sheet = wb.addSheet(`Test ${sub.id}`);
          sheet.setColumns([{ width: 160 }]);
          lastSheet = sheet;
        } else {
          sheet = lastSheet; // more shots than sub-tests: append to the last sheet
        }
        if (!sheet) return;
        // Append the image below whatever is already on this sheet.
        const img = wb.addImage(fs.readFileSync(s.path));
        const anchorRow = sheet.rows.length + 1; // 0-based-anchor == current row count (rows added below)
        sheet.addImage(img, { row: anchorRow, col: 0, widthPx: 1100 });
        const scaledH = img.width ? Math.round(img.height * (1100 / img.width)) : 700;
        const spacerRows = Math.ceil(scaledH / 20) + 2;
        for (let i = 0; i < spacerRows; i++) sheet.addRow(['']);
      });
    });

    fs.writeFileSync(path.join(runDir, `${slug}.xlsx`), wb.toBuffer());
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
