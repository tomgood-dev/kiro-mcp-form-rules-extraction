# AI-Assisted Business Rules Testing Framework

Automatically reverse-engineer business rules from any live web application and generate verified Playwright test cases — without source code access.

## How It Works

This framework is **agent-native**: you open the repository in **Kiro** and ask it to get started.
The Kiro agent reads its auto-loaded steering files (`.kiro/steering/`), inspects the working
directory to see how far along things are, and drives the whole process with you:

1. **Point it at your app** — a URL and login credentials in `apps/<app>/.env`
2. **The agent discovers or verifies business rules** — in EXPLORE mode it probes the live app to
   reverse-engineer rules; in GENERATE mode it works from your existing user stories / business rules
3. **The agent generates Playwright tests** — each rule / acceptance criterion becomes a
   self-contained, verified test case (passing, expected-to-fail, or deferred-with-evidence)
4. **Run and verify** — tests execute against the live app; every run emits `report.md`,
   `summary.json`, and an `.xlsx` workbook, and rebuilds the suite dashboard
5. **Review** — a scoped results viewer shows the dashboard + each run's report

A small helper script, `run.js`, handles the few genuinely-mechanical shell steps (install deps,
scaffold a new app, run the suite, open the viewer). It does **not** drive the process — that's the
agent's job, guided by the steering rulebook in `.kiro/steering/`.

## Quick Start

See `WRAPPER.md` for the full walkthrough. In short:

### Prerequisites
- Node.js 18+ (22+ ideal)
- **Kiro CLI** (this runs the actual process)
- Microsoft Edge (local `edge` config) or Chromium
- Network access to the target application (the bundled Asteron QA example is reachable **only from a
  whitelisted/allowlisted network** — see `apps/asteron-quote-apply/docs/network-access-issue.md`)
- To run the **bundled example** after cloning: create `apps/asteron-quote-apply/.env` from
  `.env.example` (it's gitignored) — see `WRAPPER.md` §1a for the full fresh-clone steps.

### 1. Set up
```bash
git clone https://github.com/tomgood-dev/kiro-mcp-form-rules-extraction.git
cd kiro-mcp-form-rules-extraction
node run.js setup            # installs deps + Playwright browsers
```

### 2. Start the process — open the repo in Kiro and ask
Open this repository in Kiro CLI, then say something like *"help me get started"*. The agent
(guided by `.kiro/steering/how-to-run.md`) will:
- **Detect where things are at** — which apps exist under `apps/`, and for each, whether it has
  user stories, business rules, tests, run results, or a coverage report yet.
- **Summarise what it found and ask how to proceed** — continue an in-progress app or start a new one.
- **Run the right mode:**
  - **EXPLORE** (no docs yet) — reverse-engineer business rules by probing the live app.
  - **GENERATE** (you have user stories / business rules) — produce verified regression tests
    mapped to each acceptance criterion.

### 3. Starting a brand-new app
```bash
node run.js new my-app       # scaffolds apps/my-app/ (dirs + .env)
```
Then edit `apps/my-app/.env`:
```
TARGET_APP=my-app
BASE_URL=https://your-app.example.com
LOGIN_EMAIL=test@example.com
LOGIN_PASSWORD=your-password
```
Put user stories in `apps/my-app/docs/user-stories/` and any existing business rules in
`apps/my-app/docs/business-rules/` — then ask Kiro to get started. (There is no `inbox/`; materials
live in the docs tree.)

### 4. Run tests and view results
```bash
node run.js test my-app                 # run the suite (edge config)
node run.js test my-app -g "AC03"       # a single test by grep
node run.js view my-app                 # results viewer: dashboard + each run's report.md
```

## The exploration server (EXPLORE mode)

In EXPLORE mode the agent drives a real browser via the included HTTP command server — the agent
issues these commands; you don't drive it by hand. Start it (the agent will do this, or you can for
a manual probe):
```bash
node tools/server.js "https://your-app.example.com/login"
```
This opens a browser (log in once). The agent then reads page state and interacts one field at a
time via HTTP commands to `localhost:3333`, documenting every rule it finds under
`apps/<app>/docs/business-rules/` with `[Exploration]` provenance.

## Exploration Server Commands

The server accepts JSON POST requests on `http://localhost:3333`:

| Action | Body | Returns |
|--------|------|---------|
| `state` | `{}` | Full page: URL, buttons, fields, errors, modals |
| `click` | `{id:"..."}` or `{selector:"..."}` | Clicks element, returns new state |
| `type` | `{id:"...", value:"..."}` | Types into input (char-by-char + Tab blur) |
| `fill` | `{id:"...", value:"..."}` | Sets value directly |
| `select` | `{id:"...", value:"..."}` | Selects dropdown option |
| `calcmask` | `{id:"...", value:"..."}` | Enters digits into masked number fields |
| `eval` | `{code:"..."}` | Runs JavaScript in the page |
| `errors` | `{}` | Current validation errors |
| `goto` | `{url:"..."}` | Navigates to URL |
| `wait` | `{ms:1000}` | Pauses |
| `scroll` | `{direction:"bottom"}` | Scrolls |
| `press` | `{key:"Tab"}` | Keyboard press |
| `mouse-click` | `{x:100, y:200}` | Clicks at coordinates |
| `back` | `{}` | Browser back |

### Batch Commands

```bash
# Run multiple commands from a JSON file
node tools/batch.js commands.json
```

