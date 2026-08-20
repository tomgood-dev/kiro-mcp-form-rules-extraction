# Test: Policy Structure & Kids Cover — pol-kid-v3

> **Test file:** `pol-kid-v3.spec.js`
> **Last run:** 2026-08-20 (local Edge headless) — ~2 min
> **Source:** Reverse-engineering mode (22 assertions total, collapsed to 6 rows below)
> **Result:** 6/6 passing

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | POL-05 | Inflation/Freeze mutual exclusion, both directions | 2 personas (35/M/AA, 55/F/B), check each toggle | Other toggle silently unchecks | ✅ Pass | |
| 2 | POL-06/POL-14 | Business policy creation + cover menu | Create Business policy | "Business 1" appears; 7 covers present, 4 Personal-only covers absent | ✅ Pass | |
| 3 | KID-08 | Kids companion dependency | 2 personas, 1 kid + no covers, click Apply | Error: "add at least one Personal Insurance Cover" | ✅ Pass | |
| 4 | KID-07 | SI tier structure | Read SI dropdown options | 16 options, $50k (Free) – $200k, exact $10k steps | ✅ Pass | |
| 5 | KID-05 | DOB field bounds | Read DOB min/max attrs | max = current year, min = ~21 years ago | ✅ Pass | |
| 6 | KID-11/KID-01 | Max kids + dropdown range | Read dropdown, set to 3 | 10 options (0–9); setting 3 renders "Kid 1/2/3" sections | ✅ Pass | |

## Limitations (genuinely untestable)

| Rule ID | Why |
|---|---|
| KID-10 | Premium-only-charged-above-$50k-free-tier would require comparing premiums before/after a tier change with no known reliable baseline |
| POL-08 | Policy removal not tested — no confirmation dialog, minimal regression value |
