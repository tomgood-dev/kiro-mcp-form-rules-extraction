# Test: Personal Disability Cover — Mortgage & Living — personal-disability-mortgage-living-v1

> **Test file:** `personal-disability-mortgage-living-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account A) — full run 15-05-36 + AC10 wording-fix re-run 15-35
> **Source:** ACB-2653 user story ("Personal Disability Cover - Mortgage & Living"), acceptance-criteria mode
> **Result:** 12/12 active tests passing, 5 deferred (documented); 0 unexplained failures

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | 3 disability covers present; M&L selectable | Employed, $150k | M&L/IP/Workability present; M&L activates | ✅ Pass | |
| 2 | AC03 | All dropdowns options+defaults + optional-benefit checkboxes + Split Benefit | Activate M&L | Cover Type/Method/Structure/Benefit/Waiting exact; Increasing Claim default-ticked; Split Benefit present | ✅ Pass | All `toEqual` on option sets |
| 3 | AC08 | +M&L disabled after 1 | M&L active | disabled | ✅ Pass | |
| 4 | AC09 | Add/remove reflected | Add, then Remove | field present then absent | ✅ Pass | Negative/absence |
| 5 | AC10 | ANB > 61 → max-age error | ANB 62 | "maximum Age Next Birthday for Mortgage & Living cover is 61" | ✅ Pass | App wording includes "cover"; regex matched |
| 6 | AC10 | At-max-age accept | ANB 61 | no max-age error | ✅ Pass | At-boundary accept |
| 7 | AC11 | AV+ Monthly Benefit > 45%/12 → max-benefit error | income $150k, MB $5,626 | "Agreed Value Plus is $5,625" | ✅ Pass | Value-level; $150k*0.45/12=$5,625 |
| 8 | AC11 | AV+ Monthly Benefit exactly $5,625 accept | MB $5,625 | no max-benefit error | ✅ Pass | At-boundary accept |
| 9 | AC18 | Untick Inflation (Increasing Claim on) → coupling error | untick Inflation | "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken" | ✅ Pass | Cross-field coupling |
| 10 | AC26 | Ten-Hour Benefit unticked+enabled for Employed | Employed | unticked, enabled | ✅ Pass | |
| 11 | AC25 | Ten-Hour Benefit ticked for Self-Employed | Self-Employed | ticked | ✅ Pass | |
| 12 | AC12 | "?" tooltips (Split Benefit / Agreed Value+) | Activate M&L | documented tooltip phrases present | ✅ Pass | DOM/title search (no click) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC04 | Split Benefit amount is a net-remaining calc (Step1 − existing net MLC benefit) whose exact value needs the day-2 tax-tier excel; opposite-method default + own dropdowns are testable but the value isn't hand-verifiable. |
| AC05/AC06/AC15/AC16 | Monthly Mortgage / Annual Income auto-populated monthly benefit depends on the day-2 tax-tier excel (115% of repayments / tiered after-tax income). AC06 required-field error is testable — split out next pass. |
| AC07/AC14/AC16/AC17 | Cross-policy / cross-cover combined-benefit and tax-tiered Agreed Value ($XXXX) caps need the excel reference + multi-policy state. (AV+ 45%/12 is verified as AC11.) |
| AC19/AC20/AC21/AC22/AC23/AC24 | Mental Health Discount cross-cover auto-sync + 2-Year-benefit-period greying + premium recompute — MLC+IP multi-cover reactive state; own focused spec next pass. AC19 same-method is testable — split out. |
| AC27/AC28/AC29/AC30 | Ten-Hour Benefit DYNAMIC employment/occupation transitions (change after activation, re-read) — dedicated stateful test to avoid single-session reactive races. Static defaults covered by AC25/AC26. |

## Business Rule Corrections

None. Note: the app's age-cap message reads "…for Mortgage & Living **cover** is 61" (the story omitted "cover"); the test matches the app's actual wording. Verified value AV+ max = 45%/12 of income ($150k → $5,625), matching legacy DC-15.

## Notes — session instability + parallel run

Run in parallel with the Income Protection spec on a second account (`AUTH_STATE_FILENAME=state-b.json`) — sessions did not conflict. AC10 initially failed on a too-strict regex (my bug — the app inserts "cover"); fixed and re-confirmed 2/2 in an isolated re-run. Deferred ACs use `test.fixme(true, reason)` so the report shows each reason.
