# Test: Enter Loadings — enter-loadings-v1

> **Test file:** `enter-loadings-v1.spec.js`
> **Last run:** 2026-09-11 (local Edge, QA, account a) — 6 passed / 1 failed (expected) / 1 skipped (7.9m)
> **Source:** ACB-3599 user story, acceptance-criteria mode.
> **Result:** 6 passing, 1 confirmed-failing on purpose (AC07 defect), 1 deferred (AC05 external URL).

## Results

| # | AC | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | Loadings pop-up opens; Percentage dropdown + Per Mille present | Life $200k priced, open Loadings | None + 25% steps to 400% (17 opts); Per Mille present | ✅ Pass | |
| 2 | AC06 | TPD & Disability Per Mille greyed; Life/Trauma/Cancer enabled | Open Loadings, read field `disabled` by id | TPD+Disability disabled; Trauma+Cancer enabled | ✅ Pass | Now strict by field id (was: any-disabled-input) |
| 3 | AC03 | Cancel / X returns to Quote screen | Open Loadings, click Cancel | Back on Quote (SI field visible) | ✅ Pass | |
| 4 | AC04/AC08 | OK applies loadings → back on Quote + "Loadings have been applied" | Life per-mille 10, click OK | Redirect to Quote + "Loadings have been applied" | ✅ Pass | Behavioural (premium $ delta is pricing-engine, not asserted) |
| 5 | AC07 | Per-mille > $20 error; $20 boundary accept | Life per-mille 25 (over), then 20 (at) | 25 → "The maximum per mille loading is $20.00"; 20 → no error | ❌ Fail | **Genuine defect**: >$20 accepted, no cap error (LOAD-D1). $20 accept side passes; over-limit side expected-fail until app fixed |
| 6 | AC09 | Percentage / Per-mille "?" tooltips | Open Loadings, read tooltip text | "...loadings are applied where a client..." present | ✅ Pass | |
| 7 | AC10 | Loadings on unpriced quote (premium $0) shows error | Open Loadings without pricing a cover | Error/blocking message shown | ✅ Pass | |

## Deferred

| AC(s) | Reason |
|---|---|
| AC05 (down-arrow → Underwriting Guide new window) | Genuine external navigation: opens the intranet host `asteron-advisernet.int.corp.sun` in a NEW window — leaves the app, host not reachable/whitelisted from the test network. Probe 2026-09-11 confirmed the modal DOM (per-mille inputs + Cancel/OK) but this control launches an out-of-app window. Encode as a `window.open` target-URL capture, or once the intranet host is whitelisted. `test.fixme(true, reason)`. |

## Business Rule Corrections
LOAD-D1 (AC07) newly recorded 2026-09-11: the $20.00 per-mille cap is not enforced/displayed on QA — see `business-rules/quote-screen/loadings/page.md`.

## Notes
AC07/AC04/AC08 were previously deferred "needs a probe". Probe `probe-loadings-popup-2026-09-11.js` pinned the per-mille inputs (`Input_PerMille[_TPD/_Trauma/_Cancer/_Disability]`) and the OK button (`.btn-primary`). AC04/AC08 confirmed working (encoded passing); AC07 confirmed as a real defect (encoded expected-fail); only AC05 (external URL) remains deferred with fresh evidence. Went from 3 deferred → 1 deferred.