Where `commands.json` is an array:
```json
[
  {"action": "type", "id": "age-field", "value": "25"},
  {"action": "wait", "ms": 2000},
  {"action": "errors"}
]
```

## Project Structure

```
├── README.md · HANDOVER.md · WRAPPER.md · ROADMAP.md   # start-here docs
├── TEST-GENERATION-PROCESS.md · TEST-GENERATION-LEARNINGS.md
├── run.js                       # mechanical helper: setup / new / test / view
├── package.json
├── playwright.config.js         # Generic config (Chromium)
├── playwright.edge.config.js    # Local config (Edge — use when Chromium is blocked)
├── .env.example                 # TARGET_APP, BASE_URL, LOGIN_EMAIL/PASSWORD
├── start-docs-viewer.cmd · start-results-viewer.cmd
│
├── .kiro/
│   └── steering/                # AUTO-LOADED rulebook that drives the agent:
│       ├── how-to-run.md         #   entry point (detect state, onboard, pick mode)
│       ├── test-expansion-process.md   #   the authoring rulebook
│       ├── project-context.md          #   app-specific facts
│       └── reference-reconciliation.md #   using external test material safely
│
├── docs/
│   └── METHOD.md                # the method explained for PM/testers
│
├── apps/                        # One folder per target application
│   └── asteron-quote-apply/     # Worked example (OutSystems insurance form)
│       ├── tests/               # Generated Playwright test files
│       ├── probes/              # App-specific investigation scripts
│       ├── helpers/             # App-specific interaction patterns
│       ├── global-setup.js      # Login automation
│       ├── test-runs/           # Generated: per spec, per run — report.md +
│       │                        # summary.json + <spec>.xlsx; plus DASHBOARD.md/.html
│       └── docs/                # user-stories/ · business-rules/ · test-documentation/
│           └── exhaustive-analysis.md  # Full boundary/validation analysis
│
└── tools/                       # Generic, reusable, app-agnostic tooling
    ├── server.js                # HTTP browser command server (EXPLORE mode)
    ├── batch.js · cmd.js · run.js   # command runners for the server
    ├── artifact-helpers.js      # test-runs/ convention: run folders, recordCheck/recordStep
    ├── reporters/               # Custom reporter: builds report.md/summary.json/.xlsx per run
    ├── build-dashboard.js       # Suite dashboard (DASHBOARD.md + dashboard.html)
    ├── parallel-run.js          # N-account parallel launcher
    ├── docs-viewer/             # Local markdown/results viewer (self-healing port)
    ├── lib/                     # Dependency-free .xlsx/zip writers (no npm needed)
    ├── probe-safety-lint.js     # Static check for banned interaction patterns
    └── verify-finding.js        # Independent-reverification engine
```

Each app's own `probes/` folder holds throwaway or retained investigation scripts specific to
that app (hardcoded URL/credentials/selectors) — separate from the generic `tools/` above,
which is meant to work with any app you point it at.

## Handling Different App Types

### Standard HTML Forms
- `type` and `fill` work directly
- Errors appear after submit or blur

### React / Single Page Applications
- Use `type` (not `fill`) — React needs real keyboard events to trigger state updates
- Add `wait` calls between interactions for re-renders
- IDs may regenerate — use partial selectors: `[id*="partial-match"]`

### OutSystems / Low-Code Platforms
- See `apps/asteron-quote-apply/helpers/` for proven patterns
- Masked number fields need digit-by-digit entry (`calcmask` action)
- Toggle buttons need `eval`-based `.click()` to trigger platform XHR
- Always wait for loading indicators between interactions

### Apps Behind Corporate Proxies / SSO
```bash
# Disable TLS verification for corporate proxy CAs
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
node tools/server.js "https://your-internal-app.corp.com"
```

Log in manually in the headed browser, then the AI drives from there.

## Included Example

`apps/asteron-quote-apply/` contains a complete worked example, reverse-engineered from a live
OutSystems insurance application with zero source code access. Current live test files (see
`apps/asteron-quote-apply/docs/test-documentation/` for full per-file docs —
older versions referenced by number are in `apps/asteron-quote-apply/tests/deprecated/`):

| File | Rules Tested |
|------|-------------|
| `personal-details-age-boundary-rules-v1` | Age boundaries (11–75), Life $50k cap under-17, TPD min age, TPD $250k cap (17-21), Acd Death max age 70 |
| `lump-sum-covers-caps-and-companion-rules-v1` | Specific Injury companion requirement, Major Trauma 300% cap, $2M combined ceiling, TPD $5M max, Acd Death $1M max |
| `premium-bundling-discount-thresholds-v1` | Bundling "None"/15%/20% thresholds, Trauma $25k minimum, uncommitted covers don't count |
| `disability-covers-formulas-and-caps-v1` | M&L/IP/Workability formulas, Agreed Value + Loss of Earnings variants, Monthly Mortgage cover type |
| `policy-structure-and-kids-cover-rules-v1` | Inflation/Premium Freeze mutual exclusion, Business policy creation, Kids Cover companion requirement, Kids SI tiers |
| `select-default-commission-category-part-1-v1` / `select-default-commission-category-part-2-v1` | Adviser Use / commission category — see `docs/user-stories/` (acceptance-criteria mode) |

These tests run against the live dev environment and pass consistently (~1-4 min each).

An exhaustive boundary analysis document (`apps/asteron-quote-apply/docs/exhaustive-analysis.md`) maps all 216 discovered rules to fields, permutations, and test scenarios.
