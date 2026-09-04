# Test: Personal Disability Cover — Income Protection — personal-disability-income-protection-v1

> **Test file:** `personal-disability-income-protection-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account B) — full run 15-05-37 + AC17 wording-fix re-run 15-35
> **Source:** ACB-2646 user story ("Personal Disability Cover - Income Protection"), acceptance-criteria mode
> **Result:** 11/11 active tests passing, 4 deferred (documented); 0 unexplained failures

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | 3 disability covers present; IP selectable | Employed, $150k | M&L/IP/Workability present; IP activates | ✅ Pass | |
| 2 | AC03 | All dropdowns options+defaults + checkboxes + Split Waiting Period | Activate IP | Definition/Structure/Benefit/Waiting exact; Increasing Claim default-ticked; Split Waiting Period present | ✅ Pass | All `toEqual` on option sets |
| 3 | AC06 | +IP disabled after 1 | IP active | disabled | ✅ Pass | |
| 4 | AC08 | Add/remove reflected | Add, then Remove | field present then absent | ✅ Pass | Negative/absence |
| 5 | AC17 | ANB > 61 → max-age error | ANB 62 | "maximum Age Next Birthday for Income Protection cover is 61" | ✅ Pass | App wording includes "cover"; regex matched |
| 6 | AC17 | At-max-age accept | ANB 61 | no max-age error | ✅ Pass | At-boundary accept |
| 7 | AC19 | Monthly Benefit > 75%/12 → max-benefit error | income $150k, MB $9,376 | "Income Protection benefit is $9,375" | ✅ Pass | Value-level; $150k*0.75/12=$9,375 |
| 8 | AC19 | Monthly Benefit exactly $9,375 accept | MB $9,375 | no max-benefit error | ✅ Pass | At-boundary accept |
| 9 | AC25 | Absolute $30,000 cap (high income) | income $1M, MB $30,001 | "Income Protection benefit is $30,000" | ✅ Pass | Value-level absolute cap |
| 10 | AC22 | Untick Inflation (Increasing Claim on) → coupling error | untick Inflation | "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken" | ✅ Pass | Cross-field coupling |
| 11 | AC18 | "?" tooltips (Split Waiting Period / Income Top-up) | Activate IP | documented tooltip phrases present | ✅ Pass | DOM/title search (no click) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC04/AC10/AC12/AC14/AC16 | Split Waiting Period auto-calc split monthly benefit is a net-remaining calc needing the day-2 tax-tier excel; the Split Waiting Period control + own waiting dropdown are testable but the value isn't hand-verifiable. |
| AC07/AC09/AC11/AC13/AC15/AC21 | Tiered net-income LOE/LOE+ figures + post-MLC "remaining GROSS IP balance" need the excel reference + cross-cover state. (Simple 75%/12 = $9,375 and absolute $30,000 cap verified as AC19/AC25.) |
| AC20 | Cross-cover (MLC+IP) combined-benefit "lower IP/MLC amount to $XXXX/$YYYY" — calculated-benefit-minus-other-cover figures from the excel; dedicated MLC+IP interaction spec next pass. |
| AC23 | IP Benefit Period = 2 Years → Mental Health Discount greyed — testable in isolation but needs a stable-signal wait after changing the benefit-period dropdown; split out next pass with the Mental-Health cross-sync ACs. |

## Business Rule Corrections

None. Note: the app's age-cap message reads "…for Income Protection **cover** is 61" (the story omitted "cover"); the test matches the app's actual wording. Verified values: max = 75%/12 of income ($150k → $9,375, matching legacy DC-21) and the absolute $30,000 cap at high income.

## Notes — session instability + parallel run

Run in parallel with the Mortgage & Living spec on the primary account — sessions did not conflict. AC17 initially failed on a too-strict regex (my bug — the app inserts "cover"); fixed and re-confirmed 2/2 in an isolated re-run. Deferred ACs use `test.fixme(true, reason)` so the report shows each reason.
