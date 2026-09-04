# Test: Personal Disability Cover — Workability — personal-disability-workability-v1

> **Test file:** `personal-disability-workability-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account A) — full run 16-26-31 + AC13 fix re-run 16-45
> **Source:** ACB-2648 user story ("Personal Disability Cover - Workability"), acceptance-criteria mode
> **Result:** 12/13 active passing, 1 confirmed failing (AC03b — genuine discrepancy, expected-to-fail), 1 deferred

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | 3 disability covers present; Workability selectable | Employed, $150k | present; activates | ✅ Pass | |
| 2 | AC03 | Structure/Benefit/Waiting options+defaults | Activate Workability | Stepped(def); To Age 65(def)/70; 30(def)/45/60/75/90 Days | ✅ Pass | Distinct benefit/waiting sets vs M&L/IP |
| 3 | AC03b | Increasing Claim default (story: ticked) | Activate Workability | ticked | ❌ Fail | **Confirmed discrepancy** — app shows UNticked; see record below |
| 4 | AC04 | Add/remove reflected | add, then remove | present then absent | ✅ Pass | Negative/absence |
| 5 | AC05 | +Workability disabled after 1 | active | disabled | ✅ Pass | |
| 6 | AC06/AC11 | Monthly Benefit > min($10k,75%/12) → max-benefit error | $150k, MB $9,376 | "...annual income $150,000 is $9,375" | ✅ Pass | Value-level; min($10k,$9,375)=$9,375 |
| 7 | AC06/AC11 | MB exactly $9,375 accept | MB $9,375 | no max-benefit error | ✅ Pass | At-boundary accept |
| 8 | AC07 | ANB > 61 → max-age error | ANB 62 | "Workability cover is 61" | ✅ Pass | |
| 9 | AC07 | At-max-age accept | ANB 61 | no max-age error | ✅ Pass | At-boundary accept |
| 10 | AC13 | ANB < 17 → min-age error | ANB 16 | "Workability cover is 17" | ✅ Pass | Fixed benefit-commit to best-effort |
| 11 | AC13 | At-min-age accept | ANB 17 | no min-age error | ✅ Pass | At-boundary accept |
| 12 | AC08 | Workability + IP → conjunction error | Workability + IP | "not available to be taken in conjunction with ... Income Protection" | ✅ Pass | Cross-cover exclusivity (legacy DC-28) |
| 13 | AC12 | Untick Inflation (Increasing Claim on) → coupling error | tick Increasing Claim, untick Inflation | "If Increasing Claim is selected, then Inflation Adjustment Benefit must also be taken" | ✅ Pass | Cross-field coupling |

## Discrepancy Evidence Record

#### AC03 — Increasing Claim is NOT ticked by default for Workability

- **AC / Rule ID:** AC03 (ACB-2648), "Optional Benefits — Increasing Claim (default ticked)"
- **Verbatim requirement:** "Allow selection of the following option via checkbox: Increasing Claim (default ticked)".
- **Reproduction steps:** 1. New quote (Employed, income $150,000). 2. Activate Workability. 3. Read the Increasing Claim checkbox state.
- **Expected result:** Increasing Claim ticked by default.
- **Actual result (probe + spec run 2026-09-04):** Increasing Claim is UNticked by default (`{checked:false}`) — unlike Mortgage & Living and Income Protection, where the same checkbox IS default-ticked.
- **Evidence artifact(s):** probe `_probe-workability` output (2026-09-04); test-run screenshot `test-runs/personal-disability-workability-v1/2026-09-04T16-26-31/` (AC03b failure).
- **Environment:** BASE_URL https://outsystems-dev.asteronlife.co.nz, account hanno.coetzee+1123, 2026-09-04.
- **Reproducibility:** consistent across the probe run and the spec run.
- **Test encoding:** `personal-disability-workability-v1.spec.js` AC03b asserts the story's expected value (ticked) and is EXPECTED TO FAIL until the app default is corrected.

## Deferred

| AC(s) | Reason |
|---|---|
| AC09/AC09A/AC10 | Workability × Business Disability / Farmers Disability / Business Expenses conjunction errors need Business-policy disability covers on the same life — cross-policy (personal + business) state; encode with the Business-policy cover cluster. Workability↔M&L/IP exclusivity is verified as AC08. |

## Business Rule Corrections

None (AC03 discrepancy filed above, pending BA/dev confirmation). Note: the app's age messages read "…for Workability **cover** is 61/17". Verified max = min($10k, 75%/12 of income) = $9,375 at $150k (matches legacy DC-27).

## Notes — session instability + parallel run

Run in parallel with the Create-Business-Policy spec on a second account (`AUTH_STATE_FILENAME=state-b.json`) — no session conflict. AC13 initially failed because `commitWithoutTyping` timed out on the SI field at under-min-age (ANB 16); made best-effort (the min-age error surfaces on Apply regardless), re-confirmed pass in isolation.
