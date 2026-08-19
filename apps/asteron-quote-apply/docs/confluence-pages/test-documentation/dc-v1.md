# Test: Disability Covers — dc-v1

> **Test file:** `dc-v1.spec.js`  
> **Execution time:** ~2.2 minutes  
> **Last verified:** 2026-08-19 (OutSystems Test Console + local headless)

## Summary

This test validates the income-based benefit cap formulas for the three Personal Disability covers (Mortgage & Living, Income Protection, Workability) and the mutual exclusivity rule between Workability and Mortgage & Living.

## Test Setup

| Field | Value | Reason |
|-------|-------|--------|
| Age Next Birthday | 35 | Standard adult — no age restrictions on disability covers |
| Gender | Male | Required for pricing |
| Occupation Code | AA | Full access to all covers |
| Employment Status | Employed | Required to reveal Disability section and enable income field |
| Pre-tax Annual Income | $150,000 | Produces non-trivial formula results below all caps |

## Rules Tested

### DC-15 — Mortgage & Living maximum benefit formula

| | |
|---|---|
| **Rule** | Maximum Monthly Benefit = 45% × Pre-tax Annual Income ÷ 12 |
| **Formula at $150k** | 45% × $150,000 ÷ 12 = **$5,625/month** |
| **What the test does** | 1. Activates M&L cover<br>2. Focus + blur the benefit field (triggers auto-default to maximum)<br>3. Asserts the auto-populated value is $5,625<br>4. Enters $6,000 (exceeds cap)<br>5. Asserts the error message: *"The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $5,625"* |
| **Pass criteria** | Auto-default equals $5,625 AND cap error appears at $6,000 |
| **Business rule source** | Disability Covers page, DC-15 |

### DC-21 — Income Protection maximum benefit formula

| | |
|---|---|
| **Rule** | 3-tier progressive formula: 75% of first $320k + 50% of $320k–$560k + 20% above $560k. Hard cap: $30,000/month. |
| **Formula at $150k** | 75% × $150,000 ÷ 12 = **$9,375/month** (all tier 1, below cap) |
| **What the test does** | 1. Activates IP cover<br>2. Focus + blur the benefit field (triggers auto-default)<br>3. Asserts the auto-populated value is $9,375<br>4. Enters $10,000 (exceeds cap)<br>5. Asserts the error message: *"The maximum remaining monthly benefit for Income Protection benefit is $9,375"* |
| **Pass criteria** | Auto-default equals $9,375 AND cap error appears at $10,000 |
| **Business rule source** | Disability Covers page, DC-21 |

### DC-27 — Workability maximum benefit formula

| | |
|---|---|
| **Rule** | Maximum Monthly Benefit = min($10,000, 75% × Pre-tax Annual Income ÷ 12) |
| **Formula at $150k** | min($10,000, 75% × $150,000 ÷ 12) = min($10,000, $9,375) = **$9,375/month** |
| **What the test does** | 1. Activates Workability cover<br>2. Focus + blur the benefit field (triggers auto-default)<br>3. Asserts the auto-populated value is $9,375 |
| **Pass criteria** | Auto-default equals $9,375 |
| **Why no cap-exceeded test** | At $150k income, the formula result ($9,375) is already below the $10k hard cap — exceeding it would test a different rule boundary. The formula correctness is what matters here. |
| **Business rule source** | Disability Covers page, DC-27 |

### DC-28 — Workability + Mortgage & Living mutual exclusivity

| | |
|---|---|
| **Rule** | Workability Cover cannot be taken in conjunction with Mortgage & Living Cover or Income Protection Cover |
| **What the test does** | 1. Activates M&L and commits it (focus + blur benefit field)<br>2. Activates Workability and commits it<br>3. Asserts the error message: *"Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover"* |
| **Pass criteria** | Exclusivity error message appears |
| **Business rule source** | Disability Covers page, DC-28 |

## How This Validates the Business Rules

Each assertion directly maps to a documented business rule:

| Assertion | Proves |
|-----------|--------|
| M&L auto-defaults to $5,625 | The 45% formula is correctly implemented server-side |
| M&L errors at $6,000 | The cap is actively enforced, not just a display default |
| IP auto-defaults to $9,375 | The 75% tier-1 formula is correctly implemented |
| IP errors at $10,000 | The cap is actively enforced |
| Workability auto-defaults to $9,375 | The min($10k, formula) logic works correctly |
| Exclusivity error appears | Server-side validation prevents invalid cover combinations |

## Limitations & Notes

- Only tests at a single income level ($150,000). The tier-2 IP formula ($320k+ income) and Workability $10k cap ($160k+ income) are verified separately via headless probe scripts but not in this Test Console test.
- The "commitment" mechanism (DC-01) is implicitly tested — the focus+blur step is what makes each cover "real". Without it, covers would be phantom entries.
- The test runs sequentially: each rule section removes all covers before starting the next, ensuring clean state.
