#!/usr/bin/env node
/**
 * parallel-run.js — reusable N-account parallel Playwright launcher for the Asteron suite.
 *
 * WHY: hand-editing a per-run $specs array (with inline creds + stagger + KILL_STRAY_EDGE) is
 * error-prone and doesn't scale past a handful of accounts. This reads accounts from a gitignored
 * accounts.json and fans specs out across them, one stream per account at a time, with the
 * concurrency-safety settings baked in (KILL_STRAY_EDGE=false always; auto-scaled launch stagger).
 *
 * USAGE (from repo root):
 *   node tools/parallel-run.js <spec> [<spec> ...]        # run the named specs, fanned across accounts
 *   node tools/parallel-run.js --all                       # run every quote-screen spec
 *   node tools/parallel-run.js --scaling-test [--streams N]# launch the SAME lightweight spec on N accounts
 *   node tools/parallel-run.js --list                      # print discovered accounts + specs, run nothing
 *
 * OPTIONS:
 *   --streams N       cap concurrency at N accounts (default: all accounts in accounts.json)
 *   --stagger-ms M    override the per-stream launch offset (default: auto, see staggerFor())
 *   --timeout-s S     per-stream wall-clock timeout in seconds (default: 3600)
 *   --grep "expr"     pass -g "expr" through to Playwright (filter tests within each spec)
 *
 * Concurrency model: exactly one stream runs per account at any time (the platform allows one
 * session per account). With A accounts and S specs, up to A specs run at once; the rest queue and
 * start as accounts free up. Each stream = a child `node .../cli.js test <spec>` with its own
 * ASTERON_LOGIN_EMAIL/PASSWORD, AUTH_STATE_FILENAME=state-qa-<id>.json, KILL_STRAY_EDGE=false,
 * and a launch stagger so browser launches don't all fire at once.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'apps', 'asteron-quote-apply');
const ACCOUNTS_FILE = path.join(APP_DIR, 'accounts.json');
const SPEC_DIR = path.join(APP_DIR, 'tests', 'quote-screen');
const CLI = path.join('node_modules', '@playwright', 'test', 'cli.js');
const CONFIG = 'playwright.edge.config.js';
const PROBE_LOG_DIR = path.join(APP_DIR, 'probes');
const SCALING_SPEC = 'landing-online-quoting-tool-v1.spec.js'; // short (~2 min), read-only, ideal for a load test

// ---- arg parsing ----
function parseArgs(argv) {
  const opts = { specs: [], all: false, scalingTest: false, list: false, streams: null, staggerMs: null, timeoutS: 3600, grep: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') opts.all = true;
    else if (a === '--scaling-test') opts.scalingTest = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--streams') opts.streams = Number(argv[++i]);
    else if (a === '--stagger-ms') opts.staggerMs = Number(argv[++i]);
    else if (a === '--timeout-s') opts.timeoutS = Number(argv[++i]);
    else if (a === '--grep') opts.grep = argv[++i];
    else if (a.startsWith('--')) { console.error(`Unknown option: ${a}`); process.exit(2); }
    else opts.specs.push(a);
  }
  return opts;
}

// Auto-scale the launch stagger by stream count: more concurrent launches => wider spacing so the
// near-simultaneous chromium.launch()+login window stays smooth. ~2s per stream, capped sensibly.
function staggerFor(streamCount) {
  if (streamCount <= 1) return 0;
  const per = streamCount <= 4 ? 8000 : streamCount <= 8 ? 12000 : 15000;
  return per;
}

function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error(`\nMissing ${ACCOUNTS_FILE}\nCopy accounts.example.json to accounts.json and fill in real QA accounts.\n`);
    process.exit(2);
  }
  const cfg = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  if (!Array.isArray(cfg.accounts) || !cfg.accounts.length) { console.error('accounts.json has no accounts[].'); process.exit(2); }
  for (const a of cfg.accounts) {
    if (!a.id || !a.email || !a.password) { console.error(`accounts.json entry missing id/email/password: ${JSON.stringify(a)}`); process.exit(2); }
  }
  return cfg;
}

function resolveSpecs(opts) {
  if (opts.scalingTest) {
    const n = opts.streams || null; // fill after we know account count
    return { scaling: true, spec: SCALING_SPEC, n };
  }
  let names = opts.specs;
  if (opts.all) {
    names = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.spec.js') && !f.startsWith('_probe'));
  }
  // normalise to bare filenames that exist under SPEC_DIR
  const specs = names.map((s) => path.basename(s)).filter((s) => {
    const ok = fs.existsSync(path.join(SPEC_DIR, s));
    if (!ok) console.error(`WARN: spec not found, skipping: ${s}`);
    return ok;
  });
  return { scaling: false, specs };
}

function memSnapshot() {
  const totalGB = (os.totalmem() / 1e9).toFixed(1);
  const freeGB = (os.freemem() / 1e9).toFixed(1);
  const usedGB = (os.totalmem() - os.freemem()) / 1e9;
  return { totalGB, freeGB, usedGB: usedGB.toFixed(1), load: os.loadavg ? os.loadavg()[0].toFixed(2) : 'n/a' };
}

function runStream({ specName, account, staggerMs, timeoutS, grep, baseUrl }) {
  return new Promise((resolve) => {
    const logPath = path.join(PROBE_LOG_DIR, `prun-${specName.replace(/\.spec\.js$/, '')}-${account.id}.txt`);
    const out = fs.createWriteStream(logPath);
    // Use forward slashes for the spec path: Playwright's test-file filter matches against the
    // POSIX-style path relative to testDir, so backslashes (from path.join on Windows) match nothing
    // ("No tests found"). This is the one place we must NOT use path.join.
    const specArg = `apps/asteron-quote-apply/tests/quote-screen/${specName}`;
    const args = [CLI, 'test', specArg, '--workers=1', `--config=${CONFIG}`];
    if (grep) { args.push('-g', grep); }
    const env = Object.assign({}, process.env, {
      ASTERON_LOGIN_EMAIL: account.email,
      ASTERON_LOGIN_PASSWORD: account.password,
      AUTH_STATE_FILENAME: `state-qa-${account.id}.json`,
      KILL_STRAY_EDGE: 'false',              // CRITICAL: never let a stream taskkill sibling browsers
      STARTUP_STAGGER_MS: String(staggerMs),
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      BASE_URL: baseUrl || process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz',
    });
    const started = Date.now();
    const child = spawn('node', args, { cwd: REPO_ROOT, env });
    let killed = false;
    const timer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, timeoutS * 1000);
    child.stdout.on('data', (d) => out.write(d));
    child.stderr.on('data', (d) => out.write(d));
    child.on('close', (code) => {
      clearTimeout(timer);
      out.end();
      const secs = ((Date.now() - started) / 1000).toFixed(0);
      // Parse the tail for pass/fail/skip counts.
      let summary = '';
      try {
        const txt = fs.readFileSync(logPath, 'utf8').replace(/[^\x00-\x7F]/g, '?');
        const m = txt.match(/(\d+ passed[^\n]*|\d+ failed[^\n]*)/g);
        summary = m ? m[m.length - 1].trim() : (killed ? 'TIMED OUT' : `exit ${code}`);
      } catch (_) { summary = `exit ${code}`; }
      resolve({ specName, accountId: account.id, code, killed, secs, summary, logPath });
    });
  });
}

// Simple queue: each account processes its share of the spec list serially; accounts run in parallel.
async function runQueue(specs, accounts, opts, baseUrl) {
  const staggerMs = opts.staggerMs != null ? opts.staggerMs : staggerFor(accounts.length);
  // Assign each account an initial launch offset (round-robin index * stagger).
  const results = [];
  const queue = specs.slice();
  let launchIndex = 0;
  async function worker(account) {
    while (queue.length) {
      const specName = queue.shift();
      if (!specName) break;
      const thisStagger = staggerMs * (launchIndex++ % accounts.length);
      process.stdout.write(`  [start] ${specName}  -> account ${account.id}  (stagger ${thisStagger}ms)\n`);
      const r = await runStream({ specName, account, staggerMs: thisStagger, timeoutS: opts.timeoutS, grep: opts.grep, baseUrl });
      const flag = r.killed ? 'TIMEOUT' : (r.code === 0 ? 'OK' : `FAIL(${r.code})`);
      process.stdout.write(`  [done ] ${specName}  account ${account.id}  ${flag}  ${r.secs}s  | ${r.summary}\n`);
      results.push(r);
    }
  }
  const mem0 = memSnapshot();
  process.stdout.write(`\n[parallel-run] ${specs.length} spec(s) across ${accounts.length} account(s); stagger ${staggerMs}ms/stream; timeout ${opts.timeoutS}s\n`);
  process.stdout.write(`[parallel-run] host memory at start: ${mem0.usedGB}/${mem0.totalGB} GB used, ${mem0.freeGB} GB free\n\n`);
  const t0 = Date.now();
  // Sample memory mid-run.
  const memSampler = setInterval(() => { const m = memSnapshot(); process.stdout.write(`  [mem] ${m.usedGB}/${m.totalGB} GB used, ${m.freeGB} free, load ${m.load}\n`); }, 60000);
  await Promise.all(accounts.map((a) => worker(a)));
  clearInterval(memSampler);
  const totalMin = ((Date.now() - t0) / 60000).toFixed(1);
  const memEnd = memSnapshot();

  // Summary.
  process.stdout.write(`\n================ PARALLEL RUN SUMMARY ================\n`);
  for (const r of results) process.stdout.write(`  ${r.code === 0 && !r.killed ? 'OK  ' : (r.killed ? 'TIME' : 'FAIL')}  ${r.specName} (acct ${r.accountId}, ${r.secs}s) | ${r.summary}\n`);
  const failures = results.filter((r) => r.code !== 0 || r.killed);
  process.stdout.write(`\n  ${results.length} stream(s), ${failures.length} non-clean, wall time ${totalMin} min\n`);
  process.stdout.write(`  host memory at end: ${memEnd.usedGB}/${memEnd.totalGB} GB used, ${memEnd.freeGB} free\n`);
  process.stdout.write(`  per-stream logs: apps/asteron-quote-apply/probes/prun-<spec>-<acct>.txt\n`);
  process.stdout.write(`======================================================\n`);
  return failures.length === 0 ? 0 : 1;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cfg = loadAccounts();
  let accounts = cfg.accounts;
  if (opts.streams && opts.streams < accounts.length) accounts = accounts.slice(0, opts.streams);

  const resolved = resolveSpecs(opts);

  if (opts.list) {
    process.stdout.write(`Accounts (${cfg.accounts.length}): ${cfg.accounts.map((a) => a.id).join(', ')}\n`);
    const all = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.spec.js') && !f.startsWith('_probe'));
    process.stdout.write(`Specs (${all.length}):\n  ${all.join('\n  ')}\n`);
    return 0;
  }

  if (resolved.scaling) {
    // Launch the SAME lightweight spec on N accounts to load-test concurrency + measure resources.
    const n = opts.streams || accounts.length;
    const useAccounts = accounts.slice(0, n);
    process.stdout.write(`\n[scaling-test] launching '${SCALING_SPEC}' on ${useAccounts.length} account(s) at once.\n`);
    const specs = useAccounts.map(() => SCALING_SPEC); // one per account
    return await runQueue(specs, useAccounts, opts, cfg.baseUrl);
  }

  if (!resolved.specs.length) { console.error('No specs to run. Pass spec name(s), --all, or --scaling-test.'); process.exit(2); }
  return await runQueue(resolved.specs, accounts, opts, cfg.baseUrl);
}

main().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1); });
