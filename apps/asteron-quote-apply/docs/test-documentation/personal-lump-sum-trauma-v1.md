# Test: Personal Lump Sum Trauma Cover — personal-lump-sum-trauma-v1

> **Test file:** `personal-lump-sum-trauma-v1.spec.js`
> **Last run:** 2026-08-28 (local Edge headless) — 28 min, 24 tests, 2 workers
> **Source:** ACB-2926 user story, acceptance-criteria mode. Generated from the story using
> accumulated app context (helpers + LSC- business rules); sub-cover selectors resolved via
> `probe-trauma-subcovers.js`.
> **Result:** 24/24 passing (AC12 re-verified individually after a test-data fix)

## Results

| # | AC | What's Tested | Expected | Status |
|---|---|---|---|---|
| 1 | AC01/AC02 | All 7 lump sum covers present, selectable | 7 cover buttons present | ✅ Pass |
| 2 | AC03 | Trauma SI + Premium Structure + sub-covers | SI; {Stepped default, Level to 65, Level to 70}; Major Trauma + TPD on Trauma | ✅ Pass |
| 3 | AC04 | Major Trauma inherits structure + own SI | Own SI field; structure = Stepped (mirrors Trauma) | ✅ Pass |
| 4 | AC05 | TPD on Trauma SI + structure + Definition | Definition dropdown {Own default, Any} | ✅ Pass |
| 5 | AC06 | Trauma ANB < 17 | "minimum Age Next Birthday for Trauma Recovery Cover is 17" | ✅ Pass |
| 6 | AC07 | Trauma Stepped ANB > 70 | "maximum ... Stepped Trauma Recovery Cover is 70" | ✅ Pass |
| 7 | AC08 | Trauma Level to 65 ANB > 60 | "Level to 65 Trauma Recovery cover is 60" | ✅ Pass |
| 8 | AC09 | Trauma Level to 70 ANB > 65 | "Level to 70 Trauma Recovery cover is 65" | ✅ Pass |
| 9 | AC10 | Trauma ANB 17-21 SI > $250k | "Age Next Birthday 17 - 21 is $250,000" | ✅ Pass |
| 10 | AC11 | Trauma + Cancer ANB 17-21 combined > $250k | $250k young combined cap | ✅ Pass |
| 11 | AC12 | Trauma + Major Trauma ANB 17-21 combined > $250k | $250k young combined cap | ✅ Pass |
| 12 | AC14 | Trauma ANB 22-70 SI > $2M | "...including Cancer Cover, is $2,000,000" | ✅ Pass |
| 13 | AC15 | Trauma + Cancer ANB 22-70 combined > $2M | $2M combined cap | ✅ Pass |
| 14 | AC16 | Trauma + Major Trauma ANB 22-70 combined > $2M | $2M combined cap | ✅ Pass |
| 15 | AC18 | Max 3 Trauma covers | +Trauma button disabled after 3 | ✅ Pass |
| 16 | AC19 | Add/remove cover reflects premium | premium appears then clears | ✅ Pass |
| 17 | AC20 | Reinstatement vs Continuous mutual exclusion | selecting one disables the other | ✅ Pass |
| 18 | AC21 | Trauma SI < $5,000 | "minimum Trauma Cover sum insured is $5,000" | ✅ Pass |
| 19 | AC22 | Major Trauma SI < $5,000 | "minimum Major Trauma Benefit sum insured is $5,000" | ✅ Pass |
| 20 | AC23 | Major Trauma > 3x Trauma (TRC < $25k) | "maximum Sum Insured for Major Trauma Benefit..." | ✅ Pass |
| 21 | AC24 | Sum Insured "?" tooltip | Trauma discount-band text present | ✅ Pass |
| 22 | AC25 | TPD on Trauma ANB < 17 | "minimum Age Next Birthday for TPD on Trauma is 17" | ✅ Pass |
| 23 | AC26 | TPD on Trauma ANB > 60 | "maximum Age Next Birthday for TPD on Trauma is 60" | ✅ Pass |
| 24 | AC27 | ANB 17-21 + TPD on Trauma non-Modified | "only eligible for Modified TPD" | ✅ Pass |

## Not yet encoded

| AC(s) | Reason |
|---|---|
| AC13, AC17 | Triple-cover variants (Trauma + Cancer + Major Trauma) with a distinct message ("Trauma Recovery Cover, **Major Trauma,** including Cancer Cover..."). Deferred to avoid flaky 3-cover SI-index handling in one test — straightforward to add with careful indexing. Not blocked; queued. |

## Probe evidence

Sub-cover / optional-benefit selectors resolved via `probes/probe-trauma-subcovers.js`:
Early Trauma / Trauma Reinstatement / Continuous Trauma checkboxes (label-fingerprinted),
Major Trauma structure locked to Stepped, TPD on Trauma Definition = {Own, Any} (no "Modified"
option exists — relevant to AC27). Promoted into reusable `quote-helpers.js` helpers.
