# Test: Discounts & Bundling Discounts — discounts-bundling-v1

> **Test file:** `discounts-bundling-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account A) — run 16-48-25 (17.8m)
> **Source:** ACB-2296 user story, acceptance-criteria mode.
> **Result:** 4 passing, 2 confirmed-failing (AC02/AC03 — genuine app discrepancy, expected-fail). Environment: QA.

## Results (summary)

Passing: AC01 (Bundling Discounts shown with 2 covers), AC02-boundary (a below-min-SI cover doesn't count), AC04 (removing a cover recalculates to None), AC05/AC06 (banner + tooltip "multiple cover types"). All via recordCheck.

## Discrepancy Evidence Record

#### AC02/AC03 — bundling percentages are 12.5%/17.5% on QA, not the story's 15%/20%
- **Verbatim requirement:** AC02 "15% discount ... 2 eligible covers"; AC03 "20% discount ... 3 or more eligible covers".
- **Reproduction:** New quote → Life $200k + TPD $200k (→ AC02); + Trauma $50k (→ AC03). Read the Bundling Discounts line.
- **Expected:** "15% (2 covers)" / "20% (3 covers or more)".
- **Actual (QA, 2026-09-07):** **"12.5% (2 covers)"** and **"17.5% (3 covers or more)"**.
- **Evidence:** run 16-48-25 (AC02/AC03 failures). Same discrepancy independently found in premium-details AC02 (personal bundling widget). Reproduced across specs/runs.
- **Test encoding:** AC02/AC03 assert the story values (15%/20%) and are EXPECTED TO FAIL until the app matches (or the story is updated to 12.5%/17.5%). Candidate defect — reconcile with BA.

## Notes
Ran in the first background-jobs parallel batch (accounts A/B/C) — ~18m wall-clock for all 3 specs, zero launch casualties (KILL_STRAY_EDGE=false + staggered).
