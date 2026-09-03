# Test: Personal Standalone Lumpsum TPD Cover — personal-standalone-tpd-cover-v1

> **Test file:** `personal-standalone-tpd-cover-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`) — 46.3 min
> **Source:** ACB-2927 user story ("Personal Standalone Lumpsum TPD Cover"), acceptance-criteria mode
> **Result:** 20/20 passing, 0 failing, 0 blocked

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present; 1+ selectable | New quote | Life/TPD/Trauma/Cancer/Acd. Death/Needlestick/Specific Injury all present; TPD activates | ✅ Pass | |
| 2 | AC03/AC12 | TPD exposes SI + Premium Structure + Definition (defaults + full lists) | Activate TPD | Structure [Stepped(def), Level to 65, Level to 70]; Definition [Own(def), Any, Modified] | ✅ Pass | Exact `toEqual` on both option lists |
| 3 | AC06 | Below-min-age error | ANB 16 | "minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17" | ✅ Pass | Negative side |
| 4 | AC06 | At-min-age accept (boundary) | ANB 17 (Modified) | No min-age error | ✅ Pass | At-boundary accept |
| 5 | AC07 | Stepped over-max-age error | ANB 66, Stepped | "maximum ... Stepped ... 65" | ✅ Pass | |
| 6 | AC07 | Stepped at-max-age accept (boundary) | ANB 65, Stepped | No max-age error | ✅ Pass | At-boundary accept |
| 7 | AC08 | Level to 65 over-max-age error | ANB 61, Level to 65 | "Level to 65 ... 60" | ✅ Pass | |
| 8 | AC08 | Level to 65 at-max-age accept (boundary) | ANB 60, Level to 65 | No max-age error | ✅ Pass | At-boundary accept |
| 9 | AC09 | Level to 70 over-max-age error | ANB 66, Level to 70 | "Level to 70 ... 65" | ✅ Pass | |
| 10 | AC09 | Level to 70 at-max-age accept (boundary) | ANB 65, Level to 70 | No max-age error | ✅ Pass | At-boundary accept |
| 11 | AC09A | Young ($250k) over-cap error | ANB 19, Modified, SI $250,001 | "Age Next Birthday 17 - 21 is $250,000" | ✅ Pass | Modified set so AC10 doesn't fire first |
| 12 | AC09A | Young cap at-boundary accept | ANB 19, Modified, SI $250,000 | No young-cap error | ✅ Pass | At-boundary accept |
| 13 | AC10 | Non-Modified at 17-21 → Modified-only error | ANB 19, Own def | "only eligible for Modified TPD" | ✅ Pass | Negative side |
| 14 | AC10 | Modified at 17-21 accepted | ANB 19, Modified def | No Modified-only error | ✅ Pass | Positive complement |
| 15 | AC11 | $5M over-cap error (ANB > 21) | ANB 40, SI $5,000,001 | "maximum total Sum Insured per life for TPD Cover is $5,000,000" | ✅ Pass | |
| 16 | AC11 | $5M cap at-boundary accept | ANB 40, SI $5,000,000 | No cap error | ✅ Pass | At-boundary accept |
| 17 | AC13 | Add/remove cover reflected | Add TPD $200k, then Remove | SI field present after add, absent after remove | ✅ Pass | Negative/absence side |
| 18 | AC14 | SI "?" tooltip discount bands | Activate TPD, click "?" | Bands $100,000-$249,999 / $250,000-$499,999 / $500k+ | ✅ Pass | Click-triggered tooltip |
| 19 | AC15 | Max 3 TPD → add button disabled | 3 TPD covers | TPD add button disabled | ✅ Pass | |
| 20 | AC16 | Mixed TPD definitions → error | TPD (Own) + TPD (Any) | "same TPD definition for TPD cover on the same policy" | ✅ Pass | Negative/cross-cover rule |

## Deferred

None — all 16 ACs (AC01–AC16; story numbering skips AC04/AC05) encoded and passing, each with positive + negative/absence + boundary-accept coverage where applicable, surfaced via `recordCheck`.

## Business Rule Corrections

None — the app matched the story's stated values and verbatim error messages on every AC.
