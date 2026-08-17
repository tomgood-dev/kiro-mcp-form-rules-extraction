# Asteron Life Quote & Apply — Test Suite

Reverse-engineered business rules and Playwright tests for the Asteron Life Quote & Apply insurance form (OutSystems Reactive Web).

## Target
- **URL:** https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/
- **Login:** https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
- **Environment:** OutSystems dev (network-whitelisted Amazon Workspace required)

## Running Tests

```bash
# From project root
npx playwright test apps/asteron-quote-apply/tests/showcase-business-rules-standalone.spec.js --headed
```

The standalone file is self-contained (login + helpers + tests in one file). No external setup needed beyond credentials.

## Key Files

| File | Purpose |
|------|---------|
| `tests/showcase-business-rules-standalone.spec.js` | 6 verified tests — ready to upload to OutSystems Test Suite |
| `tests/network-diagnostic.spec.js` | Connectivity diagnostic tool |
| `tests/quote-screen/*.spec.js` | Full suite (51 tests, some need selector fixes) |
| `helpers/quote-helpers.js` | OutSystems interaction patterns (calc-mask, button groups, etc.) |
| `docs/` | Business rules documentation + changelog |

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
