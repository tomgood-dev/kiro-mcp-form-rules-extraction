# Age-Banding Rules — Iteration 003

**Date**: 2026-08-13  
**Environment**: outsystems-dev.asteronlife.co.nz  
**Setup per test**: Fresh Quote → Male → OccCode=AA (value '1') → Set Age → Activate Cover → Enter Sum Insured 999,999

---

## A) LIFE COVER — Sum Insured Caps at Young Ages

### Test A1: Age 15, Life Cover, Sum Insured = $999,999
- **Result**: ERROR  
- **Error text**: `"The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"`
- **Rule confirmed**: Life Cover max SI for ANB < 17 = **$50,000**

### Test A2: Age 20, Life Cover, Sum Insured = $999,999
- **Result**: NO ERROR  
- **Interpretation**: No sum insured cap for Life Cover at Age 20 (or cap > $999,999). The documented "cap at $250,000 or $500,000" for range 17-21 was **NOT triggered** for Life Cover at this value.

---

## B) TPD COVER — Minimum Age and Sum Insured Caps

### Test B3: Age 15, TPD Activation
- **Result**: TPD button clicked → No SI field appeared, no error displayed  
- **Interpretation**: TPD is silently blocked at age 15. The button click does not activate the cover (Lump Sum Covers remained at 0). No explicit "minimum age" error was shown for TPD directly, though earlier in the session the form did produce "The minimum Age Next Birthday for Business Disability is 17" for business covers.

### Test B4: Age 20, TPD, Sum Insured = $999,999
- **Result**: ERROR  
- **Error text**: `"The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. Age Next Birthday 17-21 is only eligible for Modified TPD"`
- **Rules confirmed**:
  1. TPD max SI for ANB 17-21 = **$250,000**
  2. TPD Definition for ANB 17-21 = **Modified only** (server-side validation)

### Test B5: Age 20, TPD Definition Dropdown Options
- **Result**: Dropdown shows **"Own", "Any", "Modified"** (all three options visible)
- **Interpretation**: The dropdown does NOT filter options at the UI level. Validation is server-side — selecting "Own" or "Any" at age 20 will trigger the error above.

---

## C) TRAUMA/CANCER — Sum Insured at Young Ages

### Test C6: Age 20, Trauma, Sum Insured = $999,999
- **Result**: NO ERROR  
- **Interpretation**: No sum insured cap for Trauma Cover at Age 20 (or cap > $999,999). The documented "cap at $250,000" was NOT triggered at this value.

---

## D) MAXIMUM AGES — Cover Activation Boundaries

### Test D7: Age 70, Accidental Death
- **Result**: Cover ACTIVATED successfully (Lump Sum Covers = 1), NO errors  
- **Button state**: Not disabled, visible  
- **Rule confirmed**: Accidental Death max age = **70 (inclusive)** ✓

### Test D8: Age 71, Accidental Death
- **Result**: Cover activates (button still clickable, not disabled), but produces ERROR  
- **Error text**: `"The maximum Age Next Birthday for Accidental Death Cover is 70"`
- **Rule confirmed**: Accidental Death max ANB = **70** (validated server-side, not blocked at UI)

### Test D9: Age 65, Needlestick
- **Result**: Cover ACTIVATED successfully (Lump Sum Covers = 1), NO errors  
- **Rule confirmed**: Needlestick max age = **65 (inclusive)** ✓

### Test D10: Age 66, Needlestick
- **Result**: Cover activates but produces ERROR  
- **Error text**: `"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection. The maximum Age Next Birthday for Needlestick cover is 65"`
- **Rules confirmed**:
  1. Needlestick max ANB = **65**
  2. Needlestick requires co-cover: Life, Trauma Recovery, Cancer, TPD, or Income Protection

### Test D11: Age 61, Specific Injury
- **Result**: Cover ACTIVATED successfully (Lump Sum Covers = 1), NO errors  
- **Rule confirmed**: Specific Injury max age = **61 (inclusive)** ✓

