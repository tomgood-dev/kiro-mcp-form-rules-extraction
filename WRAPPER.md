# Quick Start — running this framework

This framework is **agent-native**: you open the repository in **Kiro** and *ask it to get
started*. The Kiro agent reads its steering files (auto-loaded from `.kiro/steering/`), inspects
the working directory to see how far along things are, and drives the whole process — extracting
business rules, generating tests, and deciding coverage — with you.

A small helper script, `run.js`, handles the few genuinely-mechanical shell steps (installing
dependencies, running the test suite, opening the results viewer). It does **not** drive the
process — that's the agent's job.

## Just want to SEE the coverage / results? (BAs & reviewers — no install, no network, no login)

You do **not** need to run anything, be on the corporate network, or have credentials to review what's
already been tested. Open these files directly in your browser / editor — they are committed in the repo:

- **Coverage summary (start here):** `apps/asteron-quote-apply/docs/coverage-summary-2026-09-16.md`
  — one-page executive view (covered / deferred / missing, what changed, gaps to close). _Always open
  the newest `coverage-summary-YYYY-MM-DD.md`; older dates are point-in-time snapshots._
- **Full gap analysis (detail):** `apps/asteron-quote-apply/docs/coverage-gaps-2026-09-16.md`.
- **Live test dashboard:** `apps/asteron-quote-apply/test-runs/dashboard.html` (double-click to open —
  self-contained, sortable/filterable) or `test-runs/DASHBOARD.md`. This is the **live picture** and
  rebuilds at the end of every test run; the `coverage-*` docs above are dated snapshots.
- **A specific run's evidence:** `apps/asteron-quote-apply/test-runs/<spec>/<timestamp>/report.md`.

Everything below (setup, running tests) is only needed if you want to **execute** tests yourself.

## Glossary (plain English)

- **AC** — Acceptance Criterion (one numbered requirement from a user story).
- **Playwright** — the browser-automation tool that runs the tests against the live app.
- **spec / `.spec.js`** — one test file (usually one user story's ACs).
- **Covered** — the AC has a real running test (it passes, or it's an intentional expected-fail).
- **Expected-fail** — a test deliberately kept RED because it encodes a *real app defect/discrepancy*;
  it goes green automatically the day the app is fixed. A red result is **not** necessarily a broken test.
- **Deferred** — an AC we can't test yet (documented reason: needs data, pricing values, backend, etc.).
- **Missing** — an AC with no test and no deferral (a gap to close). The suite currently has **0**.

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
   **Where to get these values:** `.env.example` ships a placeholder URL (`your-app.example.com`) — that
   is NOT the real target. For the bundled Asteron example, `BASE_URL` is the QA environment
   `https://outsystems-qa.asteronlife.co.nz`, and a **QA test account (email + password) must be
   obtained from the project owner / your team's credential store** — test credentials are deliberately
   NOT committed to the repo. Without a real URL + working QA account you can create a correctly-shaped
   `.env` but the run will stop at login.
2. **Auth state regenerates itself** — `.auth/state-*.json` is gitignored, but `global-setup.js`
   logs in and recreates it automatically on the first run. No manual step.
3. **Run a quick scoped check first** (the full suite is long — see §3):
   ```
   node run.js test asteron-quote-apply -g "AC02: 2 eligible covers"
   ```
   **What success looks like:** that scoped test is a known-passing quote-screen check — expect it
   **passed**. Note that a FULL-suite run legitimately shows some RED results that are **intentional
   expected-fails** (they encode real, known app discrepancies — e.g. the per-mille loadings cap, a
   bundling 12.5%-vs-15% discrepancy, and some adviser-use regressions). A red expected-fail is **by
   design**, not a broken test — see the "Expected-fail" glossary entry above and the per-spec
   `report.md` (each failure quotes the AC and the expected-vs-actual so you can tell design-red from a
   real regression).

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
