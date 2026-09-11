#!/usr/bin/env node
/**
 * run.js — the framework wrapper. One entry point so anyone who clones this repo can:
 *   - set up dependencies,
 *   - scaffold a new target app,
 *   - drop in their materials (user stories / existing business rules / reference files),
 *   - start a Kiro CLI session in the right mode (explore live, or generate from BRs/stories),
 *   - run the generated tests,
 *   - view the results (dashboard + per-run reports only).
 *
 * This wrapper is deliberately THIN. The real process lives in .kiro/steering/*.md and tools/.
 * The wrapper just onboards, routes into a seeded Kiro CLI prompt, and opens the results viewer.
 *
 * Usage:
 *   node run.js setup                 Install deps + Playwright browsers
 *   node run.js new <app>             Scaffold apps/<app>/ (dirs, .env, inbox/)
 *   node run.js explore [<app>]       Print the prompt to start LIVE reverse-engineering
 *   node run.js generate [<app>]      Print the prompt to GENERATE tests from BRs/user stories
 *   node run.js test [<app>] [args]   Run the app's Playwright suite (edge config)
 *   node run.js view [<app>]          Open the results viewer (dashboard + report.md only)
 *   node run.js help
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

function nodeBin() {
  return process.execPath; // the node that launched this wrapper
}

function appDir(app) {
  return path.join(APPS, app);
}

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
  if (major < 18) console.warn('⚠  Node 18+ recommended (22+ ideal).');
  console.log('\n[1/2] Installing npm dependencies...');
  let code = sh('npm', ['install']);
  if (code !== 0) { console.error('npm install failed.'); return code; }
  console.log('\n[2/2] Installing Playwright browsers (chromium)...');
  code = sh('npx', ['playwright', 'install', 'chromium']);
  console.log(code === 0 ? '\n✅ Setup complete.' : '\n⚠ Playwright browser install returned non-zero (Edge channel may still work).');
  console.log('\nNext: node run.js new <your-app>   (or use the bundled example: ' + DEFAULT_APP + ')');
  return 0;
}

// ── new <app> ──────────────────────────────────────────────────────────────
function cmdNew(app) {
  if (!app) { console.error('Usage: node run.js new <app>'); return 2; }
  const dir = appDir(app);
  if (fs.existsSync(dir)) { console.error(`apps/${app} already exists.`); return 2; }
  const subdirs = ['tests', 'helpers', 'probes', 'docs/user-stories', 'docs/business-rules', 'docs/test-documentation', 'inbox', '.auth'];
  for (const d of subdirs) fs.mkdirSync(path.join(dir, d), { recursive: true });

  // .env from the example, pre-filled with the app name.
  const examplePath = path.join(REPO, '.env.example');
  let env = fs.existsSync(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';
  env = env.replace(/^TARGET_APP=.*$/m, `TARGET_APP=${app}`);
  fs.writeFileSync(path.join(dir, '.env'), env);

  // inbox README so the user knows where to drop materials.
  fs.writeFileSync(path.join(dir, 'inbox', 'README.md'), [
    `# inbox/ — drop your materials here`, '',
    `Put anything relevant for **${app}** in this folder, then run:`, '',
    '```', `node run.js explore ${app}     # live reverse-engineering (no docs yet)`,
    `node run.js generate ${app}    # generate regression tests from what you drop here`, '```', '',
    'Useful things to drop:',
    '- **User stories** (.md/.docx/.pdf) — acceptance criteria to test against',
    '- **Existing business rules** — if you already have them documented',
    '- **Reference material** — client test suites, requirement docs, screenshots',
    '', 'The AI reads everything here to seed the process. Nothing here is committed by default',
    '(add app-specific ignores if these contain secrets).',
  ].join('\n'));

  console.log(`✅ Scaffolded apps/${app}/`);
  console.log(`   - edit apps/${app}/.env  (BASE_URL + LOGIN_EMAIL/LOGIN_PASSWORD)`);
  console.log(`   - drop materials into apps/${app}/inbox/`);
  console.log(`\nThen: node run.js explore ${app}   OR   node run.js generate ${app}`);
  return 0;
}

// ── explore / generate (seed a Kiro CLI prompt) ─────────────────────────────
function inboxList(app) {
  const inbox = path.join(appDir(app), 'inbox');
  if (!fs.existsSync(inbox)) return [];
  return fs.readdirSync(inbox).filter((f) => f.toLowerCase() !== 'readme.md');
}

function printPrompt(app, mode) {
  ensureAppExists(app);
  const files = inboxList(app);
  const banner = (t) => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));
  banner(`Kiro CLI starting prompt — ${mode.toUpperCase()} mode — app "${app}"`);
  console.log('\nStart Kiro CLI in this repo, then paste the prompt below:\n');
  if (mode === 'explore') {
    console.log([
      `You are running the AI-driven business-rules extraction framework (see .kiro/steering/).`,
      `TARGET_APP=${app}. I want to REVERSE-ENGINEER business rules from the LIVE app by black-box`,
      `exploration, then generate verified Playwright tests.`,
      ``,
      `1. Read .kiro/steering/test-expansion-process.md and project-context.md first.`,
      `2. Read everything in apps/${app}/inbox/ (${files.length} file(s): ${files.join(', ') || 'none yet'}).`,
      `3. Start the exploration server (tools/server.js) against BASE_URL from apps/${app}/.env,`,
      `   probe fields/validation/dependencies one at a time, and document each rule under`,
      `   apps/${app}/docs/business-rules/ with provenance [Exploration].`,
      `4. Turn confirmed rules into Playwright specs + test-documentation, run them (edge config),`,
      `   and commit atomically per the steering process.`,
    ].join('\n'));
  } else {
    console.log([
      `You are running the AI-driven regression-test generation framework (see .kiro/steering/).`,
      `TARGET_APP=${app}. I ALREADY HAVE materials (business rules and/or user stories). Generate`,
      `verified Playwright regression tests from them in ACCEPTANCE-CRITERIA mode.`,
      ``,
      `1. Read TEST-GENERATION-PROCESS.md + .kiro/steering/test-expansion-process.md first.`,
      `2. Read everything in apps/${app}/inbox/ (${files.length} file(s): ${files.join(', ') || 'none yet'}).`,
      `   Move user stories into apps/${app}/docs/user-stories/ and any existing BRs into`,
      `   apps/${app}/docs/business-rules/.`,
      `3. For each user story: extract ACs, PROBE the live app before asserting, then encode each AC`,
      `   (confirmed-matching -> passing; confirmed-NOT-matching -> expected-fail vs the spec value`,
      `   + a Discrepancy Evidence Record; unreachable -> test.fixme with probe evidence).`,
      `4. Run each spec (edge config), write the test-documentation matrix, commit atomically.`,
    ].join('\n'));
  }
  console.log('\n' + '-'.repeat(70));
  console.log(`When tests have run:  node run.js view ${app}   (dashboard + reports)`);
  if (!files.length) console.log(`\nTip: drop your materials into apps/${app}/inbox/ first.`);
  return 0;
}

// ── test ─────────────────────────────────────────────────────────────────
function cmdTest(app, rest) {
  ensureAppExists(app);
  const cli = path.join(REPO, 'node_modules', '@playwright', 'test', 'cli.js');
  const specDir = `apps/${app}/tests/`;
  const args = [cli, 'test', specDir, '--config=playwright.edge.config.js', '--reporter=line', ...rest];
  console.log(`Running: node ${args.join(' ')}\n(TARGET_APP=${app}; ensure apps/${app}/.env has BASE_URL + LOGIN_EMAIL/LOGIN_PASSWORD)\n`);
  return sh(nodeBin(), args, { TARGET_APP: app, NODE_TLS_REJECT_UNAUTHORIZED: '0' });
}

// ── view ─────────────────────────────────────────────────────────────────
function cmdView(app) {
  ensureAppExists(app);
  const server = path.join(REPO, 'tools', 'docs-viewer', 'server.js');
  console.log(`Results viewer for "${app}" → http://localhost:${process.env.DOCS_PORT || 4400}`);
  console.log('Shows ONLY the parent dashboard + each run\'s report.md. Ctrl+C to stop.\n');
  return sh(nodeBin(), [server], { VIEWER_MODE: 'results', TARGET_APP: app });
}

// ── help ─────────────────────────────────────────────────────────────────
function cmdHelp() {
  console.log([
    'Framework wrapper — usage:',
    '',
    '  node run.js setup                 Install deps + Playwright browsers',
    '  node run.js new <app>             Scaffold apps/<app>/ (dirs, .env, inbox/)',
    '  node run.js explore [<app>]       Print the prompt to start LIVE reverse-engineering',
    '  node run.js generate [<app>]      Print the prompt to GENERATE tests from BRs/user stories',
    '  node run.js test [<app>] [args]   Run the app\'s Playwright suite (edge config)',
    '  node run.js view [<app>]          Open the results viewer (dashboard + report.md only)',
    '  node run.js help',
    '',
    `Default app when <app> omitted: ${DEFAULT_APP} (override with TARGET_APP env).`,
    '',
    'Typical first run:',
    '  node run.js setup',
    '  node run.js new my-app',
    '  # edit apps/my-app/.env, drop materials in apps/my-app/inbox/',
    '  node run.js generate my-app      # or: explore my-app',
    '  node run.js test my-app',
    '  node run.js view my-app',
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
  case 'explore': code = printPrompt(appArg, 'explore'); break;
  case 'generate': code = printPrompt(appArg, 'generate'); break;
  case 'test': code = cmdTest(appArg, restArgs); break;
  case 'view': code = cmdView(appArg); break;
  case 'help': case '--help': case '-h': case undefined: code = cmdHelp(); break;
  default: console.error(`Unknown command "${cmd}". Run: node run.js help`); code = 2;
}
process.exit(code);
