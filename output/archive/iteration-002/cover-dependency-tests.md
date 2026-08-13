# Cover Dependency Tests — Asteron Life Quote & Apply

**Date**: 2026-08-12  
**Environment**: outsystems-dev.asteronlife.co.nz/QuoteAndApply  
**Base config**: Age=35, Male, Occupation=AA, Employment=Employed

---

## TEST 3: Phantom-until-focused for Lump Sum covers

### Setup
- Fresh quote with Age=35, Male, OCC=AA, Employment=Employed
- Clicked "Life" cover button (activated — class became `btn cover-button margin-right-base active`)
- Sum Insured field appeared with default value: `"."` (dot placeholder)
- Did NOT click into or modify the Sum Insured field

### Action: Click Apply (footer button)

### Result: **ERROR — Cover persists with validation error**

After clicking Apply:
- **Error displayed**: `"The minimum premium is $240.00 per year per Life insured."`
- The Life cover row REMAINS visible (Sum Insured field still present with value ".")
- The Life button LOST its `active` CSS class (class became `btn cover-button margin-right-base`)
- The page did NOT navigate away — stayed on the Quote form
- The cover did NOT silently vanish

### Second Apply (after the first error):
- Additional error appeared: `"Please complete the 'Sum Insured' field in the above row"`

### Key Finding
The cover is in a **zombie state**: the button lost `active` class but the cover row still exists. Clicking the button again does NOT toggle it — it's a no-op. The cover exists but has no valid sum insured, producing a minimum premium error.

### Business Rule
> A Lump Sum cover with default "." value (unfocused placeholder) is treated as $0 sum insured. On Apply, the system validates the minimum premium requirement ($240/year) rather than removing the cover. The cover persists in a state that requires manual interaction to either fill the Sum Insured or Remove.

---

## TEST 4: Duplicate Lump Sum cover instances

### Setup
- Continued from TEST 3 (Life cover in zombie state)

### Action: Click Life button again

### Result: **NO-OP — no duplicate created**

- Life button class before second click: `btn cover-button margin-right-base` (no `active`)
- After clicking again: class unchanged — still `btn cover-button margin-right-base`
- Sum Insured field count: **still 1** (no duplicate)
- Accordion title: `"Lump Sum Covers 1"` — count unchanged
- New error: `"Please complete the 'Sum Insured' field in the above row"`

### Key Finding
Clicking the cover button when the cover is in the zombie state (row exists but button not `active`) does NOT:
- Create a duplicate "Life Cover B"
- Re-activate the cover
- Remove the cover
- Toggle anything

It appears to be a NO-OP that just triggers validation of the existing (empty) Sum Insured field.

### Business Rule
> Each lump sum cover type can only have ONE instance per policy. Clicking the button when a cover row already exists (regardless of button active state) does not create duplicates. There is no "Life Cover B" — only one Life per policy.

---

## TEST 5: Minimum bar for switching Life tabs

### Setup
- Fresh quote with NO covers active (no fields filled on Life 1 except base demographic fields were initially filled but then form was in mixed state)

### Action: Click "Add life" button

### Result: **IMMEDIATE SUCCESS — no validation required**

- "Add life" button: `<button class="btn btn-primary font-size-base margin-left-s">Add life</button>`
- After clicking, the page immediately showed **Life 1 and Life 2 tabs**
- The view switched to Life 2 (all fields blank: Age=null, Occupation=-1, Employment=-1)
- **No validation errors blocked the switch**
- No minimum config required on Life 1

### Key Finding
The "Add life" button works **unconditionally** — you can add a second life insured without:
- Filling any fields on Life 1
- Having any covers on Life 1
- Having a valid sum insured on Life 1
- No age, gender, occupation, or employment requirement

### Business Rule
> Adding a new life insured (Life 2, Life 3, etc.) has NO prerequisite validation. The form allows creating empty life tabs. Validation only occurs at Apply/Submit time, not at tab-creation time.

---

## TEST 6: Specific Injury cross-policy dependency

### Setup
- Fresh quote with Life cover active and Sum Insured = 200,000 (entered via calcmask)
- Occupation=AA, Employment=Employed

### Action: Click "Specific Injury" button

### Result: **ACTIVATED — no companion cover requirement on same policy**

- Specific Injury button was available (class: `btn cover-button margin-right-base`)
- After clicking, the Lump Sum accordion showed count increasing (from 1 to 2 in later test)
- A new cover row appeared with a **fixed-amount dropdown** (Sum Insured options: $0, $50K, $100K, $150K, $200K, $250K, $300K, $350K, $400K, $450K, $500K) and a separate Premium Structure dropdown
- No error about requiring a companion cover
- The Specific Injury Sum Insured is a SELECT dropdown (not free-text calc-mask like Life)

### Key Finding
- Specific Injury **does NOT require** a companion cover to activate
- It activates independently on the same policy that already has Life cover
- Its sum insured is selected from predefined tiers ($50K increments, max $500K)
- No cross-policy dependency observed

### Business Rule
> Specific Injury can be activated independently. It does not require Life, TPD, or any other cover to be active on the same policy. It uses a fixed-tier sum insured dropdown rather than a free-text amount.

