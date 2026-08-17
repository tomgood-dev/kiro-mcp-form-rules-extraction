# Disability Occupation Tests — Business Expenses & Farmers Disability

**Test Date:** 2026-08-12  
**Test Config:** Age=40, Male, Self-Employed, Annual Income=$100,000  
**Form:** Asteron Life Quote & Apply — Business Policy, Disability Covers section

## Summary of Findings

### Key Answer
**The maximum benefit amounts are NOT income-dependent for Business Expenses or Farmers Disability.** They appear to be flat caps from an occupation lookup table. However, all tested occupation codes that allow these covers show the SAME maximum — so the "occupation table" may simply have a single universal cap per cover type (at least for the tested income level).

- **Business Expenses max = $16,666/month** (flat, same for all eligible occupations)
- **Farmers Disability max = $10,000/month** (flat, same for all eligible occupations)

Cross-reference: Testing with $150,000 income in an earlier session (occupation=AA/Civil Engineer) also showed Business Expenses max=$16,666 — confirming the cap is NOT income-based. It's genuinely a flat cap from the occupation table.

### Occupation Availability Rules

| Occ Code | Value | Business Expenses | Farmers Disability |
|----------|-------|-------------------|--------------------|
| AM | 0 | ✅ Available (max $16,666) | ❌ "not available for the selected occupation" |
| AA | 1 | ✅ Available (max $16,666) | ❌ "not available for the selected occupation" |
| A1 | 2 | ✅ Available (max $16,666) | ❌ "not available for the selected occupation" |
| A2 | 3 | ✅ Available (max $16,666) | ❌ "not available for the selected occupation" |
| B  | 4 | ✅ Available (max $16,666) | ✅ Available (max $10,000) |
| C  | 5 | ✅ Available (max $16,666) | ✅ Available (max $10,000) |
| S  | 6 | ❌ "not available for the selected occupation" | ❌ "not available for the selected occupation" |
| U  | 7 | ❌ "This occupation is not eligible" | ❌ "not available" + "not eligible" |

### Business Rules Discovered

#### Business Expenses
1. **Availability**: Available for occupation codes AM, AA, A1, A2, B, C. NOT available for S or U.
2. **Maximum Monthly Benefit**: Flat $16,666 for all eligible occupations (confirmed same at $100k and $150k income — not income-related).
3. **Error text format**: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
4. **Blocked occupations error formats**:
   - S: "Business Expenses Cover is not available for the selected occupation."
   - U: "This occupation is not eligible"
5. **Premium Structure**: Locked to "Stepped" (disabled dropdown)
6. **Benefit Period**: Locked to "1 Year" (value 3, disabled dropdown)
7. **Waiting Period**: User-selectable: 14, 30, 60, 90 Days
8. **No sub-benefit checkboxes**

#### Farmers Disability
1. **Availability**: ONLY available for occupation codes B and C. NOT available for AM, AA, A1, A2, S, U.
2. **Additional prerequisite**: Employment Status must be "Self-Employed" or "Employed by own company" (exact error: "Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company'")
3. **Maximum Monthly Benefit**: Flat $10,000 for all eligible occupations (confirmed same at $100k and $150k income).
4. **Error text format**: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000"
5. **Blocked occupations error**: "Farmers Disability Cover is not available for the selected occupation"
6. **Premium Structure**: Locked to "Stepped" (disabled dropdown)
7. **Benefit Period**: User-selectable: 6 Months, 9 Months, 12 Months, 18 Months, 24 Months, 5 Years
8. **Waiting Period**: User-selectable: 30, 60, 90 Days (no 14-day option unlike BE)
9. **Checkboxes** (2): Partial Disablement, Business Security

### Occupation Code Interpretation

Based on availability patterns:
- **AM, AA, A1, A2** = Professional/White-collar occupations (eligible for BE but NOT farming)
- **B, C** = Blue-collar/Manual/Farming occupations (eligible for BOTH BE and Farmers Disability)
- **S** = Special/Service occupations (blocked from both BE and FD)
- **U** = Uninsurable/Unclassified (blocked from both, with generic "not eligible" error)

### Formula Analysis

| Cover | Max Monthly Benefit | Income Dependency | Occupation Dependency |
|-------|--------------------:|:-----------------:|:---------------------:|
| Business Expenses | $16,666 | NO (same at $100k and $150k) | Availability only (not cap amount) |
| Farmers Disability | $10,000 | NO (same at $100k and $150k) | Availability only (not cap amount) |

**Contrast with Personal disability covers (from earlier testing):**
- Income Protection: max = 75% × Annual Income ÷ 12 (income-dependent)
- Mortgage & Living: max = 45% × Annual Income ÷ 12 (income-dependent)
- Workability: max = 75% × Annual Income ÷ 12 (income-dependent)

The Business covers use a completely different formula model — flat caps from occupation tables rather than income-percentage formulas.

### Raw Error Messages by Occupation Code

#### AM (value 0)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "Farmers Disability Cover is not available for the selected occupation"

#### AA (value 1)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "Farmers Disability Cover is not available for the selected occupation"

#### A1 (value 2)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "Farmers Disability Cover is not available for the selected occupation"

#### A2 (value 3)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "Farmers Disability Cover is not available for the selected occupation"

#### B (value 4)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" (NO "not available" error — ALLOWED)

#### C (value 5)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" (NO "not available" error — ALLOWED)

#### S (value 6)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666" + "Business Expenses Cover is not available for the selected occupation."
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "Farmers Disability Cover is not available for the selected occupation"

#### U (value 7)
- BE: "The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666" + "This occupation is not eligible"
- FD: "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000" + "This occupation is not eligible" + "Farmers Disability Cover is not available for the selected occupation"

### Interesting Observation

The system always reports BOTH the maximum amount AND the availability error simultaneously. The max amount calculation runs regardless of whether the occupation is eligible — it just also adds the "not available" / "not eligible" error alongside.

### Open Questions for Follow-Up

1. **Does the max change with a MUCH higher income?** (e.g. $500,000) — the cap might be `min(income_percentage, flat_cap)` where the flat cap only triggers above a certain income threshold
2. **IC occupation code (value 8)** was not tested — this appears to be an "Income Class" or special code
3. **Does adding a specific farming occupation (via the searchable Occupation combobox) change the Farmers Disability cap?** — the earlier test with "Farming / Farmer - Owner / Manager: >5 years' experience" showed exactly $10,000 too, so probably not
4. **What drives the $16,666 cap specifically?** — it's approximately $200,000/12 or $16,666.67/month, suggesting a possible underlying "annual business expenses cap of $200,000" divided by 12

## Test Environment Details

- URL: https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/Quote
- Browser: Chromium (headed, via Playwright)
- Server: server.js on localhost:3333
- Personal Details: Age=40, Male, Non-smoker, Self-Employed
- Policy: Business 1 (under Life 1)
- Both covers activated simultaneously, Monthly Benefit set to $99,999 to trigger cap errors
- Occupation code changed via `select` action between each test (errors updated reactively)
