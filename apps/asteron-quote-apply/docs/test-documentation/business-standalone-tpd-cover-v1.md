# Test: Business Policy Lumpsum Standalone TPD Cover — business-standalone-tpd-cover-v1

> **Test file:** `business-standalone-tpd-cover-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account A) — run 09-29 (58.6m)
> **Source:** ACB-2940 user story ("Business Policy Lumpsum Standalone TPD Cover"), acceptance-criteria mode
> **Result:** 19/19 active passing, 1 deferred (AC16 — sub-cover, belongs with Business Life/Trauma). Environment: QA.

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | 4 business lump sum covers present; TPD selectable | Business, new quote | Life/TPD/Trauma/Specific Injury present; TPD activates | ✅ Pass | |
| 2 | AC03 | SI + Structure + Definition + Business Security defaults | Activate TPD | Structure [Stepped(def)/65/70]; Definition [Own(def)/Any/Modified]; Business Security present, unticked | ✅ Pass | Exact `toEqual` on option sets |
| 3 | AC04 | Below-min-age error | ANB 16 | "minimum ... Standalone TPD Cover is 17" | ✅ Pass | |
| 4 | AC04 | At-min-age accept (Modified) | ANB 17 | no min-age error | ✅ Pass | At-boundary accept |
| 5 | AC05 | Stepped over-max-age error | ANB 66, Stepped | "Stepped ... 65" | ✅ Pass | |
| 6 | AC05 | Stepped at-max-age accept | ANB 65, Stepped | no max-age error | ✅ Pass | At-boundary accept |
| 7 | AC06 | Level to 65 over-max-age error | ANB 61, Level to 65 | "Level to 65 ... 60" | ✅ Pass | |
| 8 | AC07 | Level to 70 over-max-age error | ANB 66, Level to 70 | "Level to 70 ... 65" | ✅ Pass | |
| 9 | AC08 | Young ($250k) over-cap error | ANB 19, Modified, SI $250,001 | "17 - 21 is $250,000" | ✅ Pass | Modified so AC09 doesn't fire first |
| 10 | AC08 | Young cap at-boundary accept | ANB 19, Modified, SI $250,000 | no young-cap error | ✅ Pass | At-boundary accept |
| 11 | AC09 | Non-Modified at 17-21 → Modified-only error | ANB 19, Own | "only eligible for Modified TPD" | ✅ Pass | Negative side |
| 12 | AC10 | $5M over-cap error | ANB 40, SI $5,000,001 | "TPD Cover is $5,000,000" | ✅ Pass | |
| 13 | AC10 | $5M cap at-boundary accept | ANB 40, SI $5,000,000 | no cap error | ✅ Pass | At-boundary accept |
| 14 | AC11/AC14 | Multi-TPD default-structure progression + max 3 | 3 TPD covers | defaults Stepped/Level to 65/Level to 70; +TPD disabled after 3 | ✅ Pass | Value-level + disable |
| 15 | AC15 | Mismatched TPD definitions → error | TPD Own + TPD Any | "same TPD definition ... same policy" | ✅ Pass | Cross-cover rule |
| 16 | AC17 | Business Security + ANB > 56 → error | ANB 57, Business Security ticked | "Business Security is 56" | ✅ Pass | Business-only AC |
| 17 | AC17 | Business Security at ANB 56 accept | ANB 56, Business Security ticked | no error | ✅ Pass | At-boundary accept |
| 18 | AC12 | Add/remove reflected | add TPD, then remove | present then absent | ✅ Pass | Negative/absence |
| 19 | AC13 | "?" tooltips (discount bands + Business Security) | activate TPD | phrases present | ✅ Pass | DOM/title search |

## Deferred

| AC(s) | Reason |
|---|---|
| AC16 | Acc TPD / TPD on Trauma are sub-covers under Life/Trauma, not standalone TPD — belongs with the Business Life (ACB-2638) / Business Trauma (ACB-2939) specs where those sub-covers live. The standalone-TPD Modified-only rule is covered by AC09 here. |

## Business Rule Corrections

None — the QA app matched the story's stated values and verbatim messages on every AC (identical caps/rules to the personal Standalone TPD, plus the Business Security age-56 rule).

## Notes

First Business-policy cover spec, and the first spec generated + run entirely on **QA** with credentials from the gitignored `.env`. Business tab opened via the "Business" button. Mirrors the personal Standalone TPD spec (ACB-2927) with the Business Security additions.
