# Landing page: Online Quoting Tool — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-online-quoting-tool-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~2 min · 2 tests
- **Source:** Acceptance-criteria mode — Jira ACB-2239 (`docs/user-stories/User Story- Landing page- Online Quoting Tool.md`)
- **Result:** 2/2 passing

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC02/AC03 | From the portal I can navigate to the New Business Quoting Tool UI | Navigate to /QuoteAndApply/ | "Quotes and Applications" UI + New Quote action | ✅ Pass | |
| 2 | AC01 | Quoting tool is gated behind the Adviser Portal login | Navigate to portal login URL | Login screen served (HTTP < 400) | ✅ Pass | |

## Deferred

_None — all ACs reachable and passing._
