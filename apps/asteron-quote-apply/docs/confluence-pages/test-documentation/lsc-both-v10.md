# Test: Lump Sum Covers — lsc-both-v9

> **Test file:** `lsc-both-v9.spec.js`  
> **Execution time:** ~11 minutes  
> **Last verified:** 2026-08-19 (OutSystems Test Console + local Edge headless)  
> **Assertions:** 24 total

## Summary

This test validates the Sum Insured caps for TPD and Accidental Death covers, the Major Trauma percentage-based cap and $2M combined ceiling (including Cancer's contribution), the Specific Injury and Needlestick companion cover dependencies — all tested across multiple personas to confirm the caps are universal regardless of age, gender, or occupation code.

## Test Structure

The test is divided into 7 parts:

1. **TPD $5M cap** — 3 personas × exact boundary testing = 6 assertions
2. **Acd. Death $1M cap** — 3 personas × exact boundary testing = 6 assertions
3. **Major Trauma 300% cap** — exact boundary at TRC < $25k = 2 assertions
4. **$2M combined ceiling** — exact boundary at TRC ≥ $25k = 3 assertions
5. **Specific Injury companion** — 2 personas = 2 assertions
6. **Cancer $2M contribution** — exact boundary = 2 assertions
7. **Needlestick companion** — 1 assertion

## Part 1: TPD $5,000,000 Cap (LSC-10)

Each persona tests at the exact boundary ($5,000,000 = valid) and just over ($5,000,001 = error).

| Persona | Age | Gender | OCC | At $5M | At $5,000,001 |
|---------|-----|--------|-----|--------|---------------|
| 1 | 35 | Male | AA | ✓ No error | ✓ Cap error |
| 2 | 55 | Female | B | ✓ No error | ✓ Cap error |
| 3 | 22 | Male | C | ✓ No error | ✓ Cap error |

**Expected error:** *"The maximum total Sum Insured per life for TPD Cover is $5,000,000."*

**What this proves:** The $5M cap is universal — not modified by age, gender, or occupation code.

## Part 2: Accidental Death $1,000,000 Cap (LSC-27)

| Persona | Age | Gender | OCC | At $1M | At $1,000,001 |
|---------|-----|--------|-----|--------|---------------|
| 1 | 35 | Male | AA | ✓ No error | ✓ Cap error |
| 2 | 60 | Female | B | ✓ No error | ✓ Cap error |
| 3 | 70 | Male | A2 | ✓ No error | ✓ Cap error |

**Expected error:** *"The maximum sum insured for Accidental Death Cover is $1,000,000."*

**What this proves:** The $1M cap is universal. Persona 3 specifically tests at the maximum valid age (70) to confirm the cap still applies at the age boundary.

**Note:** Button text on the form is `Acd. Death` (abbreviated), not "Accidental Death". Error messages use the full name.

## Part 3: Major Trauma 300% Cap (LSC-19)

When Trauma Recovery Cover (TRC) Sum Insured is below $25,000, Major Trauma is capped at 300% × TRC.

| Persona | TRC | Major Trauma | Expected |
|---------|-----|-------------|----------|
| Female, 40, B | $20,000 | $60,000 (= 300% × $20k) | ✓ No error (at boundary) |
| Female, 40, B | $20,000 | $60,001 (exceeds 300%) | ✓ Cap error |

**Expected error:** *"The maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $20,000 is $60,000."*

**What this proves:** The 300% formula is exact — $60,000 is the precise maximum, and $60,001 triggers the error.

## Part 4: $2,000,000 Combined Ceiling (LSC-20)

When TRC ≥ $25,000, the 300% cap no longer applies. The only limit is the $2M combined ceiling (TRC + Major Trauma + Cancer).

| Persona | TRC | Major Trauma | Total | Expected |
|---------|-----|-------------|-------|----------|
| Male, 30, AA | $25,000 | $1,975,000 | $2,000,000 | ✓ No error (at ceiling) |
| Male, 30, AA | $25,000 | $1,975,000 | — | ✓ No 300% error (confirms threshold switch) |
| Male, 30, AA | $25,000 | $1,975,001 | $2,000,001 | ✓ Ceiling error |

**Expected error:** *"The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000."*

**What this proves:**
- At exactly $25,000 TRC, the 300% cap disappears (assertion 2)
- The $2M ceiling is the exact boundary — $2,000,000 combined is valid, $2,000,001 is not
- The TRC=$25k threshold is confirmed as the switching point between the two rules

## Part 5: Specific Injury Companion Requirement (LSC-32)

Specific Injury cannot be submitted standalone — it requires at least one companion cover (Life, TPD, Trauma, Cancer, Acd. Death, IP, M&L, or Workability).

| Persona | Age | Gender | OCC | Employment | Result |
|---------|-----|--------|-----|-----------|--------|
| 1 | 35 | Male | AA | Employed | ✓ Companion error on Apply |
| 2 | 50 | Female | B | Self-Employed | ✓ Companion error on Apply |

**Expected error:** *"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability"*

**What this proves:** The companion requirement isn't specific to a gender, age, occupation, or employment status — it applies universally.

## Part 6: Cancer Contributes to $2M Combined Ceiling (LSC-17/LSC-23)

The $2M ceiling applies to TRC + Major Trauma + Cancer combined. Part 4 tested TRC + MT. This part confirms Cancer also counts toward the same ceiling.

| Persona | TRC | Cancer | Total | Expected |
|---------|-----|--------|-------|----------|
| Male, 35, AA | $1,000,000 | $1,000,000 | $2,000,000 | ✓ No error (at ceiling) |
| Male, 35, AA | $1,000,000 | $1,000,001 | $2,000,001 | ✓ Ceiling error |

**Expected error:** *"The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000."*

**What this proves:** Cancer's Sum Insured is genuinely included in the $2M combined cap — not just Trauma + Major Trauma.

## Part 7: Needlestick Companion Requirement (LSC-31b)

Needlestick cannot be submitted standalone — it requires a companion cover from a specific list (Life, Trauma Recovery, Cancer, TPD, or Income Protection).

| Persona | Setup | Action | Expected |
|---------|-------|--------|----------|
| Male, 35, AA | Needlestick activated, SI set to $50,000 | Click Apply | ✓ Companion error |

**Expected error:** *"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection"*

**What this proves:** Needlestick's companion requirement is enforced on Apply, regardless of the fact that Needlestick now activates for all occupation codes.

## Personas Used (Summary)

| # | Age | Gender | OCC | Used In |
|---|-----|--------|-----|---------|
| 1 | 35 | Male | AA | TPD cap, Acd Death cap, Cancer ceiling, Needlestick companion |
| 2 | 55 | Female | B | TPD cap |
| 3 | 22 | Male | C | TPD cap |
| 4 | 60 | Female | B | Acd Death cap |
| 5 | 70 | Male | A2 | Acd Death cap (max valid age) |
| 6 | 40 | Female | B | Major Trauma 300% |
| 7 | 30 | Male | AA | $2M ceiling |
| 8 | 35 | Male | AA | Specific Injury companion |
| 9 | 50 | Female | B | Specific Injury companion |

## Limitations

- TPD $250k cap at ANB 17–21 is covered in `test-pd-v9`, not here.
- Needlestick's OCC restriction (LSC-02) was found to be obsolete during probing — Needlestick activates for all OCCs now. The companion requirement (LSC-31b) IS tested here regardless.
- Does not test three-way combined cap (TRC + MT + Cancer all at once). Two-way combinations (TRC + MT, TRC + Cancer) are individually confirmed.
