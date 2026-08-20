# Test: Policy Structure & Kids Cover — pol-kid-v2

> **Test file:** `pol-kid-v2.spec.js`  
> **Execution time:** ~2 minutes  
> **Last verified:** 2026-08-20 (local Edge headless)  
> **Assertions:** 22 total

## Summary

This test validates the policy-level mutual exclusion between Inflation Adjustment and Premium Freeze, confirms Business policy creation and its distinct cover menu, and exhaustively tests Kids Cover rules including companion dependency, SI tier structure, DOB bounds, and the maximum kids limit.

## Test Structure

The test is divided into 6 parts:

1. **POL-05: Inflation/Freeze mutual exclusion** — 2 personas × both directions = 4 assertions
2. **POL-06 + POL-14: Business policy creation + cover menu** — creation + 7 expected covers + 4 excluded covers = 3 assertions
3. **KID-08: Kids companion dependency** — 2 personas = 2 assertions
4. **KID-07: SI tiers validation** — count, first, last, $10k step consistency = 4 assertions + 15 step checks
5. **KID-05: DOB bounds** — min/max year validation = 2 assertions
6. **KID-11 + KID-01: Max kids + dropdown + multiple sections** — count, range, 3-kid sections = 3 assertions

## Part 1: Inflation/Freeze Mutual Exclusion (POL-05)

| Persona | Direction | Expected |
|---------|-----------|----------|
| Male, 35, AA | Check Freeze → Inflation unchecks | ✓ Silent uncheck |
| Male, 35, AA | Check Inflation → Freeze unchecks | ✓ Silent uncheck |
| Female, 55, B | Check Freeze → Inflation unchecks | ✓ Silent uncheck |
| Female, 55, B | Check Inflation → Freeze unchecks | ✓ Silent uncheck |

**What this proves:** The mutual exclusion works in both directions and isn't persona-specific. No error message is shown — it's a silent toggle.

## Part 2: Business Policy (POL-06, POL-14)

| Assertion | Expected |
|-----------|----------|
| Business policy created | "Business 1" appears in policy list |
| Business covers present | Life, TPD, Trauma, Specific Injury, Business Expenses, Business Disability, Farmers Disability |
| Personal-only covers absent | Cancer, Acd. Death, Income Protection, Workability NOT in Business menu |

**What this proves:** The cover menu is genuinely different between Personal and Business policy types — it's not just a label change.

## Part 3: Kids Companion Dependency (KID-08)

| Persona | Setup | Action | Expected |
|---------|-------|--------|----------|
| Male, 35, AA | 1 kid, no covers | Click Apply | ✓ "add at least one Personal Insurance Cover" |
| Female, 50, B | 1 kid, no covers | Click Apply | ✓ Same error |

**What this proves:** The dependency is enforced regardless of persona.

## Part 4: Kids SI Tiers (KID-07)

| Check | Expected | What This Tests |
|-------|----------|-----------------|
| Option count | 16 | Exactly $50k to $200k in $10k steps |
| First option | "$50,000 (Free)" | Free tier confirmed |
| Last option | "$200,000" | Maximum tier confirmed |
| Step consistency | Each option = previous + $10,000 | No gaps or irregular steps |

**What this proves:** The tier structure is exactly as documented — 16 options, consistent $10k increments, "Free" label on the first tier.

## Part 5: Kids DOB Bounds (KID-05)

| Field Property | Expected | What This Tests |
|----------------|----------|-----------------|
| `max` | 2026 (current year) | Kid can't be born in the future |
| `min` | ~2005 (21 years ago) | Rolling 21-year window |

**What this proves:** The DOB field enforces age limits via HTML5 min/max attributes — a ~21-year rolling window.

## Part 6: Number of Kids (KID-11, KID-01)

| Check | Expected | What This Tests |
|-------|----------|-----------------|
| Dropdown option count | 10 (0-9) | Max 9 kids enforced at UI level |
| First/last options | "0" / "9" | Range confirmed |
| Set to 3 | "Kid 1", "Kid 2", "Kid 3" sections appear | Multiple kids render correctly |

**What this proves:** The dropdown limits to 9 kids, and selecting N renders exactly N kid sections.

## Personas Used (Summary)

| # | Age | Gender | OCC | Used In |
|---|-----|--------|-----|---------|
| 1 | 35 | Male | AA | POL-05, POL-06, KID-07, KID-05, KID-11, KID-08 |
| 2 | 55 | Female | B | POL-05, KID-08 |

## Limitations

- **KID-10 (premium only charged above $50k Free tier)**: Would require comparing premium amounts before/after changing SI tier — complex to assert reliably without a known premium baseline. Genuine system observation constraint.
- **POL-08 (policy removal)**: Not tested — removing a policy has no confirmation dialog, and verifying it was removed is straightforward but adds minimal regression value.
