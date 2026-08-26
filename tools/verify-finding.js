// Independent-reverification engine - turns the ad hoc "write a second, minimal probe
// script to re-check this" discipline (applied by hand for every real finding in this
// project so far - see the recheck probes under apps/asteron-quote-apply/probes/) into a
// reusable, callable primitive. Encodes the mechanical parts of
// .kiro/steering/test-expansion-process.md's "verify before writing up" rule as code:
//
//   1. Refuse to trust a finding whose originating script used a banned interaction
//      pattern (tools/probe-safety-lint.js).
//   2. Re-read the claimed state via tools/server.js - a genuinely different code path
//      from any app-specific Playwright helper, since it drives the browser through raw
//      DOM reads/fingerprint matching rather than app-specific selectors.
//   3. Require 2+ independent agreeing reads before calling something "confirmed" -
//      either a supplied second reading (--against, e.g. an app-specific probe's own
//      JSON output) or, absent that, a second fresh-browser-session read via the same
//      generic path (weaker, but still rules out stale-session-state carryover).
//   4. Re-sample after a delay with zero interaction for claims flagged time-sensitive.
//
// What this does NOT do: decide whether a confirmed mismatch is a regression, an
// intentional change, or something to file - that judgment stays human/LLM, on purpose
// (see tools/draft-bug-report.js, which drafts but never fills that part in).
//
// CLI: node tools/verify-finding.js <claim.json> [--against <reading.json>]
//        [--url <baseUrl>] [--storage-state <path>] [--script <originating-probe.js>]
//        [--out <verdict.json>]
//
// Claim shape (see also the fingerprint shapes documented in tools/server.js's `find`):
// {
//   "id": "adv-08-2.5pct-icrc-autoselect",
//   "description": "Select IC/RC auto-selects the single Upfront-valid option at 2.5%",
//   "url": "https://.../Quote?...",              // optional if --url given instead
//   "steps": [ { "action": "click", "selector": "..." }, ... ],  // tools/server.js commands
//   "find": { "kind": "select", "fingerprint": { "firstOptionEquals": "Please Select", "optionsMatch": "^IC-\\d+%, RC-\\d+%$" } },
//   "expectedField": "selectedIndex",
//   "expectedValueNot": 0,      // OR "expectedValue": <exact value>
//   "timeSensitive": false      // set true to add a zero-interaction re-sample after a delay
// }

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { lintFile } = require('./probe-safety-lint');

const RESAMPLE_DELAY_MS = 3000; // matches the zero-interaction re-sample used by hand today
const SERVER_READY_TIMEOUT_MS = 30000;
const SERVER_READY_POLL_MS = 300;

function sendCommand(port, cmd) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Non-JSON response from server.js: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(cmd));
    req.end();
  });
}

async function waitForServerReady(port, child, getStderr) {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`tools/server.js exited early (code ${child.exitCode}) before becoming ready on port ${port}. stderr:\n${getStderr()}`);
    }
    try {
      await sendCommand(port, { action: 'url' });
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, SERVER_READY_POLL_MS));
    }
  }
  throw new Error(`tools/server.js did not become ready on port ${port} within ${SERVER_READY_TIMEOUT_MS}ms. stderr:\n${getStderr()}`);
}

