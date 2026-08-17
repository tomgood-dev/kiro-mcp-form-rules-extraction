# Iteration 003: Cover Dependency & Duplicate-Cover Rules

**Date**: 2026-08-13  
**Environment**: outsystems-dev.asteronlife.co.nz/QuoteAndApply  
**Test setup**: Age=35, Male, OccCode=AA (value=1), Employment=Employed (value=0)

---

## §3: DEPENDENCY / COMPANION-COVER RULES

### Test A: Specific Injury — STANDALONE (no other covers)

**Result**: ❌ BLOCKED — requires companion cover

**Errors after Apply**:
1. `"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability"`
2. `"The minimum Specific Injury Lump Sum sum insured is $500"`
3. `"The minimum premium is $240.00 per year per Life insured."`

**Observations**:
- Specific Injury activates successfully (button becomes disabled, SumInsured field appears)
- SumInsured field ID: `b23-l2-XXXX_0-b7-Input_SumInsured` (calc-mask type)
- Premium Structure dropdown also appears: `b23-l2-XXXX_0-b7-Dropdown1` (Stepped default, Level to 50/60/65/70/75/80/100)
- After Apply, the cover remains active (not removed) but validation errors are shown
- The Specific Injury button becomes `disabled: true` once activated (standard toggle behavior)

**Business Rule Discovered**:
> **Specific Injury Lump Sum** cannot be taken standalone. It requires at least one of: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living, or Workability.

**Minimum Sum Insured**: $500

---

### Test B: Needlestick — STANDALONE (no other covers)

**Result**: ❌ BLOCKED — requires companion cover

**Errors after Apply**:
1. `"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection"`
2. `"The minimum Age Next Birthday for Needlestick cover is 17"`
3. `"The minimum premium is $240.00 per year per Life insured."`

**Observations**:
- Needlestick activates successfully (button disabled, fields appear)
- Needlestick uses a **dropdown for Sum Insured** (NOT a calc-mask input): `b23-l2-XXXX_0-b7-Dropdown3`
  - Options: $0, $50,000, $100,000, $150,000, $200,000, $250,000, $300,000, $350,000, $400,000, $450,000, $500,000
  - Default: $0