---

## TEST 8: Needlestick occupation-availability gate

### Test A: Activate with OCC=AA

- Needlestick button **PRESENT** in DOM with Occupation=AA
- Available cover buttons with OCC=AA: Life, TPD, Trauma, Cancer, Acd. Death, **Needlestick**, Specific Injury, Income Protection
- After clicking: Lump Sum Covers count went from 1 to 2
- A new row appeared with a **fixed-amount Dropdown3** (same $0-$500K options as Specific Injury)
- No "Needlestick Cover" label found in body text (the cover row may use a generic label)
- No errors related to Needlestick

### Test B: Change to OCC=AM (Armed Forces, value=0)

- **Needlestick button REMOVED FROM DOM entirely**
- Not just hidden or disabled — the element does not exist
- Active covers returned to just "Life Cover A"
- The Needlestick cover row also disappeared
- Available buttons with AM: Life, TPD, Trauma, Specific Injury, Business Expenses, Business Disability, Farmers Disability

### Test C: Other occupation codes

| Occupation Code | Value | Needlestick Available? |
|----------------|-------|----------------------|
| AA | 1 | ✅ PRESENT (initial load) |
| AM (Armed Forces) | 0 | ❌ REMOVED from DOM |
| B | 4 | ❌ ABSENT |
| C | 5 | ❌ ABSENT |
| S | 6 | ❌ ABSENT |
| U | 7 | ❌ ABSENT |
| AA (returned) | 1 | ❌ ABSENT* |

*Note: After cycling through other occupation codes, returning to AA did NOT restore the Needlestick button. This may be because the form state was corrupted by occupation changes that triggered other cover section renders (Disability Covers section appeared for B/C/S/U).

### Cover button sets by occupation

**OCC=AA (initial)**:
- Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, Income Protection

**OCC=AM, B, C, S, U**:
- Life, TPD, Trauma, Specific Injury, Business Expenses, Business Disability, Farmers Disability
- Cancer, Acd. Death, Needlestick, Income Protection: **ALL removed**

### Occupation-gated covers discovered

| Cover | AA | AM | B | C | S | U |
|-------|----|----|---|---|---|---|
| Life | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TPD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trauma | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Specific Injury | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acd. Death | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Needlestick | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Income Protection | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Business Expenses | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Business Disability | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Farmers Disability | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Key Finding
The occupation code doesn't just gate Needlestick — it switches the **entire cover panel** between two sets:
1. **Personal set** (AA only?): Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, Income Protection
2. **Business/Commercial set** (AM, B, C, S, U): Life, TPD, Trauma, Specific Injury, Business Expenses, Business Disability, Farmers Disability

### Additional Validation Errors by Occupation

- **OCC=B (with Employment=Employed)**: 
  - `"Business Expenses Cover is not available for the selected occupation."`
  - `"Eligibility for Farmers Disability Cover requires Employment Status of either 'Self Employed' or 'Employed by own company'"`
  
- **OCC=S/U (with Employment=Employed)**:
  - `"This occupation is not eligible"` (for both Disability covers)
  - `"Eligibility for Farmers Disability Cover requires Employment Status of 'Self Employed' or 'Employed by own company'"`
  - `"Farmers Disability Cover is not available for the selected occupation"`

### Business Rule
> Needlestick cover is ONLY available for Occupation Code = AA. The mechanism is DOM removal — the button is completely removed from the page (not just hidden/disabled). Changing occupation from AA removes Needlestick immediately and without error. The entire cover panel switches based on occupation, dividing covers into "personal" (AA) and "business/commercial" (all others) sets.

---

## Additional Observations

### Cover Button Active State Behavior
- The `active` CSS class on cover buttons is **transient** — it appears momentarily after clicking but is lost after React re-renders
- The reliable indicator of an active cover is the **presence of a cover row** in the Lump Sum or Disability section with a "Remove" button
- Cover buttons checked via `className.includes('active')` are unreliable for state detection

### Cover Row Identification
- Active covers appear as rows with label format: `"[CoverType] Cover A"` (e.g., "Life Cover A")
- Each row has a "Remove" button
- Lump Sum covers use `Input_SumInsured` (calc-mask text input) or `Dropdown3` (fixed-tier select)
- The accordion header shows count: `"Lump Sum Covers N"` where N = number of active covers

### Sum Insured Field Behavior
- Life cover: free-text calc-mask input (backspace+digits, right-to-left entry)
- Specific Injury / Needlestick: fixed-amount dropdown ($0 to $500K in $50K steps)
- Default value for calc-mask fields: `"."` (dot placeholder = $0)
- Premium Structure dropdown (Stepped / Level to XX) accompanies each cover

### Disability Covers Section
- Appears when occupation is B, C, S, or U
- Shows Monthly Benefit, Benefit Period, and Waiting Period fields
- Two disability cover rows visible (`_0` and `_1`) 
- First row: Waiting Period starts at 14 Days, Benefit Period up to "To Age 70"
- Second row: Waiting Period starts at 30 Days, Benefit Period up to "5 Years"