/** Spawns a fresh tools/server.js instance, runs a claim's steps + find, tears it down. */
async function readClaimViaFreshSession(claim, opts) {
  const port = opts.port || 3333 + Math.floor(Math.random() * 1000); // avoid collisions across parallel reads
  const args = ['server.js', claim.url || opts.url, `--headless`];
  // Resolve relative to this process's cwd (where the CLI was invoked) before the child
  // spawns with cwd: __dirname (tools/) - otherwise a relative path resolves wrong.
  if (opts.storageState) args.push('--storage-state', path.resolve(process.cwd(), opts.storageState));

  const child = spawn(process.execPath, args, {
    cwd: __dirname,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderrBuf = '';
  child.stderr.on('data', (d) => (stderrBuf += d));

  try {
    await waitForServerReady(port, child, () => stderrBuf);

    for (const step of claim.steps || []) {
      const result = await sendCommand(port, step);
      if (result.ok === false) {
        throw new Error(`Step failed: ${JSON.stringify(step)} -> ${result.error}`);
      }
    }

    const found = await sendCommand(port, { action: 'find', kind: claim.find.kind, fingerprint: claim.find.fingerprint });
    if (!found.ok) {
      return { ok: false, error: found.error, matchCount: found.matchCount };
    }
    return { ok: true, match: found.match };
  } finally {
    child.kill();
  }
}

function evaluateExpectation(claim, match) {
  const actual = match[claim.expectedField];
  if ('expectedValue' in claim) {
    return { pass: actual === claim.expectedValue, actual, expected: claim.expectedValue, mode: 'equals' };
  }
  if ('expectedValueNot' in claim) {
    return { pass: actual !== claim.expectedValueNot, actual, expected: `not ${claim.expectedValueNot}`, mode: 'not-equals' };
  }
  throw new Error(`Claim ${claim.id} needs either expectedValue or expectedValueNot`);
}

/** Wraps verifyFindingInner so every returned verdict (including early exits) carries the
 * full original claim - lets tools/draft-bug-report.js work from just verdict.json alone. */
async function verifyFinding(claim, opts = {}) {
  const verdict = await verifyFindingInner(claim, opts);
  return { ...verdict, claim };
}

async function verifyFindingInner(claim, opts = {}) {
  const evidence = [];
  let lintResult = null;

  if (opts.script) {
    lintResult = lintFile(opts.script);
    if (!lintResult.safe) {
      return {
        claimId: claim.id,
        status: 'refuted',
        confidence: 'high',
        reasoning: `Originating script ${opts.script} uses a banned interaction pattern (${lintResult.violations
          .map((v) => v.rule)
          .join(', ')}) - refusing to trust any finding from it. See tools/probe-safety-lint.js.`,
        evidence: [{ source: 'probe-safety-lint', violations: lintResult.violations }],
      };
    }
  }

  // Reading 1: generic path, fresh session.
  const read1 = await readClaimViaFreshSession(claim, opts);
  evidence.push({ source: 'generic-path-fresh-session-1', ...read1 });
  if (!read1.ok) {
    return {
      claimId: claim.id,
      status: 'inconclusive',
      confidence: 'low',
      reasoning: `Could not locate the target element via tools/server.js's fingerprint find: ${read1.error}`,
      evidence,
    };
  }
  const eval1 = evaluateExpectation(claim, read1.match);

  // Reading 2: either a supplied independent reading, or a second fresh-session read.
  let eval2, dualPath;
  if (opts.against) {
    const against = JSON.parse(fs.readFileSync(opts.against, 'utf8'));
    evidence.push({ source: 'supplied-independent-reading', ...against });
    eval2 = evaluateExpectation(claim, against.match || against);
    dualPath = true;
  } else {
    const read2 = await readClaimViaFreshSession(claim, opts);
    evidence.push({ source: 'generic-path-fresh-session-2', ...read2 });
    if (!read2.ok) {
      return {
        claimId: claim.id,
        status: 'inconclusive',
        confidence: 'low',
        reasoning: `Second reading failed to locate the target element: ${read2.error}`,
        evidence,
      };
    }
    eval2 = evaluateExpectation(claim, read2.match);
    dualPath = false;
  }

  if (eval1.pass !== eval2.pass) {
    return {
      claimId: claim.id,
      status: 'inconclusive',
      confidence: 'low',
      reasoning: `Two independent readings disagree (reading 1: ${eval1.actual}, reading 2: ${eval2.actual}) - needs a third method or human judgment before trusting either.`,
      evidence,
    };
  }

  // Optional third, zero-interaction time-delayed re-sample for time-sensitive claims.
  if (claim.timeSensitive) {
    await new Promise((r) => setTimeout(r, RESAMPLE_DELAY_MS));
    const read3 = await readClaimViaFreshSession(claim, opts);
    evidence.push({ source: `zero-interaction-resample-after-${RESAMPLE_DELAY_MS}ms`, ...read3 });
    if (read3.ok) {
      const eval3 = evaluateExpectation(claim, read3.match);
      if (eval3.pass !== eval1.pass) {
        return {
          claimId: claim.id,
          status: 'inconclusive',
          confidence: 'low',
          reasoning: `Time-sensitive claim: a zero-interaction re-sample after ${RESAMPLE_DELAY_MS}ms disagreed with the initial reading - looks time-dependent, not a stable finding.`,
          evidence,
        };
      }
    }
  }

  const status = eval1.pass ? 'refuted' : 'confirmed'; // "refuted" = the expectation held, i.e. NOT a finding
  return {
    claimId: claim.id,
    status,
    confidence: dualPath ? 'high' : 'medium',
    reasoning: eval1.pass
      ? `Both independent readings match the expected behavior (${claim.expectedField} = ${eval1.actual}) - this is not a finding.`
      : `Both independent readings agree the app does NOT match the expected behavior (${claim.expectedField} = ${eval1.actual}, expected ${eval1.expected})${
          dualPath ? ', confirmed via a supplied independent reading' : ', confirmed via two fresh-session reads through the same generic path (dual-path/helper-based re-verification recommended for full confidence)'
        }.`,
    evidence,
  };
}

module.exports = { verifyFinding, evaluateExpectation, readClaimViaFreshSession };

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const claimPath = args.find((a) => !a.startsWith('--'));
    if (!claimPath) {
      console.error('Usage: node tools/verify-finding.js <claim.json> [--against <reading.json>] [--url <baseUrl>] [--storage-state <path>] [--script <probe.js>] [--out <verdict.json>]');
      process.exit(2);
    }
    const flag = (name) => {
      const i = args.indexOf(`--${name}`);
      return i !== -1 ? args[i + 1] : undefined;
    };

    const claim = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
    const opts = {
      url: flag('url'),
      storageState: flag('storage-state'),
      script: flag('script'),
      against: flag('against'),
    };

    const verdict = await verifyFinding(claim, opts);
    console.log(JSON.stringify(verdict, null, 2));

    const outPath = flag('out');
    if (outPath) fs.writeFileSync(outPath, JSON.stringify(verdict, null, 2));

    process.exit(verdict.status === 'inconclusive' ? 3 : 0);
  })().catch((err) => {
    console.error('FATAL:', err.message);
    process.exit(1);
  });
}
