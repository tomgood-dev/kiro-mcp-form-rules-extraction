# Test: Personal Details — test-pd-v11

> **Test file:** `test-pd-v11.spec.js`  
> **Execution time:** ~11.5 minutes  
> **Last verified:** 2026-08-20 (local Edge headless)  
> **Assertions:** 32 total

## Summary

This test validates the age-band rules that restrict cover eligibility and Sum Insured caps based on the client's Age Next Birthday, the TPD Definition restriction, cover max-age limits, and the DOB↔Age bidirectional relationship. It confirms these restrictions apply universally regardless of gender or occupation code through multi-persona testing and exact boundary value analysis.

## Test Structure

The test is divided into 9 parts:

1. **Age range boundaries (PD-11)** — min/max valid ages = 4 assertions
2. **Life $50k cap at ANB < 17 (PD-28)** — 3 personas × exact boundary = 6 assertions
3. **TPD min-age error (PD-14)** — 2 personas = 2 assertions
4. **TPD $250k cap at ANB 17-21 (PD-29)** — 3 personas × exact boundary = 6 assertions
5. **Acd Death max age 70 (PD-31)** — boundary + 3 personas over = 4 assertions
6. **Independence checks (PD-28)** — 3 gender/OCC combos = 3 assertions
7. **TPD Modified-only at ANB 17-21 (PD-30)** — Definition=Own errors = 1 assertion
8. **Needlestick max 65 + Specific Injury max 61 (PD-31)** — 2 assertions
9. **DOB ↔ Age interaction (PD-15/16)** — 3 assertions

## Part 1: Age Range Boundaries (PD-11)

Base persona: Male, AA. Only age varies.

| Age | Expected | What This Tests |
|-----|----------|-----------------|
| 10 | ✓ Error: "between 11 and 75" | Just below minimum |
| 11 | ✓ No error | At minimum boundary (valid) |
| 75 | ✓ No error | At maximum boundary (valid) |
| 76 | ✓ Error: "between 11 and 75" | Just above maximum |

**What this proves:** The 11-75 range is exact — not off-by-one in either direction.

## Part 2: Life $50k Cap at ANB < 17 (PD-28)

Each persona tests at the exact boundary ($50,000 = valid) and just over ($50,001 = error).

| Persona | Age | Gender | OCC | At $50,000 | At $50,001 |
|---------|-----|--------|-----|-----------|-----------|
| 1 | 15 | Male | AA | ✓ No error | ✓ Cap error |
| 2 | 16 | Female | B | ✓ No error | ✓ Cap error |
| 3 | 12 | Male | C | ✓ No error | ✓ Cap error |

**Expected error:** *"The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"*

**What this proves:** The $50,000 cap is exact (not $49,999 or $51,000), applies to all ages 11-16, and is independent of gender and occupation code.

## Part 3: TPD Min-Age Error (PD-14)

| Persona | Age | Gender | OCC | Expected |
|---------|-----|--------|-----|----------|
| 1 | 15 | Male | AA | ✓ Min-age error |
| 2 | 16 | Female | B | ✓ Min-age error |

**Expected error:** *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"*

**What this proves:** TPD activates at any age (the button is not disabled) but immediately shows a server-side error for ANB < 17. Both genders and different OCCs get the same restriction.

## Part 4: TPD $250k Cap at ANB 17-21 (PD-29)

Each persona tests at the exact boundary ($250,000 = valid) and just over ($250,001 = error).

| Persona | Age | Gender | OCC | At $250,000 | At $250,001 |
|---------|-----|--------|-----|------------|------------|
| 1 | 17 | Male | AA | ✓ No error | ✓ Cap error |
| 2 | 20 | Female | B | ✓ No error | ✓ Cap error |
| 3 | 21 | Male | C | ✓ No error | ✓ Cap error |

**Expected error:** *"The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. Age Next Birthday 17-21 is only eligible for Modified TPD"*

