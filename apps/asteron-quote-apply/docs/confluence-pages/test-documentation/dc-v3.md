# Test: Disability Covers — dc-v3

> **Test file:** `dc-v3.spec.js`  
> **Execution time:** ~7 minutes  
> **Last verified:** 2026-08-19 (OutSystems Test Console + local Edge headless)  
> **Assertions:** 28 total

## Summary

This test validates the income-based benefit cap formulas for the three Personal Disability covers (Mortgage & Living, Income Protection, Workability), confirms the formulas are independent of age/gender/occupation/employment status, and verifies the mutual exclusivity rule between Workability and Mortgage & Living.

## Test Structure

The test is divided into 3 parts:

1. **Income level sweep** — 7 income levels × 3 covers = 21 formula assertions
2. **Independence checks** — same income, vary one variable at a time = 6 assertions
3. **Exclusivity** — Workability + M&L on a different persona = 1 assertion

## Part 1: Income Level Sweep

Base persona: Age 35, Male, AA, Employed. Income changes for each row.

| Income | M&L Expected | IP Expected | Workability Expected | What This Tests |
|--------|-------------|-------------|---------------------|-----------------|
| $100,000 | $3,750 | $6,250 | $6,250 | All tier 1, below all caps |
| $150,000 | $5,625 | $9,375 | $9,375 | Standard tier 1 |
| $160,000 | $6,000 | $10,000 | $10,000 | Workability cap boundary (75% × $160k / 12 = exactly $10k) |
| $200,000 | $7,500 | $12,500 | $10,000 | M&L cap ($7,500) + Workability capped |
| $320,000 | $7,500 | $20,000 | $10,000 | M&L capped, IP at tier 1 boundary |
| $400,000 | $7,500 | $23,333 | $10,000 | IP tier 2 (75%×$320k + 50%×$80k) / 12 |
| $700,000 | $7,500 | $30,000 | $10,000 | All covers at their respective caps |

### Formulas Under Test

| Cover | Formula | Hard Cap | Business Rule |
|-------|---------|----------|---------------|
| Mortgage & Living | 45% × Annual Income ÷ 12 | **$7,500/month** | DC-15 |
| Income Protection | Tier 1: 75% of first $320k; Tier 2: +50% of $320k–$560k; Tier 3: +20% above $560k; all ÷ 12 | **$30,000/month** | DC-21 |
| Workability | 75% × Annual Income ÷ 12 | **$10,000/month** | DC-27 |

### How Each Row Validates the Rules

| Row | DC-15 Proof | DC-21 Proof | DC-27 Proof |
|-----|-------------|-------------|-------------|
| $100k | 45%×$100k÷12 = $3,750 ✓ | 75%×$100k÷12 = $6,250 ✓ | min($10k, $6,250) = $6,250 ✓ |
| $150k | 45%×$150k÷12 = $5,625 ✓ | 75%×$150k÷12 = $9,375 ✓ | min($10k, $9,375) = $9,375 ✓ |
| $160k | 45%×$160k÷12 = $6,000 ✓ | 75%×$160k÷12 = $10,000 ✓ | min($10k, $10,000) = $10,000 ✓ (exact cap boundary) |
| $200k | Cap applies → $7,500 ✓ | 75%×$200k÷12 = $12,500 ✓ | min($10k, $12,500) = $10,000 ✓ |
| $320k | Cap applies → $7,500 ✓ | 75%×$320k÷12 = $20,000 ✓ (tier 1 max) | Capped $10,000 ✓ |
| $400k | Cap applies → $7,500 ✓ | (75%×$320k + 50%×$80k)÷12 = $23,333 ✓ | Capped $10,000 ✓ |
| $700k | Cap applies → $7,500 ✓ | Hard cap $30,000 ✓ | Capped $10,000 ✓ |

## Part 2: Independence Checks

Hold income at $150,000 (expected IP = $9,375). Change one variable at a time to confirm the formula doesn't vary.

| Variable Changed | Value | Expected IP | What This Proves |
|-----------------|-------|-------------|------------------|
| Gender | Female | $9,375 | Formula is gender-independent |
| Age | 25 | $9,375 | Formula doesn't change for young adults |
| Age | 65 | $9,375 | Formula doesn't change for older adults |
| Occupation Code | B | $9,375 | Formula is OCC-independent |
| Occupation Code | C | $9,375 | Formula is OCC-independent (second code) |
| Employment Status | Self-Employed | $9,375 | Formula is employment-status-independent |

**Why this matters:** If a developer accidentally introduced an age- or gender-based modifier to the formula, these checks would catch it immediately.

## Part 3: Exclusivity (DC-28)

| Setup | Action | Expected |
|-------|--------|----------|
| Age 50, Male, OCC=B, Employed, $120k income | Activate M&L + commit, then activate Workability + commit | Error: *"Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover"* |

Tested on a deliberately different persona from Parts 1 and 2 to confirm exclusivity isn't tied to a specific demographic.

## Findings That Corrected the Business Rules

| Finding | Original Doc (DC-15) | What the Test Proved | Correction |
|---------|---------------------|---------------------|------------|
| M&L hard cap | "45% × income / 12" (no cap mentioned) | At $320k income, M&L still defaults to $7,500 — not $12,000 | Formula is `min($7,500, 45% × income / 12)`. Cap equivalent to $200k income ceiling. |

## Limitations

- Does not test the "Agreed Value" variant (only tests Agreed Value Plus which is the default)
- Does not test M&L "Monthly Mortgage" cover type (only tests "Annual Income" type)
- IP Tier 3 (20% above $560k) is technically tested via the $700k row — but since the hard cap ($30k) kicks in at $560k, Tier 3 never actually contributes to the output. It's effectively un-testable without removing the cap.
- Does not test Income Protection "Loss of Earnings" variant (only tests "Loss of Earnings Plus" default)
