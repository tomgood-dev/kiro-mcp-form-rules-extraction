# Asteron Life Quote & Apply — Test Suite

Reverse-engineered business rules and Playwright tests for the Asteron Life Quote & Apply insurance form (OutSystems Reactive Web).

## Target
- **URL:** https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/
- **Login:** https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
- **Environment:** OutSystems dev (network-whitelisted Amazon Workspace required)

## Running Tests

```bash
# From project root
npx playwright test apps/asteron-quote-apply/tests/quote-screen/showcase-business-rules.spec.js --headed

# Local Windows machine (Chromium blocked, use Edge config)
node node_modules/@playwright/test/cli.js test apps/asteron-quote-apply/tests/<file>.spec.js --reporter=line --config=playwright.edge.config.js
```

Each test in `tests/*.spec.js` is self-contained (login + one `test()` per file, ES5 inside
`page.evaluate()`) — see `.kiro/steering/test-expansion-process.md` for why and the full
authoring process.

## Key Files

| File | Purpose |
|------|---------|
| `tests/*.spec.js` (e.g. `personal-details-age-boundary-rules-v1`, `lump-sum-covers-caps-and-companion-rules-v1`, `disability-covers-formulas-and-caps-v1`, `premium-bundling-discount-thresholds-v1`, `policy-structure-and-kids-cover-rules-v1`, `select-default-commission-category-part-1-v1`, `select-default-commission-category-part-2-v1`) | Current, live full-coverage business rule tests |
| `tests/outbound-ip-diagnostic-v1.spec.js`, `tests/network-whitelist-connectivity-check-v1.spec.js`, `tests/demo-intentional-fail-smoke-test-v1.spec.js` | Connectivity diagnostics / demo smoke test |
| `tests/deprecated/` | Superseded versions, kept for history |
| `tests/quote-screen/*.spec.js` | Original per-topic modular suite |
| `probes/probe-*.js` | Throwaway/retained investigation scripts (run directly with `node`, not via Playwright Test) — see `.kiro/steering/test-expansion-process.md` "Probe & Interaction Safety" before writing new ones |
| `helpers/quote-helpers.js` | OutSystems interaction patterns (calc-mask, button groups, etc.) |
| `docs/confluence-pages/business-rules/` | Canonical business rules documentation |
| `docs/confluence-pages/test-documentation/` | One `.md` per test file (version-matched) |
| `docs/user-stories/` | Source Jira/Confluence user stories tested in acceptance-criteria mode |
| `docs/exhaustive-analysis.md` | Full boundary/validation analysis |

## OutSystems Interaction Patterns

This app requires special handling due to OutSystems Reactive Web:
- **Calc-mask fields** (Sum Insured): backspace ×12 then digit-by-digit — never `.fill()`
- **Cover buttons**: must use `page.evaluate(() => btn.click())` — standard `.click()` misses XHR
- **Gender/Smoking toggles**: button groups, not radio inputs — use evaluate-based click
- **Dropdowns**: wait for enabled state after any field that triggers recalculation
- **Timing**: 240s timeout per test, 2-3s settle time between interactions

## Network Requirement

Tests must run from a whitelisted IP. See `docs/network-access-issue.md` for details.
- Amazon Workspace: ✅ Works (`10.248.94.105`)
- OutSystems Test Suite: ⚠️ Pending whitelist (`54.253.37.176`)
