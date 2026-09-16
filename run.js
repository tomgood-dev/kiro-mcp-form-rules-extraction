#!/usr/bin/env node
/**
 * run.js — mechanical helper for the framework. The ACTUAL process (extracting business rules,
 * generating tests, deciding coverage) is AGENT-NATIVE: open this repo in Kiro and ask to get
 * started — the agent is guided by .kiro/steering/how-to-run.md (which auto-loads) and drives it.
 *
 * This script only does the few genuinely-mechanical shell steps:
 *   node run.js setup                 Install deps + Playwright browsers
 *   node run.js new <app>             Scaffold apps/<app>/ (dirs + .env)
 *   node run.js test [<app>] [args]   Run the app's Playwright suite (edge config)
 *   node run.js view [<app>]          Open the results viewer (dashboard + report.md only)
 *   node run.js help
 *
 * To START the work: open the repo in Kiro CLI and say e.g. "help me get started" — do NOT expect
 * this script to drive exploration/generation.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = __dirname;
const APPS = path.join(REPO, 'apps');
const DEFAULT_APP = process.env.TARGET_APP || 'asteron-quote-apply';

function sh(cmd, args, extraEnv) {
  const env = Object.assign({}, process.env, extraEnv || {});
  const r = spawnSync(cmd, args, { cwd: REPO, stdio: 'inherit', shell: false, env });
  return r.status === null ? 1 : r.status;
}
function nodeBin() { return process.execPath; }
function appDir(app) { return path.join(APPS, app); }
function ensureAppExists(app) {
  if (!fs.existsSync(appDir(app))) {
    console.error(`App "apps/${app}" does not exist. Scaffold it first:\n  node run.js new ${app}`);
    process.exit(2);
  }
}

// ── setup ────────────────────────────────────────────────────────────────
function cmdSetup() {
  const major = Number(process.versions.node.split('.')[0]);
  console.log(`Node ${process.versions.node} detected.`);
  if (major < 18) console.warn('!  Node 18+ recommended (22+ ideal).');
  console.log('\n[1/2] Installing npm dependencies...');
  let code = sh('npm', ['install']);
  if (code !== 0) { console.error('npm install failed.'); return code; }
  console.log('\n[2/2] Installing Playwright browsers (chromium)...');
  code = sh('npx', ['playwright', 'install', 'chromium']);
  console.log(code === 0 ? '\nSetup complete.' : '\n! Playwright browser install returned non-zero (Edge channel may still work).');
  console.log('\nNext: open this repo in Kiro and ask to get started (the agent drives the process).');
  console.log('Or scaffold a new app first: node run.js new <your-app>');
  return 0;
}

// ── new <app> ──────────────────────────────────────────────────────────────
function cmdNew(app) {
  if (!app) { console.error('Usage: node run.js new <app>'); return 2; }
  const dir = appDir(app);
  if (fs.existsSync(dir)) { console.error(`apps/${app} already exists.`); return 2; }
  // Materials live in the docs tree (there is no inbox/) — see .kiro/steering/how-to-run.md.
  const subdirs = ['tests', 'helpers', 'probes', 'docs/user-stories', 'docs/business-rules', 'docs/test-documentation', '.auth'];
  for (const d of subdirs) fs.mkdirSync(path.join(dir, d), { recursive: true });

  const examplePath = path.join(REPO, '.env.example');
  let env = fs.existsSync(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';
  env = env.replace(/^TARGET_APP=.*$/m, `TARGET_APP=${app}`);
  fs.writeFileSync(path.join(dir, '.env'), env);

  console.log(`Scaffolded apps/${app}/`);
  console.log(`  - edit apps/${app}/.env  (BASE_URL + LOGIN_EMAIL/LOGIN_PASSWORD)`);
  console.log(`  - put user stories in apps/${app}/docs/user-stories/`);
  console.log(`  - put any existing business rules in apps/${app}/docs/business-rules/`);
  console.log(`\nThen open the repo in Kiro and ask to get started — the agent will detect this app`);
  console.log(`and drive exploration or test-generation from there.`);
  return 0;
}

// ── test ─────────────────────────────────────────────────────────────────
function cmdTest(app, rest) {
  ensureAppExists(app);
  const cli = path.join(REPO, 'node_modules', '@playwright', 'test', 'cli.js');
  // NB: do NOT pass --reporter here. The edge config already declares both the 'line' reporter and
  // the custom run-folder reporter (report.md + summary.json + .xlsx + dashboard). Passing
  // --reporter on the CLI would REPLACE the config's reporter list, silently suppressing all the
  // framework's artifacts (learned 2026-09-16 — the wrapper used to override it and produced no report).
  const args = [cli, 'test', `apps/${app}/tests/`, '--config=playwright.edge.config.js', ...rest];
  console.log(`Running: node ${args.join(' ')}\n(TARGET_APP=${app}; ensure apps/${app}/.env has BASE_URL + LOGIN_EMAIL/LOGIN_PASSWORD)\n`);
  return sh(nodeBin(), args, { TARGET_APP: app, NODE_TLS_REJECT_UNAUTHORIZED: '0' });
}

// ── view ─────────────────────────────────────────────────────────────────
function cmdView(app) {
  ensureAppExists(app);
  const server = path.join(REPO, 'tools', 'docs-viewer', 'server.js');
  console.log(`Results viewer for "${app}" -> http://localhost:${process.env.DOCS_PORT || 4400}`);
  console.log('Shows ONLY the parent dashboard + each run\'s report.md. Ctrl+C to stop.\n');
  return sh(nodeBin(), [server], { VIEWER_MODE: 'results', TARGET_APP: app });
}

// ── help ─────────────────────────────────────────────────────────────────
function cmdHelp() {
  console.log([
    'Framework — mechanical helper (run.js). The PROCESS is agent-native:',
    'open this repo in Kiro and ask to get started; the agent drives it',
    '(guided by .kiro/steering/how-to-run.md).',
    '',
    'Mechanical commands this script provides:',
    '  node run.js setup                 Install deps + Playwright browsers',
    '  node run.js new <app>             Scaffold apps/<app>/ (dirs + .env)',
    '  node run.js test [<app>] [args]   Run the app\'s Playwright suite (edge config)',
    '  node run.js view [<app>]          Open the results viewer (dashboard + report.md only)',
    '  node run.js help',
    '',
    `Default app when <app> omitted: ${DEFAULT_APP} (override with TARGET_APP env).`,
    '',
    'To extract rules / generate tests / decide coverage: DO NOT use this script — open the',
    'repo in Kiro and ask. The agent detects how far along each app is and asks how to proceed.',
  ].join('\n'));
  return 0;
}

// ── dispatch ───────────────────────────────────────────────────────────────
const [, , cmd, ...args] = process.argv;
const appArg = args[0] && !args[0].startsWith('-') ? args[0] : DEFAULT_APP;
const restArgs = args[0] && !args[0].startsWith('-') ? args.slice(1) : args;

let code = 0;
switch (cmd) {
  case 'setup': code = cmdSetup(); break;
  case 'new': code = cmdNew(args[0]); break;
  case 'test': code = cmdTest(appArg, restArgs); break;
  case 'view': code = cmdView(appArg); break;
  case 'help': case '--help': case '-h': case undefined: code = cmdHelp(); break;
  case 'explore': case 'generate':
    console.error(`"${cmd}" is no longer a script command — the process is agent-native.`);
    console.error(`Open this repo in Kiro and ask to get started; the agent drives ${cmd} mode`);
    console.error(`(guided by .kiro/steering/how-to-run.md).`);
    code = 2; break;
  default: console.error(`Unknown command "${cmd}". Run: node run.js help`); code = 2;
}
process.exit(code);
