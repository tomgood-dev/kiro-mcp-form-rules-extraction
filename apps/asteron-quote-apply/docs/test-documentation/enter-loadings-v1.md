# Test: Enter Loadings — enter-loadings-v1

> **Test file:** `enter-loadings-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account C) — run 16-48-27 (18.5m)
> **Source:** ACB-3599 user story, acceptance-criteria mode.
> **Result:** 6 passing, 0 failing, 2 deferred groups. Environment: QA.

## Results (summary)

Passing: AC01/AC02 (Loadings pop-up opens; Percentage dropdown = None + 25% steps to 400% = 17 options; Per Mille present), AC06 (TPD/Disability Per Mille greyed/disabled), AC03 (Cancel returns to Quote), AC09 (Percentage/Per-mille tooltips), AC10 (opening Loadings on an unpriced quote shows the error/blocking message). All via recordCheck.

## Deferred

| AC(s) | Reason |
|---|---|
| AC07 (>$20 per-mille error + $20 boundary accept) | Reaching the per-mille INPUT inside the Loadings pop-up reliably needs a focused DOM probe. The generic "first enabled input" heuristic grabbed a Quote-screen field (b15-Input_FirstName) behind the pop-up backdrop, and raw `.value=` did not trigger validation. Held per the "verify before writing up / do not blind-tweak" rule; encode once the per-mille field is pinned by its row/label scoping. `test.fixme(true, reason)`. |
| AC04/AC05/AC08 | AC04/AC08 assert the premium CHANGES by the loading + the "Loadings have been applied" confirmation after OK — the premium delta is a pricing-engine value (not hand-verifiable) and needs the exact OK/apply-control selector + a stable post-apply signal (probe found "Cancel" but not a plain "OK"). AC05 opens an EXTERNAL Underwriting Guide URL in a new window. Focused follow-up. |

## Business Rule Corrections
None on the passing ACs — the QA app matched the story (percentage ladder, greyed TPD/Disability per-mille, tooltips, empty-quote error).

## Notes
Ran in the first background-jobs parallel batch (accounts A/B/C) — ~18m wall-clock for all 3, zero launch casualties. AC07 initially attempted with raw DOM mutation then a mis-scoped locator; both failed for the reasons above, so it was deferred rather than tweaked further.
