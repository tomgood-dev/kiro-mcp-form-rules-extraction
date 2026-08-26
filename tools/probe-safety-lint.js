// Static, no-browser-needed check for the banned interaction-pattern class documented in
// .kiro/steering/test-expansion-process.md ("Probe & Interaction Safety") — the rules that
// turned "the app is broken" into a retracted false positive at least twice this project
// (a page.mouse.wheel() call silently changing a focused <select>'s value; a raw
// dispatchEvent trusted without a self-verifying follow-up assertion). This makes those
// rules mechanically enforceable instead of something an agent has to remember to apply.
//
// Deliberately heuristic, line-based text scanning - not a real JS parser. Good enough to
// catch the exact patterns that have actually caused false positives here; a determined
// script could still dodge it (e.g. `page['mouse']['wheel'](...)`). That's an acceptable
// trade for zero dependencies and instant, no-browser feedback.
const fs = require('fs');

const WINDOW = 5; // lines of surrounding context considered "nearby" for a pattern pair

function findAllLineIndices(lines, pattern) {
  const hits = [];
  lines.forEach((line, i) => {
    if (pattern.test(line)) hits.push(i);
  });
  return hits;
}

function nearbyLineMatches(lines, centerIdx, pattern, windowBefore = WINDOW, windowAfter = 0) {
  const start = Math.max(0, centerIdx - windowBefore);
  const end = Math.min(lines.length - 1, centerIdx + windowAfter);
  for (let i = start; i <= end; i++) {
    if (pattern.test(lines[i])) return true;
  }
  return false;
}

/**
 * Lints probe/spec source text for banned interaction patterns.
 * @param {string} sourceText
 * @returns {{ safe: boolean, violations: Array<{ rule: string, line: number, snippet: string }> }}
 */
function lint(sourceText) {
  const lines = sourceText.split('\n');
  const violations = [];

  // Rule 1: page.mouse.wheel()/move() - the confirmed root cause of a real false positive
  // (a wheel event over a focused <select> silently changed its value).
  for (const i of findAllLineIndices(lines, /\.mouse\.(wheel|move)\s*\(/)) {
    violations.push({ rule: 'banned-mouse-wheel-or-move', line: i + 1, snippet: lines[i].trim() });
  }

  // Rule 2: keyboard.press() not preceded nearby by a .click(/.focus( on a specific
  // target - same ambient-focus risk as rule 1, just via the keyboard instead of the mouse.
  // Excludes 'Escape' (a global close-whatever's-open gesture, not focus-dependent) and
  // 'Tab' (this codebase's own established blur-to-commit pattern, used pervasively and
  // already treated as safe throughout helpers/*.js) - flagging either would be noise, not
  // a real finding; confirmed against this repo's actual probes during this rule's build.
  const SAFE_KEYS = /['"](Escape|Tab)['"]/;
  for (const i of findAllLineIndices(lines, /\.keyboard\.press\s*\(/)) {
    if (SAFE_KEYS.test(lines[i])) continue;
    if (!nearbyLineMatches(lines, i, /\.click\s*\(|\.focus\s*\(/, WINDOW, 0)) {
      violations.push({ rule: 'unscoped-keyboard-press', line: i + 1, snippet: lines[i].trim() });
    }
  }

  // Rule 3: a raw DOM mutation (.value = ... ; dispatchEvent(...)) with no assertion
  // against a server-recalculated value nearby - the "self-verifying interaction rule."
  // A passive read of .disabled/.value/.selectedIndex right after doesn't count; this
  // only credits an actual assertion call (expect(...), or a console.log-based
  // OK/PROBLEM check used by this repo's older probes) in the following lines.
  for (const i of findAllLineIndices(lines, /\.value\s*=[^=]/)) {
    const dispatchNearby = nearbyLineMatches(lines, i, /dispatchEvent\s*\(/, 0, WINDOW);
    if (!dispatchNearby) continue; // not the raw-mutation pattern this rule targets
    const verified = nearbyLineMatches(lines, i, /expect\s*\(|assert\w*\s*\(/, 0, WINDOW * 2);
    if (!verified) {
      violations.push({ rule: 'unverified-raw-dispatch', line: i + 1, snippet: lines[i].trim() });
    }
  }

  return { safe: violations.length === 0, violations };
}

/** Convenience: lint a file on disk by path. */
function lintFile(filePath) {
  return lint(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { lint, lintFile };

// CLI usage: node tools/probe-safety-lint.js <file.js> [file2.js ...]
if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node tools/probe-safety-lint.js <file.js> [file2.js ...]');
    process.exit(2);
  }
  let anyUnsafe = false;
  for (const file of files) {
    const result = lintFile(file);
    if (result.safe) {
      console.log(`OK   ${file}`);
    } else {
      anyUnsafe = true;
      console.log(`FAIL ${file}`);
      for (const v of result.violations) {
        console.log(`     line ${v.line} [${v.rule}]: ${v.snippet}`);
      }
    }
  }
  process.exit(anyUnsafe ? 1 : 0);
}
