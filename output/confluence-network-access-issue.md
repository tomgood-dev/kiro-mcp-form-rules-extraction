# OutSystems Test Suite — Network Access Issue for Asteron Connect Dev Environment

## Summary

Playwright test scripts that run successfully from the Amazon Workspace (POC VDI) fail immediately when executed from the OutSystems Test Suite application. The root cause is an **application-level network restriction** on `outsystems-dev.asteronlife.co.nz` that does not trust the Test Suite's outbound IP address.

**Status:** Awaiting IP whitelisting by infrastructure/OutSystems team.

---

## Problem Description

### Symptoms
- Tests pass on the Amazon Workspace (via Kiro CLI or direct `npx playwright test`)
- The same tests fail instantly on the OutSystems Test Suite with no useful error — just "Assertion failed" or the OutSystems generic error page
- The failure is not a test logic issue — it's a connectivity rejection at the application layer

### Root Cause
The OutSystems dev environment (`outsystems-dev.asteronlife.co.nz`) accepts TCP connections from the Test Suite but **rejects the session during SPA initialization**, redirecting to:

```
https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/_error.html?MdbPuYkmLLp3yWcJEpuYkg
```

Page body: `"There was an error processing your request. RELOAD"`

This indicates the OutSystems application has a network trust boundary that blocks requests originating from untrusted IP addresses — not at the firewall level, but at the **application/session level**.

---

## Diagnostic Evidence

### Network Details

| Environment | Outbound IP | Connectivity | App Response |
|-------------|-------------|--------------|--------------|
| Amazon Workspace (POC VDI) | `10.248.94.105` | ✅ Full access | Login page renders, tests pass |
| OutSystems Test Suite | `54.253.37.176` | ⚠️ TCP connects, app rejects | Redirects to `_error.html` |

### Target Server
- Hostname: `outsystems-dev.asteronlife.co.nz`
- Resolves to: `13.237.186.76`, `13.237.2.119` (AWS ap-southeast-2)

### How We Confirmed This

A diagnostic Playwright test was written (`tests/network-diagnostic.spec.js`) and run on both environments. It:

1. Navigates to `https://api.ipify.org` to report the outbound IP
2. Navigates to the Asteron login page and reports what the page shows after 10 seconds

**Result from Test Suite:**
```
URL=https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/_error.html?MdbPuYkmLLp3yWcJEpuYkg
TITLE=
LOGIN_BTN=false
EMAIL=false
ANY_INPUT=false
HTML=2954
BODY=There was an error processing your request. RELOAD
```

**Result from Amazon Workspace:**
- Login page renders fully with email/password fields and "Log in" button
- All 6 showcase business-rule tests pass (16 minutes total execution)

---

## Solution

### Required Action
Whitelist IP `54.253.37.176` on the OutSystems dev environment (`outsystems-dev.asteronlife.co.nz`) at the application/platform level.

### Who to Contact
- OutSystems infrastructure team / platform administrators
- The team that manages the `outsystems-dev` environment's Internal Network configuration in Service Center

### Questions to Confirm
1. Is `54.253.37.176` a **static** egress IP for the OutSystems Test Suite environment, or does it rotate?
   - If static → single IP whitelist is sufficient
   - If dynamic → need a CIDR range or VPN/peering solution
2. Where is the trust boundary configured? (OutSystems Service Center → Internal Network settings? AWS Security Group? Application-level IP filter?)

---

## Workaround (Current State)

Until whitelisting is complete, all Playwright tests against `outsystems-dev.asteronlife.co.nz` must be run from the **Amazon Workspace** environment:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
cd D:\Users\TOMGOO\Documents\QuoteAndApply\kiro-mcp-form-rules-extraction-master
npx playwright test tests/showcase-business-rules-standalone.spec.js --headed
```

---

## Test File Reference

### `tests/showcase-business-rules-standalone.spec.js`

A fully self-contained Playwright test file (379 lines, zero external dependencies beyond `@playwright/test`) that validates 6 critical Asteron Life Quote & Apply business rules:

| # | Rule ID | Test Name | What It Validates |
|---|---------|-----------|-------------------|
| 1 | LSC-19 | Major Trauma below $25k TRC | Cap = 300% of TRC Sum Insured |
| 2 | LSC-20 | Major Trauma at/above $25k TRC | No percentage cap — only $2M global ceiling |
| 3 | DC-21 | Income Protection 3-tier formula | 75% to $320k / 50% to $560k / 20% above / $30k cap |
| 4 | LSC-32 | Specific Injury companion cover | Requires Life, TPD, Trauma, Cancer, or disability cover |
| 5 | PD-28 | Life Cover age-band cap | $50,000 maximum for Age Next Birthday < 17 |
| 6 | PREM-23/24 | Bundling discount threshold | Life/TPD require ≥$100,000 to count toward discount |

**Key OutSystems interaction patterns embedded in the file:**
- Calc-mask fields (Sum Insured): backspace ×12 then digit-by-digit entry — never `.fill()`
- Cover activation: `page.evaluate()` click — standard Playwright `.click()` misses the XHR
- Gender button group: evaluate-based click — not a radio input
- Occupation/Employment dropdowns: wait for enabled state after Gender triggers full recalculation
- 240-second timeout per test (OutSystems round-trips are slow)

### `tests/network-diagnostic.spec.js`

A diagnostic test that reports the Playwright instance's outbound IP and whether it can reach the target environment. Used to confirm the network issue. Can be rerun after whitelisting to verify the fix.

---

## Repository

All files are in: `https://github.com/tomgood-dev/kiro-mcp-form-rules-extraction`

| Path | Purpose |
|------|---------|
| `tests/showcase-business-rules-standalone.spec.js` | 6 production-ready business rule tests (self-contained) |
| `tests/network-diagnostic.spec.js` | Network connectivity diagnostic |
| `tests/quote-screen/showcase-business-rules.spec.js` | Same 6 tests using shared helpers (modular version) |
| `tests/helpers/quote-helpers.js` | Reusable OutSystems interaction helpers |
| `output/iteration-003-changelog.md` | Full changelog of business rules discovered |
| `output/confluence-pages/business-rules/` | Canonical business rule documentation |

---

## Timeline

| Date | Event |
|------|-------|
| 2026-08-11 | First test run on Amazon Workspace (server.js approach) |
| 2026-08-13 | Iteration 003 complete — all business rules verified |
| 2026-08-14 | 6 showcase Playwright tests passing on Amazon Workspace |
| 2026-08-17 | Attempted run on OutSystems Test Suite — network rejection discovered |
| 2026-08-17 | Diagnostic confirmed: IP `54.253.37.176` not whitelisted |
| Pending | IP whitelisting by infrastructure team |
