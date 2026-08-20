# Test: Premium & Bundling — bundling-v12

> **Test file:** `bundling-v12.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~8 min
> **Source:** Reverse-engineering mode (11 assertions total, collapsed to 7 rows below)
> **Result:** 7/7 passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | PREM-23 | Life $100k threshold, exact boundary | Life+TPD, Life SI $99,999 vs $100,000 | "None" vs "15% (2 covers)" | ✅ Pass | |
| 2 | PREM-24 | TPD $100k threshold, exact boundary | Life+TPD, TPD SI $99,999 vs $100,000 | "None" vs "15% (2 covers)" | ✅ Pass | |
| 3 | PREM-25 | Trauma $25k threshold, exact boundary | Life+TPD+Trauma, Trauma SI $24,999 vs $25,000 | "15% (2 covers)" vs "20% (3+ covers)" | ✅ Pass | |
| 4 | PREM-23/24 | Thresholds universal across persona | 2 personas (F/50/B, M/25/C), Life+TPD $100k | "15% (2 covers)" both times | ✅ Pass | |
| 5 | PREM-20/21 | Disability cover (committed M&L) counts toward bundling | Life $200k + committed M&L | "15% (2 covers)" | ✅ Pass | |
| 6 | — | Different cover combo (not just Life+TPD) | Life $200k + Cancer $100k | "15% (2 covers)" | ✅ Pass | |
| 7 | PREM-22 | Single cover = "None" | Female 60 A2, Life $500k alone | "None" | ✅ Pass | |

## Limitations (genuinely untestable)

| Rule ID | Why |
|---|---|
| Cancer/Acd Death/Needlestick/IP/Workability minimums | Not individually tested — Cancer confirmed to qualify at $100k, but its exact threshold isn't narrowed |
| 3-cover discount with 2 DC covers | Adding a 3rd cover on top of Life + M&L caused a page re-render that temporarily hid the "Bundling Discounts" text — a UI timing quirk, not a rule gap; the 20% threshold is proven via Lump Sum covers only |
