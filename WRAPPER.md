# Quick Start — the framework wrapper

`run.js` is a thin, cross-platform entry point that lets anyone who clones this repo go from
zero to running regression tests (or live business-rules exploration) without hand-wiring configs.

## 0. Prerequisites
- Node.js 18+ (22+ ideal). Microsoft Edge (for the local `edge` config) or Chromium.

## 1. Set up
```
node run.js setup
```
Installs npm dependencies and Playwright browsers.

## 2. Create your app workspace
```
node run.js new my-app
```
Scaffolds `apps/my-app/` with `tests/ helpers/ probes/ docs/ inbox/ .auth/` and a pre-filled
`.env` (edit it: `BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`).

## 3. Drop in your materials
Put your **user stories**, **existing business rules**, and any **reference material**
(client test suites, requirement docs, screenshots) into `apps/my-app/inbox/`.

## 4. Start the AI process (two modes)
Run the launcher, then paste the printed prompt into a Kiro CLI session opened in this repo:

```
node run.js explore my-app      # LIVE reverse-engineering (no docs yet — discover rules from the app)
node run.js generate my-app     # GENERATE regression tests from the BRs / user stories you dropped in
```

- **explore** → the AI drives the live app via the exploration server, discovers rules, documents
  them under `docs/business-rules/`, then generates + runs Playwright tests.
- **generate** → the AI reads your user stories/BRs, probes the live app to confirm behaviour, and
  encodes each acceptance criterion as a verified (or expected-to-fail) Playwright test.

The prompt tells the AI to follow the process in `.kiro/steering/` and `TEST-GENERATION-PROCESS.md`.

## 5. Run the tests
```
node run.js test my-app                       # whole suite (edge config)
node run.js test my-app -g "AC03"             # a single test by grep
```

## 6. View results (testing output only)
```
node run.js view my-app
```
Opens http://localhost:4400 — lands on the interactive **dashboard** (pass/fail per spec) with a
sidebar of each run's **report.md**. It shows ONLY testing output — not the whole project's docs.
(Double-clickers on Windows can use `start-results-viewer.cmd my-app`.)

## npm aliases
`npm run setup`, `npm run new -- my-app`, `npm run view -- my-app`.

## Notes
- `TARGET_APP` env overrides the default app for any command (default: the bundled
  `asteron-quote-apply` worked example).
- `apps/<app>/.env` is gitignored; credentials never get committed.
- The wrapper is intentionally thin — the real process lives in `.kiro/steering/*.md`, `tools/`,
  and `TEST-GENERATION-PROCESS.md`.
