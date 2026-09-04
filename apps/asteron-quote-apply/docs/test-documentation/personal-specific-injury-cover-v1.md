# Test: Personal Lumpsum Specific Injury Cover — personal-specific-injury-cover-v1

> **Test file:** `personal-specific-injury-cover-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account B) — run 13-18-52 (16/17) + AC01/AC02 isolated re-run 14-11-38
> **Source:** ACB-2932 user story ("Personal Lumpsum Specific Injury Cover"), acceptance-criteria mode
> **Result:** 17/17 passing (16 in the full run; AC01/AC02 confirmed in an isolated re-run after a session-death casualty)

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present | New quote | 7 covers present | ✅ Pass | Isolated re-run (session casualty in full run) |
| 2 | AC03 | SI entry + Premium Structure greyed/Stepped | Companion Life + Specific Injury | SI field present; Structure Stepped AND disabled | ✅ Pass | SI is a calc-mask input (index 1) |
| 3 | AC04 | Specific Injury alone → companion-required error | Specific Injury, no companion | "requires one of the following covers: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability" | ✅ Pass | Negative side |
| 4 | AC05 | Combined SI > $5,000 → max-SI error | SI $5,001 | "maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000" | ✅ Pass | |
| 5 | AC05 | $5,000 at-boundary accept | SI $5,000 | No max-SI error | ✅ Pass | At-boundary accept |
| 6 | AC10 | SI < $500 → min-SI error | SI $400 | "minimum Specific Injury Lump Sum sum insured is $500" | ✅ Pass | |
| 7 | AC10 | $500 at-boundary accept | SI $500 | No min-SI error | ✅ Pass | At-boundary accept |
| 8 | AC06 | Below-min-age error | ANB 16 | "minimum Age Next Birthday for Specific Injury cover is 17" | ✅ Pass | |
| 9 | AC06 | At-min-age accept (boundary) | ANB 17 | No min-age error | ✅ Pass | At-boundary accept |
| 10 | AC07 | Over-max-age error | ANB 62 | "maximum Age Next Birthday for Specific Injury cover is 61" | ✅ Pass | |
| 11 | AC07 | At-max-age accept (boundary) | ANB 61 | No max-age error | ✅ Pass | At-boundary accept |
| 12 | AC08 | Add/remove cover reflected | Add SI $1,000, then Remove | 2 SI inputs after add, 1 after remove | ✅ Pass | Negative/absence side |
| 13 | AC09 | Max 1 Specific Injury — disabled after 1 | Life + Specific Injury | +Specific Injury disabled | ✅ Pass | |
| 14 | AC12 | Sub-threshold companion → eligibility error | Life $50k (< $100k), Specific Injury | AC12 eligibility-threshold error | ✅ Pass | Complex multi-threshold rule (negative side) |
| 15 | AC12 | At $100k Life threshold accepted | Life $100k exactly | No eligibility error | ✅ Pass | At-boundary accept |
| 16 | AC11 | "?" tooltip support-benefit text | Life + Specific Injury | tooltip mentions "Specific injury support benefit" + "multiple of the sum insured" | ✅ Pass | Robust title/body search (no click) |
| 17 | AC13 | MLC Specific Injury Support Benefit greyed out | MLC + Specific Injury | the MLC sub-benefit control is present AND disabled | ✅ Pass | Cross-cover interaction |

## Deferred

None — all 13 ACs (AC01–AC13) encoded and passing, each with positive + negative/absence + boundary-accept + value-level coverage where applicable, surfaced via `recordCheck`.

## Notes — session instability + parallel run

Run in parallel with the Needlestick spec using a second account (`AUTH_STATE_FILENAME=state-b.json`) —
the two sessions did not conflict. In the full run AC01/AC02 was a session-death casualty (browser
closed at the first test, documented single-session instability); it passed on an isolated re-run
(14-11-38). AC11 was hardened to search the DOM/`title` attributes directly rather than racing a
click-triggered popover.

## Business Rule Corrections

None — the app matched the story's stated values and verbatim error messages on every AC, including the complex AC12 eligibility thresholds and the AC13 MLC interaction.