**What this proves:** The $250,000 cap is exact, applies across the full 17-21 range, and is independent of gender and occupation code.

## Part 5: Accidental Death Max Age 70 (PD-31)

| Persona | Age | Gender | OCC | Expected |
|---------|-----|--------|-----|----------|
| 1 | 70 | Male | AA | ✓ No error (max valid age) |
| 2 | 71 | Male | AA | ✓ Max-age error |
| 3 | 71 | Female | B | ✓ Max-age error |
| 4 | 71 | Male | C | ✓ Max-age error |

**Expected error:** *"The maximum Age Next Birthday for Accidental Death Cover is 70"*

**Note:** Button text on the form is `Acd. Death` (abbreviated). The cover activates at age 71 (SI field appears) but errors after entering a Sum Insured value.

**What this proves:** Age 70 is the exact maximum (no error), age 71 triggers the error regardless of gender or OCC.

## Part 6: Independence Checks (PD-28)

Hold age at 15, enter Life $50,001 (should always error). Vary gender and OCC to confirm the cap is universal.

| Gender | OCC | Expected |
|--------|-----|----------|
| Female | AA | ✓ Cap error |
| Male | A2 | ✓ Cap error |
| Female | S | ✓ Cap error |

**What this proves:** If a developer accidentally made the $50k cap gender-specific or OCC-specific, these checks would immediately catch it.

## Personas Used (Summary)

| # | Age | Gender | OCC | Used In |
|---|-----|--------|-----|---------|
| 1 | various | Male | AA | Age boundaries, PD-28, PD-14, PD-29 |
| 2 | 16 | Female | B | PD-28, PD-14 |
| 3 | 12 | Male | C | PD-28 |
| 4 | 17 | Male | AA | PD-29 |
| 5 | 20 | Female | B | PD-29 |
| 6 | 21 | Male | C | PD-29 |
| 7 | 70/71 | Male | AA | PD-31 |
| 8 | 71 | Female | B | PD-31 |
| 9 | 71 | Male | C | PD-31 |
| 10 | 15 | Female | AA | Independence |
| 11 | 15 | Male | A2 | Independence |
| 12 | 15 | Female | S | Independence |

## Part 7: TPD Modified-Only at ANB 17-21 (PD-30)

| Persona | Age | Setup | Action | Expected |
|---------|-----|-------|--------|----------|
| Male, 20, AA | 20 | TPD $200k | Select Definition = "Own" | ✓ Error referencing Modified TPD |

**What this proves:** The TPD Definition dropdown shows all options (Own/Any/Modified) but the server rejects anything except "Modified" for ages 17-21.

## Part 8: Cover Max-Age Limits (PD-31 continued)

| Cover | Test Age | Expected |
|-------|----------|----------|
| Needlestick | 66 | ✓ Error: "maximum Age Next Birthday for Needlestick cover is 65" |
| Specific Injury | 62 | ✓ Error: "maximum Age Next Birthday for Specific Injury cover is 61" |

**What this proves:** Each cover's max-age limit is enforced server-side — the cover activates but errors after SI entry/selection.

## Part 9: DOB ↔ Age Interaction (PD-15, PD-16)

| Action | Expected | Rule |
|--------|----------|------|
| Set ANB = 40 | DOB field is empty | PD-16: manual ANB clears DOB |
| Set DOB = 1996-08-20 | ANB auto-calculates to ~30 | PD-15: DOB auto-calculates ANB |
| Set ANB = 45 (overriding DOB) | DOB field clears | PD-16: last-write-wins |

**What this proves:** The two fields are mutually exclusive sources of truth — setting one clears/overrides the other.

## Limitations

- **IP Tier 3 formula** (mentioned in dc-v3) — genuinely untestable due to $30k cap masking it. System constraint.
- **DOB edge cases** (future dates, very old dates producing negative ages) — documented in PD-17/18 but not tested here as they're edge cases of the date picker, not business logic.