### Test D12: Age 66, Specific Injury (tested at 66 instead of 62 — still proves the rule)
- **Result**: Cover activates but produces ERROR  
- **Error text**: `"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability. The maximum Age Next Birthday for Specific Injury cover is 61"`
- **Rules confirmed**:
  1. Specific Injury max ANB = **61**
  2. Specific Injury requires co-cover: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living, or Workability

---

## E) PREMIUM STRUCTURE — Age Windows

### Test E15: Age 45, Life Cover — Premium Structure Options
- **Options available**: Stepped, Level to 50, Level to 60, Level to 65, Level to 70, Level to 75, Level to 80, Level to 100
- **"Level to 50" present**: ✓ YES
- **Result**: All options available at age 45

### Test E13: Age 46, Life Cover — Premium Structure Options
- **Options available**: Stepped, Level to 50, Level to 60, Level to 65, Level to 70, Level to 75, Level to 80, Level to 100
- **"Level to 50" present**: ✓ YES (UNEXPECTED — expected to be removed at age > 45)
- **Interpretation**: The dropdown does NOT dynamically filter premium structure options based on age. Validation likely happens server-side on Save/Apply.

### Test E14: Age 56, Life Cover — Premium Structure Options
- **Options available**: Stepped, Level to 50, Level to 60, Level to 65, Level to 70, Level to 75, Level to 80, Level to 100
- **"Level to 60" present**: ✓ YES (UNEXPECTED — expected to be removed at age > 55)
- **Interpretation**: Same as above — no UI-level filtering. All premium structure options remain visible regardless of age.

---

## Summary of Confirmed Rules

| Cover | Rule Type | Rule | Error Text |
|-------|-----------|------|------------|
| Life | SI Cap (ANB < 17) | Max $50,000 | "The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000" |
| Life | SI Cap (ANB 17-21) | No cap ≤ $999,999 | (no error produced) |
| TPD | Min Age | Silently blocked below 17 | (no activation, no error) |
| TPD | SI Cap (ANB 17-21) | Max $250,000 | "The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000" |
| TPD | Definition (ANB 17-21) | Modified only | "Age Next Birthday 17-21 is only eligible for Modified TPD" |
| Trauma | SI Cap (ANB 20) | No cap ≤ $999,999 | (no error produced) |
| Acd. Death | Max Age | ANB ≤ 70 | "The maximum Age Next Birthday for Accidental Death Cover is 70" |
| Needlestick | Max Age | ANB ≤ 65 | "The maximum Age Next Birthday for Needlestick cover is 65" |
| Needlestick | Min Age | ANB ≥ 17 | "The minimum Age Next Birthday for Needlestick cover is 17" (from earlier test) |
| Needlestick | Co-cover required | Life, Trauma, Cancer, TPD, or IP | (included in error) |
| Specific Injury | Max Age | ANB ≤ 61 | "The maximum Age Next Birthday for Specific Injury cover is 61" |
| Specific Injury | Co-cover required | Life, Trauma, Cancer, TPD, Acd Death, IP, M&L, or Workability | (included in error) |
| Premium Structure | Age filtering | NOT filtered at UI level | All options shown regardless of age |
| Business Disability | Min Age | ANB ≥ 17 | "The minimum Age Next Birthday for Business Disability is 17" |
| Farmers Disability | Min Age | ANB ≥ 17 | "The minimum Age Next Birthday for Farmers Disability is 17" |

---

## Key Observations

1. **Covers are NOT disabled at the UI level** — all cover buttons remain clickable regardless of age. Age restrictions are enforced via **server-side validation errors** after activation.

2. **Premium Structure dropdown is NOT filtered** — all "Level to X" options remain visible at any age. Restriction enforcement likely happens on Save/Apply or Calculate Premium.

3. **TPD Definition dropdown shows all 3 options** (Own, Any, Modified) at age 20, despite only "Modified" being valid. This is a server-side validation.

4. **TPD is silently blocked below age 17** — no error message is shown, the cover simply doesn't activate.

5. **Life Cover has no observable SI cap for ages 17-21** at $999,999 — this contradicts the documented expectation of a $250,000 or $500,000 cap. The cap may be higher or may only apply in conjunction with other covers.

6. **Trauma has no observable SI cap at age 20** — same finding; $999,999 was accepted without error.
