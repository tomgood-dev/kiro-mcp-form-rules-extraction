# Test: Disability Covers Formulas & Caps — disability-covers-formulas-and-caps-v1

> **Test file:** `disability-covers-formulas-and-caps-v1.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~11 min
> **Source:** Reverse-engineering mode (34 assertions total, collapsed to 8 rows below)
> **Result:** 8/8 passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | DC-15 | M&L (Agreed Value Plus) formula | 7 income levels, $100k–$700k | 45% × income/12, capped $7,500/mo | ✅ Pass | |
| 2 | DC-21 | IP 3-tier progressive formula | 7 income levels, $100k–$700k | 75%/50%/20% tiers, capped $30,000/mo | ✅ Pass | |
| 3 | DC-27 | Workability formula | 7 income levels, $100k–$700k | 75% × income/12, capped $10,000/mo | ✅ Pass | |
| 4 | DC-21 | Independence from gender/age/OCC/employment | 6 variable flips, income held at $150k | IP stays $9,375 regardless | ✅ Pass | |
| 5 | DC-28 | Workability + M&L exclusivity | Male 50 B Employed $120k, both covers | Error: "not available to be taken in conjunction" | ✅ Pass | |
| 6 | DC-15b | M&L Agreed Value variant (progressive formula) | 3 income levels, $100k/$150k/$200k | Caps $5,023/$7,124/$9,218 | ✅ Pass | New finding — not previously documented |
| 7 | DC-22b | IP Loss of Earnings variant | 2 income levels, $100k/$150k | Same caps as Loss of Earnings Plus | ✅ Pass | |
| 8 | — | M&L Monthly Mortgage cover type | Cover type = Monthly Mortgage, enter $5,000 | Error: "enter monthly mortgage repayment" | ✅ Pass | |

## Limitations (genuinely untestable)

| Rule ID | Why |
|---|---|
| DC-21 (Tier 3) | $30,000 hard cap masks the 20%-above-$560k tier at every income level where it would apply |
| DC-15b | Underlying formula (actuarial table vs. algebraic) can't be derived from black-box testing — observed cap values are asserted instead |

## Business Rule Corrections

| Rule ID | Was | Now |
|---|---|---|
| DC-15 | No cap mentioned | $7,500/month cap |
| DC-15b | Not documented | Progressive formula, caps $5,023/$7,124/$9,218 at $100k/$150k/$200k |
| DC-22b | Not documented | Same caps as the Plus variant |
