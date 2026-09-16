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

## 1a. Running the bundled `asteron-quote-apply` example after a fresh clone
The repo ships with a fully-built example app. To run its test suite on a freshly-cloned machine,
a few things are **gitignored** (never committed) and must be provided locally:

1. **Create its `.env`** — the app's `.env` is gitignored, so a clone doesn't include it. Copy the
   template and fill in real values:
   ```
   copy .env.example apps\asteron-quote-apply\.env      # Windows
   cp   .env.example apps/asteron-quote-apply/.env      # macOS/Linux
   ```
   Set `BASE_URL`, and `LOGIN_EMAIL` + `LOGIN_PASSWORD` (or the `ASTERON_LOGIN_*` aliases — both work).
2. **Auth state regenerates itself** — `.auth/state-*.json` is gitignored, but `global-setup.js`
   logs in and recreates it automatically on the first run. No manual step.
3. **Run a quick scoped check first** (the full suite is long — see §3):
   ```
   node run.js test asteron-quote-apply -g "AC02: 2 eligible covers"
   ```

**Environment prerequisites that are NOT in the repo (these can block a run regardless of the code):**
- **Microsoft Edge** installed — the local config launches Edge.
- **Valid credentials** in the `.env` above.
- **Network access to the target app** — the Asteron QA environment is only reachable from a
  **whitelisted IP / allowlisted network**. On an off-network device, login fails at `global-setup`
  no matter how correct everything else is (see `apps/asteron-quote-apply/docs/network-access-issue.md`).


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
Note: the full Asteron suite is long — several quote-screen specs are minutes each and the
apply-flow specs are ~7–20 min (real live builds against QA). Scope with `-g "<test>"` for quick checks.

## 3a. Parallel runs across multiple accounts (optional, for speed)
`node run.js test` uses the ONE account in `.env`. To run many specs in PARALLEL you need multiple
accounts — the platform allows only one live session per account at a time, so parallelism = one
stream per account. Set them up once:
```
copy apps\asteron-quote-apply\accounts.example.json apps\asteron-quote-apply\accounts.json   # then edit
```
List each QA account (`id`, `email`, `password`) in that gitignored `accounts.json`, then use the
launcher (it handles per-account auth state, session-safety flags, and launch staggering):
```
node tools/parallel-run.js --all                 # every spec, fanned across your accounts
node tools/parallel-run.js <spec> [<spec> ...]   # named specs across accounts
node tools/parallel-run.js --list                # show discovered accounts + specs
node tools/parallel-run.js --scaling-test        # load-test: same short spec on all accounts
```
Each account `id` maps to `.auth/state-qa-<id>.json` (auto-created). Add accounts to scale.

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
