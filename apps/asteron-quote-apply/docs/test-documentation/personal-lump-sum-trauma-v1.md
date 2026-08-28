# Test: Personal Lump Sum Trauma Cover — personal-lump-sum-trauma-v1

> **Test file:** `personal-lump-sum-trauma-v1.spec.js`
> **Last run:** 2026-08-28 (local Edge headless) — 18 min, 15 tests, 2 workers
> **Source:** ACB-2926 user story, acceptance-criteria mode. Generated from the story using
> accumulated app context (helpers + LSC- business rules) — no fresh exploration.
> **Result:** 15/15 passing

## Results

| # | AC | What's Tested | Expected | Status |
|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present, selectable | Life/TPD/Trauma/Cancer/Acd. Death/Needlestick/Specific Injury buttons present | ✅ Pass |
| 2 | AC03 | Trauma SI + Premium Structure + sub-covers | SI present; structure {Stepped default, Level to 65, Level to 70}; Major Trauma + TPD on Trauma present | ✅ Pass |
| 3 | AC06 | Trauma ANB < 17 | "minimum Age Next Birthday for Trauma Recovery Cover is 17" | ✅ Pass |
| 4 | AC07 | Trauma Stepped ANB > 70 | "maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70" | ✅ Pass |
| 5 | AC08 | Trauma Level to 65 ANB > 60 | "Level to 65 Trauma Recovery cover is 60" | ✅ Pass |
| 6 | AC09 | Trauma Level to 70 ANB > 65 | "Level to 70 Trauma Recovery cover is 65" | ✅ Pass |
| 7 | AC10 | Trauma ANB 17-21 SI > $250k | "Age Next Birthday 17 - 21 is $250,000" | ✅ Pass |
| 8 | AC14 | Trauma ANB 22-70 SI > $2M | "Trauma Recovery Cover, including Cancer Cover, is $2,000,000" | ✅ Pass |
| 9 | AC21 | Trauma SI < $5,000 | "minimum Trauma Cover sum insured is $5,000" | ✅ Pass |
| 10 | AC23 | Major Trauma > 3x Trauma (TRC < $25k) | "maximum Sum Insured for Major Trauma Benefit..." | ✅ Pass |
| 11 | AC22 | Major Trauma SI < $5,000 | "minimum Major Trauma Benefit sum insured is $5,000" | ✅ Pass |
| 12 | AC18 | Max 3 Trauma covers | +Trauma button disabled after 3 | ✅ Pass |
| 13 | AC25 | TPD on Trauma ANB < 17 | "minimum Age Next Birthday for TPD on Trauma is 17" | ✅ Pass |
| 14 | AC26 | TPD on Trauma ANB > 60 | "maximum Age Next Birthday for TPD on Trauma is 60" | ✅ Pass |
| 15 | AC19 | Add/remove cover reflects premium | premium appears then clears | ✅ Pass |

## Not yet encoded (per "no deferring out of caution" — to probe + write next)

| AC(s) | What it needs |
|---|---|
| AC04 | Major Trauma inherits SI + Premium Structure from Trauma — verify sub-cover field wiring |
| AC05 | TPD on Trauma: SI = Trauma, structure = Trauma, Definition {Own default, Any} — verify selectors |
| AC11–AC13 | Trauma + Cancer / + Major Trauma combined $250k young cap variants — activate multiple covers |
| AC15–AC17 | Same combined caps at $2M (ANB 22-70) — variants of AC14 |
| AC20 | Trauma Reinstatement vs Continuous Trauma mutual exclusion — probe checkbox selectors |
| AC24 | Tooltip "?" icons show correct text — probe tooltip mechanism |
| AC27 | ANB 17-21 + TPD on Trauma + non-Modified definition → "only eligible for Modified TPD" |

*(None deferred out of caution — the above are queued for probe-then-write; the 15 encoded were
the ones mapping directly to known helpers/patterns.)*
