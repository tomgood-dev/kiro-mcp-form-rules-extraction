# Test: Personal Details — test-pd-v12

> **Test file:** `test-pd-v12.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~11.5 min
> **Source:** Reverse-engineering mode (32 assertions total, collapsed to 9 rows below)
> **Result:** 9/9 passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | PD-11 | Age range boundaries | Ages 10, 11, 75, 76 | Error outside 11–75, no error at either bound | ✅ Pass | |
| 2 | PD-28 | Life $50k cap, ANB < 17 | 3 personas (15/M/AA, 16/F/B, 12/M/C), SI $50,000 vs $50,001 | No error vs cap error | ✅ Pass | |
| 3 | PD-14 | TPD min-age error | 2 personas (15/M/AA, 16/F/B), activate TPD | Min-age error shown | ✅ Pass | |
| 4 | PD-29 | TPD $250k cap, ANB 17–21 | 3 personas (17/M/AA, 20/F/B, 21/M/C), SI $250,000 vs $250,001 | No error vs cap error | ✅ Pass | |
| 5 | PD-31 | Acd. Death max age 70 | Age 70 (max valid) vs 71, across 3 personas | No error at 70, error at 71 | ✅ Pass | |
| 6 | PD-28 | Independence from gender/OCC | 3 gender/OCC combos, age 15, SI $50,001 | Cap error regardless of persona | ✅ Pass | |
| 7 | PD-30 | TPD Modified-only, ANB 17–21 | Male 20 AA, TPD $200k, Definition = Own | Error referencing Modified TPD | ✅ Pass | |
| 8 | PD-31 | Needlestick max age 65 / Specific Injury max age 61 | Age 66 Needlestick, Age 62 Specific Injury | Max-age errors on each | ✅ Pass | |
| 9 | PD-15/16 | DOB ↔ Age bidirectional relationship | Set ANB, then set DOB, then override ANB | DOB clears on manual ANB; ANB auto-calcs from DOB; last write wins | ✅ Pass | |

## Limitations (genuinely untestable)

| Rule ID | Why |
|---|---|
| PD-17/18 | DOB edge cases (future dates, very old dates) are date-picker edge cases, not business logic — not tested here |
