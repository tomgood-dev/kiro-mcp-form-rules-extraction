# Quick Start — running this framework

This framework is **agent-native**: you open the repository in **Kiro** and *ask it to get
started*. The Kiro agent reads its steering files (auto-loaded from `.kiro/steering/`), inspects
the working directory to see how far along things are, and drives the whole process — extracting
business rules, generating tests, and deciding coverage — with you.

A small helper script, `run.js`, handles the few genuinely-mechanical shell steps (installing
dependencies, running the test suite, opening the results viewer). It does **not** drive the
process — that's the agent's job.

## 0. Prerequisites
- Node.js 18+ (22+ ideal). Microsoft Edge (for the local `edge` config) or Chromium.
- **Kiro CLI** — this is what runs the actual process.

## 1. One-time setup
```
node run.js setup
```
Installs npm dependencies and Playwright browsers.

## 2. Start the process — open the repo in Kiro and ask
Open this repository in Kiro CLI, then just say something like:

> "Help me get started" · "I want to extract business rules from my app" ·
> "Generate regression tests for these user stories"

The agent (guided by `.kiro/steering/how-to-run.md`) will:
1. **Detect where things are at** — which apps exist under `apps/`, and for each, whether it has
   user stories, business rules, tests, run results, or a coverage report yet.
2. **Summarise what it found and ask you how to proceed** — e.g. continue an in-progress app
   (close gaps, re-test, run the suite) or start a new one. It won't assume you're starting fresh.
3. **Run the right mode** —
   - **Explore** (no docs yet): reverse-engineer business rules by probing the live app.
   - **Generate** (you have user stories / business rules): produce verified regression tests
     mapped to each acceptance criterion.

### Where your materials go
There is **no `inbox/`**. Put materials in the app's docs tree (or just paste/point the agent at
them and it will file them):
- **User stories** → `apps/<app>/docs/user-stories/`
- **Existing business rules** → `apps/<app>/docs/business-rules/`
- **A client's existing test suite / reference material** → `reference/` (handled per
  `.kiro/steering/reference-reconciliation.md`).

### Starting a brand-new app
```
node run.js new my-app          # scaffolds apps/my-app/ (dirs + .env)
```
Then edit `apps/my-app/.env` (`BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`), add your materials to
`docs/user-stories/`, and ask Kiro to get started.

## 3. Run the tests (mechanical)
```
node run.js test my-app                 # whole suite (edge config)
node run.js test my-app -g "AC03"       # a single test by grep
```
(The agent also runs tests itself as part of the process; this is for running them by hand.)

## 4. View results (dashboard + reports only)
```
node run.js view my-app
```
Opens http://localhost:4400 — lands on the interactive **dashboard** with a sidebar of each run's
**report.md**. Shows only testing output, not the whole project's docs. (Windows: double-click
`start-results-viewer.cmd my-app`. If the port is busy it auto-moves to the next free one.)

## Notes
- `TARGET_APP` env overrides the default app (default: the bundled `asteron-quote-apply` example).
- `apps/<app>/.env` is gitignored; credentials never get committed.
- The real IP lives in `.kiro/steering/*.md` (the rulebook + app context) and `tools/`. The agent
  is bound by those; `run.js` is just the mechanical shell.
