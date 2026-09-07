# Test: Enter Commissions — enter-commissions-v1

> **Test file:** `enter-commissions-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account B) — run 16-48-26 (16.6m)
> **Source:** ACB-3598 user story, acceptance-criteria mode.
> **Result:** 5 passing, 1 confirmed-failing (AC08 — discrepancy, expected-fail), 1 deferred group. Environment: QA.

## Results (summary)

Passing: AC01/AC02 (Adviser Use opens the Commission pop-up: Default-for-Agency [Upfront/Level 30/Spread 20] + Split Commission), AC02 (IC/RC default IC-100%,RC-100% with no flexi), AC11 (Flexi 30% → Nil-Comm message), AC12 (Split Commission tooltip), AC06/AC07 (Cancel returns to Quote). Reuses the Adviser Use pop-up patterns from select-default-commission-category-v1. All via recordCheck.

## Discrepancy Evidence Record

#### AC08 — with a Flexi Rate selected, IC/RC auto-selects instead of defaulting to "Please Select"
- **Verbatim requirement:** AC02/AC08: IC/RC dropdown default is "Please Select" if a flexirate has been selected.
- **Reproduction:** New quote, price Life $200k, set Flexi Rate 15.0%, open Adviser Use, read the IC/RC default.
- **Expected:** "Please Select".
- **Actual (QA, 2026-09-07):** **"IC-50%, RC-50%"** — the app auto-selects a valid IC/RC combo for the flexi rate rather than forcing an explicit pick.
- **Evidence:** run 16-48-26 (AC08 failure).
- **Test encoding:** AC08 asserts "Please Select" and is EXPECTED TO FAIL until reconciled — candidate story-vs-app discrepancy (auto-select may be the intended newer behaviour). Reconcile with BA.

## Deferred

| AC(s) | Reason |
|---|---|
| AC03/AC04/AC05/AC09/AC10 | Default-update confirmation (state-mutating), Select-All, and the flexi→IC/RC→commission-structure value mappings overlap the already-tested `select-default-commission-category-v1` area (which encodes those mappings AND documents 7 known QA regressions). Re-testing here would duplicate those expected-fails. `test.fixme(true, reason)`. |

## Notes
Ran in the first background-jobs parallel batch (accounts A/B/C) — ~18m wall-clock for all 3, zero launch casualties.
