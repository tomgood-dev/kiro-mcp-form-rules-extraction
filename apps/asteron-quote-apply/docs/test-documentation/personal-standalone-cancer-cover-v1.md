# Test: Personal Lumpsum Standalone Cancer Cover — personal-standalone-cancer-cover-v1

> **Test file:** `personal-standalone-cancer-cover-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`) — 47.9 min
> **Source:** ACB-2928 user story ("Personal Lumpsum Standalone Cancer Cover"), acceptance-criteria mode
> **Result:** 20/20 passing, 0 failing, 0 blocked

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present; 1+ selectable | New quote | 7 covers present; Cancer activates | ✅ Pass | |
| 2 | AC03 | Cancer exposes SI + Premium Structure (default + list) | Activate Cancer | Structure [Stepped(def), Level to 65, Level to 70] | ✅ Pass | Exact `toEqual` on options |
| 3 | AC04 | Stepped over-max-age error | ANB 66, Stepped | "Stepped premium Cancer Cover is 65" | ✅ Pass | |
| 4 | AC04 | Stepped at-max-age accept | ANB 65, Stepped | No max-age error | ✅ Pass | At-boundary accept |
| 5 | AC05 | Level to 65 over-max-age error | ANB 61, Level to 65 | "Level to 65 Cancer Cover is 60" | ✅ Pass | |
| 6 | AC05 | Level to 65 at-max-age accept | ANB 60, Level to 65 | No max-age error | ✅ Pass | At-boundary accept |
| 7 | AC06 | Level to 70 over-max-age error | ANB 66, Level to 70 | "Level to 70 Cancer Cover is 65" | ✅ Pass | |
| 8 | AC06 | Level to 70 at-max-age accept | ANB 65, Level to 70 | No max-age error | ✅ Pass | At-boundary accept |
| 9 | AC07 | Standalone Cancer 17-21 over-$250k cap | ANB 19, SI $250,001 | Combined $250k cap error | ✅ Pass | |
| 10 | AC07 | 17-21 cap at-boundary accept | ANB 19, SI $250,000 | No young-cap error | ✅ Pass | At-boundary accept |
| 11 | AC08 | Trauma + Cancer 17-21 combined > $250k | Trauma $200k + Cancer $100k, ANB 19 | Combined $250k cap error | ✅ Pass | Combined; $300k arithmetic |
| 12 | AC09 | Cancer 22-65 over-$2M cap | ANB 40, SI $2,000,001 | $2M cap error | ✅ Pass | |
| 13 | AC09 | $2M cap at-boundary accept | ANB 40, SI $2,000,000 | No cap error | ✅ Pass | At-boundary accept |
| 14 | AC10 | Cancer < $10k min-SI error | ANB 40, SI $9,000 | "minimum Cancer Cover sum insured is $10,000" | ✅ Pass | |
| 15 | AC10 | Min-SI at-boundary accept | ANB 40, SI $10,000 | No min-SI error | ✅ Pass | At-boundary accept |
| 16 | AC11 | Trauma + Cancer 22-65 combined > $2M | Trauma $1.5M + Cancer $600k | $2M cap error | ✅ Pass | Combined; $2.1M arithmetic |
| 17 | AC12 | Trauma + Major Trauma + Cancer combined > $2M | $1.5M + $300k + $600k | $2M cap error | ✅ Pass | Combined; $2.4M arithmetic |
| 18 | AC13 | Max 3 Cancer → +Cancer disabled; re-enables on remove | 3 Cancer, then remove 1 | Disabled at 3, enabled after remove | ✅ Pass | Negative/absence + re-enable |
| 19 | AC14 | 2nd/3rd Cancer default to next structure | Add 3 Cancer covers | Defaults Stepped / Level to 65 / Level to 70; still changeable | ✅ Pass | Value-level progression (probe-confirmed) |
| 20 | AC15 | SI "?" tooltip discount bands | Activate Cancer, click "?" | Bands $100,000-$249,999 / $250,000+ | ✅ Pass | Click-triggered tooltip |

## Deferred

None — all 15 ACs (AC01–AC15) encoded and passing, each with positive + negative/absence + boundary-accept + value-level coverage where applicable, surfaced via `recordCheck`.

## Business Rule Corrections

None — the app matched the story's stated values and verbatim error messages on every AC. (Note: for AC11/AC12 the app additionally surfaces the "Major Trauma, including Cancer Cover" variant of the $2M message alongside the base "including Cancer Cover" message; both are the same $2,000,000 combined cap.)