- Also has Premium Structure dropdown: `b23-l2-XXXX_0-b7-Dropdown1` (Stepped default)
- The "minimum Age Next Birthday is 17" error appeared even though Age was 35 — this suggests the Age field was not committed properly to the server (Gender wasn't set; the `click` action on the Male button navigated away from the quote page temporarily)

**Business Rule Discovered**:
> **Needlestick Cover** cannot be taken standalone. It requires at least one of: Life, Trauma Recovery, Cancer, TPD, or Income Protection.
> 
> Note: Needlestick has a **narrower** set of acceptable companion covers than Specific Injury (excludes Accidental Death, Mortgage & Living, and Workability).

**Minimum Age**: 17 (Age Next Birthday)

---

### Test C: Kids Cover — Without Any Lump Sum Cover

**Result**: ❌ BLOCKED — requires at least one Personal Insurance Cover

**Immediate error (on select Number of Kids = 1)**:
- `"Please add at least one Personal Insurance Cover before adding Kids Cover"`

**Error after Apply**:
1. `"The minimum premium is $240.00 per year per Life insured."`
2. `"Please add at least one Personal Insurance Cover before adding Kids Cover"`

**Observations**:
- Setting Number of Kids = 1 **immediately shows kid detail fields** (First Name, Surname, Date of Birth, Sum Insured, Gender)
- Kid fields appear BEFORE the validation error is checked (they're client-side rendered)
- Kid Sum Insured options: $50,000 (Free), $60,000, $70,000, $80,000, $90,000, $100,000, $110,000, $120,000, $130,000, $140,000, $150,000, $160,000, $170,000, $180,000, $190,000, $200,000
- Default: $50,000 (Free)
- Date of Birth is marked `required: true`
- Kids Cover section header updates to show count: "Kids Cover 1"
- The error appears only on Apply — kid fields are visible and editable without a parent cover

**Business Rule Discovered**:
> **Kids Cover** requires at least one **Personal Insurance Cover** to be active before it can be submitted. The kid detail rows render immediately when Number of Kids > 0, but Apply will be blocked.
>
> Note: The error says "Personal Insurance Cover" — this likely means any cover in the Personal tab (Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, Mortgage & Living, Income Protection, Workability).

---

## §4: DUPLICATE-COVER INSTANCES

### Test D: Life Cover Duplicates

**Result**: ✅ UP TO 2 INSTANCES created (3rd blocked by validation)

**Sequence**:
| Action | SumInsured Fields | Premium Structure Defaults |
|--------|------------------|---------------------------|
| Click Life (1st) | 1 field: `_0-b7-Input_SumInsured` = "." | Instance 1: **Stepped** (value=0) |
| Enter 200000, wait 3s | 1 field: value = ".2.0.0.0.0.0." | Instance 1: Stepped |
| Click Life (2nd) | 2 fields: `_0` has 200000, `_1` has "." | Instance 1: **Stepped**, Instance 2: **Level to 50** (value=1) |
| Click Life (3rd) | 2 fields (unchanged!) | Unchanged — 3rd instance NOT created |

**Error blocking 3rd instance**: `"Please complete the 'Sum Insured' field in the above row"`

**After 3 clicks**:
- Life button is still `disabled: false` (enabled) — it doesn't cap at 2 via button disabling
- The section header shows "Lump Sum Covers 2"
- The 3rd click was a no-op due to the validation error requiring the 2nd instance's Sum Insured to be filled first

**Business Rules Discovered**:
> 1. **Life Cover supports multiple instances** (at least 2 confirmed)
> 2. Each new instance gets the **next Premium Structure default**: 1st = Stepped, 2nd = Level to 50
> 3. A new instance **cannot be created** until the previous instance's Sum Insured is filled ("Please complete the 'Sum Insured' field in the above row")
> 4. The Life button remains enabled after 2 instances — suggests 3+ instances may be possible once all fields are filled
> 5. Maximum is likely 3 instances (based on the task description's mention of "up to 3")

**Premium Structure default pattern** (confirmed for Life):
- Instance 1: Stepped (value=0)
- Instance 2: Level to 50 (value=1)
- Instance 3: (not tested yet — blocked by unfilled Instance 2)

---

### Test E: TPD Cover Duplicates

**Status**: NOT TESTED in this iteration (would require filling Instance 2's SumInsured first to test 3rd instance behavior)

**Expected behavior** (based on identical form infrastructure): Same pattern as Life — multiple instances with sequential Premium Structure defaults.

---

### Test F: Trauma Cover Duplicates

**Status**: NOT TESTED in this iteration

**Expected behavior**: Same pattern as Life.

---

## Summary of Companion-Cover Dependencies

| Cover | Can be standalone? | Required companions |
|-------|-------------------|---------------------|
| Life | ✅ Yes | None |
| TPD | ✅ Yes | None (assumed) |
| Trauma | ✅ Yes | None (assumed) |
| Cancer | ✅ Yes | None (assumed) |
| Acd. Death | ✅ Yes | None (assumed) |
| **Needlestick** | ❌ No | Life, Trauma Recovery, Cancer, TPD, or Income Protection |
| **Specific Injury** | ❌ No | Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living, or Workability |
| **Kids Cover** | ❌ No | At least one Personal Insurance Cover |
| Mortgage & Living | Unknown | Not tested |
| Income Protection | Unknown | Not tested |
| Workability | Unknown | Not tested |

## Summary of Duplicate-Instance Behavior

| Cover | Max instances | Premium Structure pattern | Blocked by |
|-------|--------------|--------------------------|-----------|
| Life | At least 2 (likely 3) | 1st: Stepped, 2nd: Level to 50, 3rd: ? | Must fill previous instance's Sum Insured |
| TPD | Not tested | Expected same pattern | — |
| Trauma | Not tested | Expected same pattern | — |

## Other Rules Confirmed

| Rule | Details |
|------|---------|
| Minimum premium | $240.00 per year per Life insured |
| Specific Injury min sum insured | $500 |
| Needlestick min age | 17 (Age Next Birthday) |
| Kids Cover free tier | $50,000 sum insured is free |
| Kids Cover max sum insured | $200,000 |
| Needlestick sum insured | Dropdown only (not free-entry): $0 to $500,000 in $50k increments |
