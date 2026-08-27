# Test: Lump Sum Covers Caps & Companion Rules — lump-sum-covers-caps-and-companion-rules-v1

> **Test file:** `lump-sum-covers-caps-and-companion-rules-v1.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~11 min
> **Source:** Reverse-engineering mode (24 assertions total, collapsed to 7 rows below)
> **Result:** 7/7 passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | LSC-10 | TPD $5M cap, exact boundary | 3 personas (35/M/AA, 55/F/B, 22/M/C), SI $5M vs $5,000,001 | No error vs cap error | ✅ Pass | |
| 2 | LSC-27 | Acd. Death $1M cap, exact boundary | 3 personas incl. age 70 (max valid age) | No error vs cap error | ✅ Pass | |
| 3 | LSC-19 | Major Trauma 300% cap (TRC < $25k) | Female 40 B, TRC $20k, MT $60,000 vs $60,001 | No error at exact 300%, error just over | ✅ Pass | |
| 4 | LSC-20 | $2M combined ceiling (TRC ≥ $25k) | Male 30 AA, TRC $25k, MT $1,975,000 vs $1,975,001 | No error at $2M total, ceiling error at $2,000,001 | ✅ Pass | |
| 5 | LSC-32 | Specific Injury companion requirement | 2 personas (35/M/AA/Employed, 50/F/B/Self-Employed), SI alone | Companion error on Apply | ✅ Pass | |
| 6 | LSC-17/23 | Cancer contributes to $2M ceiling | Male 35 AA, TRC $1M + Cancer $1M vs $1,000,001 | No error at $2M, ceiling error just over | ✅ Pass | |
| 7 | LSC-31b | Needlestick companion requirement | Male 35 AA, Needlestick $50k alone | Companion error on Apply | ✅ Pass | |

## Limitations (genuinely untestable / out of scope here)

| Rule ID | Why |
|---|---|
| — | TPD $250k cap at ANB 17-21 is covered in `personal-details-age-boundary-rules-v1`, not here |
| LSC-02 | Needlestick's OCC restriction was found obsolete during probing — it now activates for all OCCs; superseded, not a gap |
| — | Three-way combined cap (TRC + Major Trauma + Cancer simultaneously) not tested — only two-way combos confirmed individually |
