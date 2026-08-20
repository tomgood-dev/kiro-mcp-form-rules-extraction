# Test: Disability Covers — dc-v4

> **Test file:** `dc-v4.spec.js`  
> **Execution time:** ~11 minutes  
> **Last verified:** 2026-08-20 (local Edge headless)  
> **Assertions:** 34 total

## Summary

This test exhaustively validates the income-based benefit cap formulas for all Personal Disability covers across 7 income levels, confirms formula independence from age/gender/occupation/employment, verifies mutual exclusivity, and tests the Agreed Value variant (progressive formula), IP Loss of Earnings variant, and Monthly Mortgage cover type.

## Test Structure

The test is divided into 6 parts:

1. **Income level sweep** — 7 incomes × 3 covers = 21 assertions
2. **Independence checks** — 6 variable flips = 6 assertions
3. **Exclusivity (DC-28)** — Workability + M&L = 1 assertion
4. **M&L Agreed Value variant (DC-15b)** — 3 income levels = 3 assertions
5. **IP Loss of Earnings (DC-22b)** — 2 income levels = 2 assertions
6. **Monthly Mortgage cover type** — prompt validation = 1 assertion

## Part 1: Income Level Sweep

Base persona: Age 35, Male, AA, Employed. Income re-entered before each cover activation.

| Income | M&L (AVP) | IP | Workability | What This Tests |
|--------|-----------|-----|-------------|-----------------|
| $100k | $3,750 | $6,250 | $6,250 | All tier 1, below caps |
| $150k | $5,625 | $9,375 | $9,375 | Standard tier 1 |
| $160k | $6,000 | $10,000 | $10,000 | Workability cap boundary |
| $200k | $7,500 | $12,500 | $10,000 | M&L cap + Work capped |
| $320k | $7,500 | $20,000 | $10,000 | IP tier 1 boundary |
| $400k | $7,500 | $23,333 | $10,000 | IP tier 2 |
| $700k | $7,500 | $30,000 | $10,000 | All at caps |

### Formulas

| Cover | Formula | Hard Cap |
|-------|---------|----------|
| M&L (Agreed Value Plus) | 45% × income / 12 | $7,500/month |
| Income Protection | 75% first $320k + 50% $320-560k + 20% above $560k, all /12 | $30,000/month |
| Workability | 75% × income / 12 | $10,000/month |

## Part 2: Independence Checks

Income held at $150k. IP expected = $9,375 regardless.

| Variable | Value | Expected IP | Proves |
|----------|-------|-------------|--------|
| Gender | Female | $9,375 | Gender-independent |
| Age | 25 | $9,375 | Age-independent |
| Age | 65 | $9,375 | Age-independent (older) |
| OCC | B | $9,375 | OCC-independent |
| OCC | C | $9,375 | OCC-independent |
| Employment | Self-Employed | $9,375 | Employment-independent |

## Part 3: Exclusivity (DC-28)

| Persona | Setup | Expected |
|---------|-------|----------|
| Male, 50, B, Employed, $120k | M&L committed + Workability committed | Error: "not available to be taken in conjunction" |

## Part 4: M&L Agreed Value Variant (DC-15b)

The Agreed Value offset uses a progressive (tiered) formula — not a flat percentage like Agreed Value Plus.

| Income | Observed Cap | Error Text Match |
|--------|-------------|-----------------|
| $100k | $5,023 | ✓ "maximum...Mortgage...5,023" |
| $150k | $7,124 | ✓ "maximum...Mortgage...7,124" |
| $200k | $9,218 | ✓ "maximum...Mortgage...9,218" |

**What this proves:** The Agreed Value variant has genuinely different caps from Agreed Value Plus ($3,750/$5,625/$7,500 at the same incomes). A developer changing the offset formula would break these assertions.

## Part 5: IP Loss of Earnings (DC-22b)

Same caps as Loss of Earnings Plus — only the auto-default UX differs.

| Income | Expected Cap | Proves |
|--------|-------------|--------|
| $100k | $6,250 | Same as Plus |
| $150k | $9,375 | Same as Plus |

**What this proves:** The server-side cap formula is shared between both IP variants. If a developer accidentally split the formulas, this would catch it.

## Part 6: Monthly Mortgage Cover Type

| Setup | Action | Expected |
|-------|--------|----------|
| M&L activated, Cover Type = "Monthly Mortgage" | Enter $5,000 benefit | Error: "Please enter the monthly mortgage repayment amount" |

**What this proves:** Monthly Mortgage requires a separate input (mortgage repayment amount) before a benefit can be validated — it's not purely income-derived.

## Findings That Corrected Business Rules

| Finding | Original Doc | Correction |
|---------|-------------|------------|
| DC-15 M&L hard cap | No cap mentioned | $7,500/month cap (= 45% × $200k / 12) |
| DC-15b Agreed Value | Not documented | Progressive formula with observed caps: $5,023/$7,124/$9,218 at $100k/$150k/$200k |
| DC-22b Loss of Earnings | Not documented | Same caps as Plus, only auto-default behavior differs |

## Limitations

- **IP Tier 3 (20% above $560k)**: Genuinely untestable — the $30,000 hard cap masks it at all income levels where Tier 3 would apply.
- **M&L Agreed Value exact formula**: The progressive tiered formula cannot be fully derived from black-box testing. Observed values are asserted, but the underlying algorithm (actuarial table vs. algebraic formula) is unknown.
