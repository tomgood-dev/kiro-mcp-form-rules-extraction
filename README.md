# AI-Assisted Business Rules Testing Framework

Automatically reverse-engineer business rules from any live web application and generate verified Playwright test cases — without source code access.

## How It Works

1. **Point it at your app** — provide a URL and login credentials
2. **AI explores the app** — discovers fields, validation rules, dependencies, error messages, and formulas by systematically probing every interaction
3. **AI generates Playwright tests** — each discovered rule becomes a self-contained, runnable test case
4. **Run and verify** — execute tests against the live app to confirm they pass
5. **Upload to your test suite** — drop the standalone test file into any Playwright project

The exploration is driven by an AI assistant (Kiro CLI, Claude, etc.) communicating with a headed browser via the included HTTP command server. The AI reads page state, interacts with fields one at a time, observes validation responses, and documents every rule it finds.

## Quick Start

### Prerequisites
- Node.js 22+
- Network access to the target application

### Setup

```bash
git clone https://github.com/tomgood-dev/kiro-mcp-form-rules-extraction.git
cd kiro-mcp-form-rules-extraction
npm install
npx playwright install chromium
```

### Add Your App

```bash
mkdir -p apps/my-app/tests
mkdir -p apps/my-app/helpers
mkdir -p apps/my-app/docs
```

Create `apps/my-app/.env`:
```
APP_BASE_URL=https://your-app.example.com
APP_LOGIN_EMAIL=test@example.com
APP_LOGIN_PASSWORD=your-password
```

### Explore (AI-driven discovery)

Start the exploration server:
```bash
node tools/server.js "https://your-app.example.com/login"
```

This opens a browser. Log in manually, then let the AI assistant drive exploration via HTTP commands to `localhost:3333`. The AI will:
- Read every field, dropdown, button, and checkbox on each page
- Test boundary values, invalid inputs, and edge cases
- Identify mandatory fields, cross-field dependencies, and validation rules
- Document formulas, caps, and business logic

### Run Generated Tests

```bash
# Run all tests for your app
npx playwright test apps/my-app/tests/ --headed

# Run headless (CI mode)
npx playwright test apps/my-app/tests/

# Run a specific test by name
npx playwright test -g "my-rule-name"
```

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
├── README.md
├── package.json
├── playwright.config.js
├── .env.example
│
├── apps/                        # One folder per target application
│   └── asteron-quote-apply/     # Worked example (insurance form)
│       ├── tests/               # Generated Playwright test files
│       ├── helpers/             # App-specific interaction patterns
│       ├── global-setup.js      # Login automation
│       └── docs/                # Discovered business rules
│           └── exhaustive-analysis.md  # Full boundary/validation analysis
│
├── tools/                       # Reusable exploration server + helpers
│   ├── server.js                # HTTP browser command server
│   ├── batch.js                 # Batch command runner
│   ├── cmd.js                   # Quick single command
│   ├── run.js                   # File-based command
│   └── probe-*.js               # Headless probing scripts (for rule verification)
│
└── sessions/                    # Session notes (working context)
```

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

`apps/asteron-quote-apply/` contains a complete worked example — 23 verified business rules across 5 test files, reverse-engineered from a live OutSystems insurance application with zero source code access:

| File | Rules Tested |
|------|-------------|
| `test-pd-v9` | Age boundaries (11–75), Life $50k cap under-17, TPD min age, TPD $250k cap (17-21), Acd Death max age 70 |
| `lsc-both-v8` | Specific Injury companion requirement, Major Trauma 300% cap, $2M combined ceiling, TPD $5M max, Acd Death $1M max |
| `bundling-v9` | Bundling "None"/15%/20% thresholds, Trauma $25k minimum, uncommitted covers don't count |
| `dc-v1` | M&L formula (45%), IP formula (75% tiered), Workability formula + $10k cap, Workability exclusivity |
| `pol-kid-v1` | Inflation/Premium Freeze mutual exclusion, Business policy creation, Kids Cover companion requirement, Kids SI tiers |

These tests run against the live dev environment and pass consistently (~1-3 min each).

An exhaustive boundary analysis document (`apps/asteron-quote-apply/docs/exhaustive-analysis.md`) maps all 216 discovered rules to fields, permutations, and test scenarios.

## CI Integration

```yaml
# GitHub Actions
- name: Run business rule tests
  env:
    NODE_TLS_REJECT_UNAUTHORIZED: '0'
  run: |
    npx playwright install chromium
    npx playwright test apps/my-app/tests/
```
