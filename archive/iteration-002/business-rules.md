# Asteron Life Quote & Apply — Comprehensive Business Rules

> **Iteration:** 002  
> **Date:** 2026-08-11  
> **Source:** DOM-first Playwright extraction + batch automation testing  
> **URL:** `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/Quote`  
> **Method:** Kiro CLI + server.js HTTP interface + batch.js automated testing

---

## Table of Contents

1. [Personal Details](#1-personal-details)
2. [Policy-Level Settings](#2-policy-level-settings)
3. [Lump Sum Covers](#3-lump-sum-covers)
4. [Disability Covers](#4-disability-covers)
5. [Kids Cover](#5-kids-cover)
6. [Premium Section](#6-premium-section)
7. [Multi-Life Support](#7-multi-life-support)
8. [Policy Type (Personal/Business)](#8-policy-type-personalbusiness)
9. [Cross-Field Dependencies](#9-cross-field-dependencies)
10. [Validation Rules & Error Messages](#10-validation-rules--error-messages)
11. [Save/Apply Preconditions](#11-saveapply-preconditions)
12. [Premium Calculation Triggers](#12-premium-calculation-triggers)
13. [Cover Activation/Deactivation Rules](#13-cover-activationdeactivation-rules)
14. [Automation Notes](#14-automation-notes)

---

## 1. Personal Details

### Field Reference

| Label | ID | Type | Required | Default | Max Length | Validation |
|-------|-----|------|----------|---------|-----------|------------|
| First Name | `b15-Input_FirstName` | text | No (quote stage) | empty | 20 | Character filter strips apostrophes, numbers, hash during typing. Hyphens preserved. |
| Last Name | `b15-Input_LastName` | text | No (quote stage) | empty | 30 | Same character filter as First Name |
| Date of birth | `b15-Input_BirthDate` | date | Yes | empty | — | Auto-calculates Age Next Birthday. Bidirectional with Age. |
| Age next birthday | `b15-Input_AgeNextBirthday` | number | Yes | empty | — | Range: 11–75 inclusive. Two error messages (client + server). |
| Gender | `b15-ButtonGroupItem1` / `b15-ButtonGroupItem2` | button-group | No (quote) / Yes (covers) | Male | — | Male/Female toggle. Triggers full page recalculation. |
| Smoking status | `b15-ButtonTrue` / `b15-ButtonFalse` | button-group | No | No | — | Yes/No toggle. Affects premium calculation. |
| Occupation code | `b15-OccupationCode_Dropdown` | select | No (quote) / Yes (covers) | blank (-1) | — | 10 options: (blank), AM, AA, A1, A2, B, C, S, U, IC |
| Employment status | `b15-EmploymentStatus_Dropdown` | select | No (quote) / Yes (Apply) | "Select one" (-1) | — | Options: Employed, Self-Employed, Employed by own company, Other |
| Pre-tax annual income ($) | `b15-b4-MaskedInput` | masked-text | No / Yes (when IC) | empty | — | Auto-formats with commas. Strips non-numeric. No min/max. |

### Occupation Code Options

| Value | Code | Description | Cover Restrictions |
|-------|------|-------------|-------------------|
| -1 | (blank) | Not selected | — |
| 0 | AM | Armed Forces/Military | DISABLES: Acd. Death, Needlestick, Specific Injury, ALL disability covers |
| 1 | AA | — | None |
| 2 | A1 | — | None |
| 3 | A2 | — | None |
| 4 | B | — | None |
| 5 | C | — | None |
| 6 | S | — | None |
| 7 | U | — | None |
| 8 | IC | Individual Consideration | Triggers underwriting referral error on all covers; requires Annual Income |

### Employment Status Options

| Value | Text | Effect |
|-------|------|--------|
| -1 | Select one | Disability covers hidden. Blocks Apply. |
| 0 | Employed | Shows Disability Covers section (Mortgage & Living, Income Protection, Workability) |
| 1 | Self-Employed | Same as Employed |
| 2 | Employed by own company | Same as Employed |
| 3 | Other | Same as Employed |

### Personal Details Business Rules

1. **DOB ↔ Age bidirectional relationship:**
   - Setting DOB auto-calculates Age Next Birthday
   - Manually typing Age CLEARS the DOB field
   - Requires React native value setter + input/change/blur events for DOB

2. **Age range validation:**
   - Valid: 11–75 inclusive
   - Client-side error: "Age next birthday should be between 11 and 75"
   - Server-side error: "Age Next Birthday must be between 11 and 75"
   - Number input type prevents negative values (minus sign cannot be typed)

3. **Future dates:** No specific "future date" validation — calculates negative age, fails range check

4. **Name character filtering:**
   - Stripped during typing: apostrophes (`'`), numbers (`0-9`), hash (`#`)
   - Preserved: hyphens (`-`), special characters (`!`, `@`, `$`, `%`), HTML characters
   - No format/pattern validation beyond the filter

5. **Gender triggers full recalculation:** Changing gender recalculates available covers, premiums, and cover eligibility

6. **Smoking defaults to No:** Standard button-group toggle, affects premium rates



---

## 2. Policy-Level Settings

These settings apply across all covers in the policy for the current life.

| Field | ID | Type | Default | Options | Notes |
|-------|-----|------|---------|---------|-------|
| Inflation Adjustment Benefit | `b23-b1-Checkbox_InflationAdjustmentBenefit` | checkbox | **Checked (On)** | On/Off | Adjusts sum insured annually for inflation |
| Premium Freeze | `b23-b1-Checkbox_PremiumFreeze` | checkbox | Unchecked (Off) | On/Off | Locks premiums — no annual increases |
| We Pay Your Premiums | `b23-b1-Dropdown_Premiums` | select | None (0) | None / 30 days / 60 days / 90 days | Waives lump sum premiums if insured cannot work >10 hrs/week after wait period |
| Flexi Rate | `b23-b1-Dropdown_FlexiRate` | select | N/A (0) | N/A / 2.5% to 30.0% (in 2.5% steps, 13 options) | Reduces adviser commission to discount client premium |

### Policy Setting Business Rules

1. **Inflation Adjustment + Premium Freeze are MUTUALLY EXCLUSIVE:**
   - Testing confirmed: when both are clicked on, the system automatically unchecks Inflation Adjustment
   - Result: `inflationAdj: false, premiumFreeze: true` — cannot have both simultaneously
   - No error message generated — silent mutual exclusion

2. **We Pay Your Premiums:**
   - Does NOT add sub-fields when selected (no conditional fields appear)
   - Simply sets the waiting period before premium waiver kicks in
   - Affects premium calculation (adds waiver benefit cost)
   - Tooltip: "Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period."

3. **Flexi Rate:**
   - Reduces adviser commission by the selected percentage
   - The reduction is passed to the client as a premium discount
   - Options: N/A, 2.5%, 5.0%, 7.5%, 10.0%, 12.5%, 15.0%, 17.5%, 20.0%, 22.5%, 25.0%, 27.5%, 30.0%
   - Tooltip: "Flexi-rate allows the Adviser to reduce their commission to provide a discount on premium to the client"
   - Premium section updates dynamically when Flexi Rate changes

4. **Settings visibility:** Policy-level settings are only visible when the Policies section is expanded and a life is selected



---

## 3. Lump Sum Covers

Lump Sum covers are activated by clicking cover buttons in the "Lump Sum Covers" panel. The panel title shows the count of active covers (e.g., "Lump Sum Covers 7").

### 3.1 Life Cover

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | Right-to-left entry, auto-formats |
| Premium Structure | select | Stepped / Level to 50 / Level to 60 / Level to 65 / Level to 70 / Level to 75 / Level to 80 / Level to 100 | Stepped | 8 options |

**Sub-cover buttons:** TI Support · Acc. TPD · Acc. Trauma · Acc. Cancer

**Discount bands:** $150k–$199k / $200k–$249k / $250k–$299k / $300k–$349k / $350k–$399k / $400k–$499k / $500k–$749k / $750k–$999k / $1,000k+

---

### 3.2 TPD (Total Permanent Disability)

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | |
| Premium Structure | select | Stepped / Level to 65 / Level to 70 | Stepped | 3 options only |
| Definition | select | Own / Any / Modified | Own | |

**Age restriction:** Minimum Age Next Birthday = 17 for Stepped TPD Cover

**Discount bands:** $100k–$249k / $250k–$499k / $500k+

---

### 3.3 Trauma

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | |
| Premium Structure | select | Stepped / Level to 65 / Level to 70 | Stepped | 3 options |
| Early Trauma Benefit | checkbox | On/Off | Off | Partial payment for 20 less-severe conditions. Pays greater of $10,000 or 20% of TRC SI, max $100,000 |
| Trauma Reinstatement | checkbox | On/Off | Off | Reinstates TRC 12 months after claim. Requires Life Cover headroom |
| Continuous Trauma Benefit | checkbox | On/Off | Off | Auto-reinstates SI after each claim; max 3 full claims per person |

**Sub-cover buttons:** Major Trauma · TPD on Trauma

**Discount bands:** $100k–$249k / $250k–$499k / $500k+

---

### 3.4 Cancer

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | |
| Premium Structure | select | Stepped / Level to 65 / Level to 70 | Stepped | 3 options |

**Discount bands:** $100k–$249k / $250k+

---

### 3.5 Accidental Death

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | |
| Premium Structure | select | Stepped / Level to 50-100 (8 options) | Stepped | **DISABLED** (locked to Stepped) |

**Occupation restriction:** DISABLED when Occupation Code = AM

**Discount bands:** $150k–$249k / $250k–$499k / $500k–$999k / $1,000k+

---

### 3.6 Needlestick

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | **select dropdown** (UNIQUE) | $0 / $50,000 / $100,000 / $150,000 / $200,000 / $250,000 / $300,000 / $350,000 / $400,000 / $450,000 / $500,000 | $0 | Fixed $50K steps, NOT a calc-mask |
| Premium Structure | select | Stepped / Level to 50-100 (8 options) | Stepped | **DISABLED** (locked to Stepped) |

**Occupation restriction:** DISABLED when Occupation Code = AM  
**Purpose:** For certain occupations — financial protection against contracting Hep B, Hep C, or HIV

---

### 3.7 Specific Injury

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Sum Insured ($) | calc-mask | Free-form digits | `.` (empty) | |
| Premium Structure | select | Stepped / Level to 50-100 (8 options) | Stepped | **DISABLED** (locked to Stepped) |

**Occupation restriction:** DISABLED when Occupation Code = AM  
**Dependency:** Must be purchased with at least one eligible Personal Insurance cover



---

## 4. Disability Covers

Disability covers are ONLY visible when Employment Status is set to any value (Employed/Self-Employed/Own Company/Other). They are hidden when Employment Status = "Select one".

**Occupation restriction:** ALL disability covers are DISABLED when Occupation Code = AM.

### 4.1 Mortgage & Living

| Field | ID Pattern | Type | Options | Default |
|-------|-----------|------|---------|---------|
| Cover Type | `Dropdown3` | select | Annual Income / Monthly Mortgage | Annual Income |
| Monthly Benefit ($) | `Input_SumInsured` | calc-mask | Free-form | `.` (empty) |
| Premium Structure | `Dropdown2` | select | Stepped / Level to Expiry | Stepped |
| Offset Benefit | `Dropdown_MLCOffsetBenefit` | select | Agreed Value / Agreed Value Plus | Agreed Value Plus |
| Benefit Period | `Dropdown_BenefitPeriod2` | select | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | `Dropdown_WaitingPeriod3` | select | 14 Days / 30 Days / 60 Days / 90 Days / 180 Days / 365 Days / 730 Days | 30 Days |

**Option buttons (6):** Increasing Claim · Income Top-up Package · Specific Injury Support Benefit · Immediate Assist Package · Ten-Hour Benefit · Mental Health Discount

**Split Benefit button:** Splits monthly benefit into two sum insureds with different waiting periods

**Offset Benefit difference:**
- Agreed Value: offsets other income sources
- Agreed Value Plus: does NOT offset other income

---

### 4.2 Income Protection

| Field | ID Pattern | Type | Options | Default |
|-------|-----------|------|---------|---------|
| Policy Type | `Dropdown4` | select | Loss Of Earnings / Loss Of Earnings Plus | Loss Of Earnings Plus |
| Monthly Benefit ($) | `Input_SumInsured` | calc-mask | Free-form | `.` (empty) |
| Premium Structure | `Dropdown2` | select | Stepped / Level to Expiry | Stepped |
| Benefit Period | `Dropdown_BenefitPeriod2` | select | 2 Years / 5 Years / To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | `Dropdown_WaitingPeriod3` | select | 14 Days / 30 Days / 60 Days / 90 Days / 180 Days / 365 Days / 730 Days | 30 Days |

**Option buttons (5):** Increasing Claim · Income Top-up Package · Specific Injury Support Benefit · Immediate Assist Package · Mental Health Discount

**Split Waiting Period button:** Allows split waiting periods

---

### 4.3 Workability

| Field | ID Pattern | Type | Options | Default |
|-------|-----------|------|---------|---------|
| Monthly Benefit ($) | `Input_SumInsured` | calc-mask | Free-form | `.` (empty) |
| Premium Structure | `Dropdown2` | select | Stepped / Level to Expiry | Stepped |
| Benefit Period | `Dropdown_BenefitPeriod2` | select | To Age 65 / To Age 70 | To Age 65 |
| Waiting Period | `Dropdown_WaitingPeriod3` | select | 30 Days / 45 Days / 60 Days / 75 Days / 90 Days | 30 Days |

**Option buttons (1):** Increasing Claim

**Key differences from other disability covers:**
- Narrower Benefit Period (only To Age 65/70, no 2 Years/5 Years)
- Narrower Waiting Period (30-90 days only, includes 45 and 75 day options unique to this cover)
- Fewer option buttons (only Increasing Claim)



---

## 5. Kids Cover

| Field | ID | Type | Options | Default |
|-------|-----|------|---------|---------|
| Number of Kids | `b23-b14-Dropdown1` | select | 0–9 | 0 |

### Per-Kid Fields (generated dynamically per row)

| Field | ID Pattern | Type | Required | Options/Notes |
|-------|-----------|------|----------|---------------|
| First Name | `b23-b14-l2-1452_{N}-b5-Input_FirstName` | text | No | |
| Surname | `b23-b14-l2-1452_{N}-b5-Input_LastName` | text | No | |
| Gender | button-group (M/F) | button-group | No | Male/Female buttons |
| Date of birth | `b23-b14-l2-1452_{N}-b5-Input_BirthDate` | date | **Yes** | Required field |
| Sum insured | `b23-b14-l2-1452_{N}-b5-Dropdown1` | select | No | $50,000 (Free) to $200,000 in $10,000 steps (16 options) |

**Business Rules:**
- Setting Number of Kids > 0 generates that many rows with identical field sets
- `{N}` is zero-indexed (first kid = `_0`, second = `_1`, etc.)
- DOB is the only required field per kid
- First option "$50,000 (Free)" means no additional premium for that level
- Kid cover premium only applies when Sum Insured exceeds $50,000
- Maximum 9 kids per life

---

## 6. Premium Section

| Field | ID Pattern | Type | Options | Default |
|-------|-----------|------|---------|---------|
| Payment Frequency | `PaymentFrequencyDropdown` | select | Fortnightly / Monthly / Quarterly / Half Yearly / Yearly | Monthly |
| Total Monthly Premium | display (read-only) | — | Calculated | — |
| Total Yearly Premium | display (read-only) | — | Monthly × 12 | — |
| Bundling Discounts | display (read-only) | — | None / percentage | — |

### Premium Display Structure
```
Premium
Total Monthly Premium (All Lives)
$XX.XX
[Life Name]
  Personal Insurance 1
  Kids                    $X.XX
  Payment frequency       [dropdown]
  Total                   $XX.XX
  Total Yearly Premium    $XXX.XX
  Bundling Discounts      None
  [Adviser Use] [Loadings]
[Life 2] (if multi-life)
```

### Premium Calculation Notes
- Premium updates dynamically when covers are added/removed
- Shows $0.00 when no Sum Insured is entered for a cover
- Each life has its own premium subtotal
- Payment frequency applies per-life
- Bundling discounts are calculated automatically based on cover combinations

---

## 7. Multi-Life Support

### Add Life Button
- Clicking "Add life" creates a new insured person tab (e.g., "Life 2")
- Each life has its own:
  - Personal Details section (blank — independent from Life 1)
  - Policies section with cover buttons
  - Premium calculation
- Life tabs appear at the top: "Life 1", "Life 2", etc.
- Premium section shows "Total Monthly Premium (All Lives)" summing all lives

### Multi-Life Business Rules
1. **Independent personal details:** Life 2 starts completely blank (no fields copied from Life 1)
2. **Minimum requirement gate:** Cannot proceed to Apply if any life has incomplete minimum requirements
3. **Error message:** "Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"
4. **This error appears as a MODAL dialog** (not inline) — must click OK to dismiss
5. **Each life independently configurable:** Different covers, amounts, and options per life
6. **Premium aggregation:** Total premium sums across all lives

---

## 8. Policy Type (Personal/Business)

### Buttons
Two policy type buttons appear under the "Policies" accordion header: **Personal** and **Business**

### Observed Behavior

| Policy Type | Visible Lump Sum Covers | Visible Disability Covers | Notes |
|-------------|------------------------|--------------------------|-------|
| **Personal** (default) | Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury | Mortgage & Living, Income Protection, Workability | Full cover set |
| **Business** | Life, TPD, Trauma, Cancer | Mortgage & Living, Income Protection, Workability | Acd. Death, Needlestick, Specific Injury HIDDEN |

### Policy Type Business Rules
1. **Personal** shows all 7 lump sum covers + sub-covers
2. **Business** shows only 4 lump sum covers (Life, TPD, Trauma, Cancer) — removes accident/occupational covers
3. **Disability covers remain the same** for both policy types
4. **Sub-cover buttons** (Acc. TPD, Acc. Trauma, Acc. Cancer, Major Trauma, TPD on Trauma) — only visible under Personal
5. **Policy count indicator** shows "1" badge next to "Policies" — represents number of policies (not lives)
6. **Switching policy type does NOT clear already-configured covers** — but removed covers lose their configuration
7. **No "selected" CSS class detected** on the buttons — selection state may be tracked differently (possibly by active content panel)

### Multi-Cover Bundling Discounts
| Condition | Discount |
|-----------|----------|
| 2 policy types (Personal & Business) | 15% |
| 3 or more cover types | 20% |



---

## 9. Cross-Field Dependencies

### Dependency Map

| # | Trigger Field | Trigger Value | Affected Field/Section | Effect |
|---|---------------|---------------|----------------------|--------|
| 1 | Date of Birth | Any valid date | Age Next Birthday | Auto-calculates age (next birthday algorithm) |
| 2 | Age Next Birthday | Any manual entry | Date of Birth | **CLEARS** DOB field |
| 3 | Employment Status | Any value (0-3) | Disability Covers section | Makes Mortgage & Living, Income Protection, Workability VISIBLE |
| 4 | Employment Status | "Select one" (-1) | Disability Covers section | HIDES all disability covers |
| 5 | Gender | Any change | ALL covers + premiums | Full page recalculation — cover count, eligibility, premiums all change |
| 6 | Occupation Code | AM (0) | Acd. Death, Needlestick, Specific Injury | DISABLES these covers (cannot activate) |
| 7 | Occupation Code | AM (0) | ALL disability covers | DISABLES Mortgage & Living, Income Protection, Workability |
| 8 | Occupation Code | IC (8) | Underwriting referral | Shows error on all covers; requires Annual Income |
| 9 | Occupation Code | IC (8) | Annual Income field | Makes income REQUIRED (cross-field validation) |
| 10 | Age Next Birthday | < 17 | TPD Cover | Error: "minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17" |
| 11 | Age Next Birthday | < 11 or > 75 | ALL covers | Invalid age blocks cover pricing |
| 12 | Policy Type | Business | Lump Sum Covers | Hides Acd. Death, Needlestick, Specific Injury |
| 13 | Number of Kids | > 0 | Kids cover rows | Generates N rows with per-kid fields |
| 14 | Inflation Adjustment | Checked | Premium Freeze | Mutually exclusive — system unchecks Inflation Adj when both attempted |
| 15 | Premium Freeze | Checked | Inflation Adjustment | Mutually exclusive — overrides Inflation Adj |
| 16 | Flexi Rate | Any % | Premium amounts | Reduces displayed premium by the selected percentage |
| 17 | We Pay Your Premiums | 30/60/90 days | Premium calculation | Adds waiver benefit cost to premium |
| 18 | Payment Frequency | Any change | Premium display | Recalculates displayed amounts for selected frequency |
| 19 | Sum Insured (any cover) | Tab out / blur | Auto-save | Triggers immediate quote save (no modal needed) |
| 20 | Smoking Status | Yes/No | Premium calculation | Smoker premiums higher (recalculation triggered) |

### Dependency Categories

**Bidirectional:**
- DOB ↔ Age Next Birthday (setting one affects the other)

**One-to-Many:**
- Gender → ALL covers + premiums (full recalculation)
- Occupation Code AM → 6 covers disabled
- Employment Status → 3 disability covers visibility

**Mutually Exclusive:**
- Inflation Adjustment ↔ Premium Freeze (cannot both be on)

**Conditional Required:**
- Occupation Code = IC → Annual Income becomes required
- Employment Status → required for Apply (not for quote)
- Gender + Age + Occupation → required for cover pricing



---

## 10. Validation Rules & Error Messages

### Complete Error Message Catalog

| # | Error Message | Trigger Condition | Type | Severity |
|---|--------------|-------------------|------|----------|
| 1 | "Required field!" | Age Next Birthday is empty | Client-side | Inline |
| 2 | "Age next birthday should be between 11 and 75" | Age < 11 or > 75 (client-side check) | Client-side | Inline |
| 3 | "Age Next Birthday must be between 11 and 75" | Age < 11 or > 75 (server-side check after blur) | Server-side | Inline |
| 4 | "Please complete the 'Sum Insured' field in the above row" | Cover activated but no Sum Insured entered | Server-side | Inline |
| 5 | "The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17" | Age < 17 with TPD cover configured | Server-side | Inline |
| 6 | "You must complete the following fields - Gender, Age Next Birthday & Occupation/Occupation Code" | Covers configured but required personal fields empty | Server-side | Combined |
| 7 | "Please contact underwriting as this Occupation requires Individual Consideration" | Occupation Code = IC with incomplete fields | Server-side | Warning |
| 8 | "You must complete the following fields - Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status & Annual Income $" | IC occupation with ALL required fields missing | Server-side | Combined |
| 9 | "Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life" | Apply clicked with incomplete Life 2 (or any life) | Modal dialog | Blocking |
| 10 | "Please complete the client's employment details before applying" | Apply clicked without Employment Status selected | Server-side | Blocking |

### Validation Timing

| Trigger | When Validated |
|---------|---------------|
| Age field blur (Tab out) | Immediate — both client and server messages |
| Sum Insured blur (Tab out) | Immediate — also triggers auto-save |
| Apply button click | All required fields checked simultaneously |
| Cover activation | Server checks age/occupation eligibility |
| Gender/Occupation change | Server recalculates cover eligibility |

### Field-Level Validation Details

| Field | Validation Rule | Error Display |
|-------|----------------|---------------|
| Age Next Birthday | Range: 11–75 inclusive | Dual messages (client "should be" + server "must be") |
| Date of Birth | No format validation beyond HTML5 date input | Negative age triggers range error |
| First Name | maxlength=20 (browser-enforced) | No error shown |
| Last Name | maxlength=30 (browser-enforced) | No error shown |
| Pre-tax Income | Non-numeric stripped by mask | No explicit error (just empty value) |
| Sum Insured (calc-mask) | Must be > 0 when cover is active | "Please complete the 'Sum Insured' field" |
| Kids DOB | Required when kid row exists | Standard "Required field!" |



---

## 11. Save/Apply Preconditions

### Save Button
- Available at any time (footer button)
- **Auto-save trigger:** Tabbing out of any Sum Insured field triggers immediate save (no modal)
- Save does NOT validate — saves current state regardless of completeness
- "Save as New" creates a duplicate quote

### Apply Button Preconditions

| Requirement | Error if Missing |
|-------------|-----------------|
| Employment Status selected (not "Select one") | "Please complete the client's employment details before applying" |
| All lives have minimum requirements met | "Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life" (MODAL) |
| At least one cover with Sum Insured > 0 | (Implied by "minimum requirement for a quote") |

### Minimum Requirements for a Quote (per life)
Based on error messages, the minimum requirement includes:
1. Gender selected
2. Age Next Birthday filled (11–75)
3. Occupation Code selected
4. At least one cover activated with Sum Insured > 0

### Apply Flow Navigation
After successful Apply:
1. Opens in same tab (after patching `window.open`)
2. URL changes to: `/QuoteAndApply/Client?ApplicationId=...`
3. Sequential step enforcement — cannot skip steps

---

## 12. Premium Calculation Triggers

### Actions That Trigger Premium Recalculation

| Action | Recalculation Scope |
|--------|-------------------|
| Gender change | FULL — all covers, all premiums |
| Smoking status change | FULL — all premiums |
| Age change (DOB or direct) | FULL — all premiums + cover eligibility |
| Occupation code change | Partial — cover eligibility + premiums |
| Cover activated/deactivated | Partial — affected cover + total |
| Sum Insured changed + Tab | Partial — affected cover premium |
| Premium Structure changed | Partial — affected cover premium |
| Flexi Rate changed | FULL — all premiums discounted |
| Payment Frequency changed | Display — recalculates frequency amounts |
| We Pay Your Premiums changed | Partial — adds/removes waiver cost |
| Kids Sum Insured changed | Partial — kids cover premium |
| Number of Kids changed | Partial — kids cover section |

### Premium Display Behavior
- Shows "$0.00" for covers with no Sum Insured entered
- Updates dynamically (no page reload needed)
- Total aggregates across all lives
- "Bundling Discounts: None" shown when no multi-cover discount applies
- Adviser Use and Loadings buttons appear but are disabled until a valid quote exists

---

## 13. Cover Activation/Deactivation Rules

### Activation
- Click a cover button (e.g., "Life", "TPD") to activate
- Cover detail panel expands below with fields
- Cover button changes visual state (highlighted/active)
- Server recalculates immediately — new IDs generated

### Deactivation
- **Cannot deactivate by re-clicking the cover button** — this is a key finding
- Must use "Remove" link inside the cover detail panel
- Removing a cover regenerates IDs of remaining covers (e.g., `l2-1454` → `l2-42409`)

### Cover Eligibility Matrix

| Cover | Occupation AM | Occupation IC | Age < 17 | Business Policy |
|-------|:---:|:---:|:---:|:---:|
| Life | ✅ | ⚠️ | ✅ | ✅ |
| TPD | ✅ | ⚠️ | ❌ (min 17) | ✅ |
| Trauma | ✅ | ⚠️ | ✅ | ✅ |
| Cancer | ✅ | ⚠️ | ✅ | ✅ |
| Acd. Death | ❌ | ⚠️ | ✅ | ❌ |
| Needlestick | ❌ | ⚠️ | ✅ | ❌ |
| Specific Injury | ❌ | ⚠️ | ✅ | ❌ |
| Mortgage & Living | ❌ | ⚠️ | ✅ | ✅ |
| Income Protection | ❌ | ⚠️ | ✅ | ✅ |
| Workability | ❌ | ⚠️ | ✅ | ✅ |

Legend: ✅ = Available, ❌ = Disabled/Hidden, ⚠️ = Available but shows underwriting referral error

### Sub-Cover Dependencies

| Sub-Cover | Parent Cover Required | Notes |
|-----------|---------------------|-------|
| TI Support | Life | Max SI = 100% of Life Cover SI, absolute max $300,000 |
| Acc. TPD | Life | Accelerated (paid from Life SI) |
| Acc. Trauma | Life | Accelerated |
| Acc. Cancer | Life | Accelerated |
| Major Trauma | Trauma | Max SI = 300% of TRC SI when TRC < $25,000 |
| TPD on Trauma | Trauma | |
| Specific Injury (Lump Sum) | Any Personal Insurance cover | Must co-exist with at least one eligible cover |

### Premium Structure Restrictions

| Cover | Premium Structure Options | Locked? |
|-------|--------------------------|---------|
| Life | Stepped / Level to 50/60/65/70/75/80/100 | No |
| TPD | Stepped / Level to 65/70 | No |
| Trauma | Stepped / Level to 65/70 | No |
| Cancer | Stepped / Level to 65/70 | No |
| Acd. Death | Stepped / Level to 50/60/65/70/75/80/100 | **YES — DISABLED** (locked to Stepped) |
| Needlestick | Stepped / Level to 50/60/65/70/75/80/100 | **YES — DISABLED** (locked to Stepped) |
| Specific Injury | Stepped / Level to 50/60/65/70/75/80/100 | **YES — DISABLED** (locked to Stepped) |
| Mortgage & Living | Stepped / Level to Expiry | No |
| Income Protection | Stepped / Level to Expiry | No |
| Workability | Stepped / Level to Expiry | No |

---

## 14. Automation Notes

### OutSystems-Specific Interaction Patterns

| Pattern | Method | Why |
|---------|--------|-----|
| Text input | `pressSequentially()` with delay + Tab blur | `fill()` doesn't fire React synthetic events |
| DOB field | React native value setter + input/change/blur events | Standard DOM value setting doesn't trigger state update |
| Checkbox toggle | `element.click()` via eval | Standard click works for checkboxes in this form |
| Select dropdown (visible) | `selectOption` via Playwright OR eval `.value` + change event | Playwright's selectOption fails when element is not visible (scrolled off-screen) |
| Select dropdown (not visible) | eval: `el.value = '...'; el.dispatchEvent(new Event('change', {bubbles:true}))` | Required when element is in collapsed accordion |
| Calc-mask input | Click → 10× Backspace (clear) → type digits → Tab | Right-to-left entry; "." = empty state |
| Cover activation | eval `button.click()` | Standard Playwright click may not trigger XHR |
| Button-group | `element.click()` via eval or mouse-click at coordinates | |
| Apply button | Click by ID `Button_Apply` or footer button text | |

### Dynamic ID Patterns

| Section | ID Pattern | Notes |
|---------|-----------|-------|
| Lump Sum Covers | `b23-l2-{SESSION}_{INDEX}-b7-*` | SESSION changes every page load |
| Disability Covers | `b23-b12-l9-{SESSION}_{INDEX}-*` | INDEX: 0=M&L, 1=IP, 2=Workability |
| Kids Cover | `b23-b14-l2-{SESSION}_{INDEX}-b5-*` | INDEX per kid (0-based) |
| Premium | `b25-l4-{SESSION}_{INDEX}-*` | Per-life premium sections |
| Personal Details | `b15-*` | Stable prefix |
| Policy Settings | `b23-b1-*` | Stable prefix |

### Known Automation Blockers
1. **Flexi Rate / We Pay Your Premiums dropdowns** — not visible when Policies accordion is collapsed; requires scrolling or accordion expansion first
2. **Cover IDs change** when covers are added/removed — cannot hardcode
3. **Modal dialogs** block all interaction — must dismiss before continuing
4. **Auto-save on Sum Insured blur** — may cause race conditions if next action happens too quickly
5. **Multi-life blank state** — Life 2 starts with no data, different field state than Life 1

---

## Appendix A: Complete Dropdown Option Reference

### Flexi Rate Options (ID: `b23-b1-Dropdown_FlexiRate`)
| Value | Text |
|-------|------|
| 0 | N/A |
| 1 | 2.5% |
| 2 | 5.0% |
| 3 | 7.5% |
| 4 | 10.0% |
| 5 | 12.5% |
| 6 | 15.0% |
| 7 | 17.5% |
| 8 | 20.0% |
| 9 | 22.5% |
| 10 | 25.0% |
| 11 | 27.5% |
| 12 | 30.0% |

### Kids Sum Insured Options
| Value | Text |
|-------|------|
| 0 | $50,000 (Free) |
| 1 | $60,000 |
| 2 | $70,000 |
| 3 | $80,000 |
| 4 | $90,000 |
| 5 | $100,000 |
| 6 | $110,000 |
| 7 | $120,000 |
| 8 | $130,000 |
| 9 | $140,000 |
| 10 | $150,000 |
| 11 | $160,000 |
| 12 | $170,000 |
| 13 | $180,000 |
| 14 | $190,000 |
| 15 | $200,000 |

### Needlestick Sum Insured Options
| Value | Text |
|-------|------|
| 0 | $0 |
| 1 | $50,000 |
| 2 | $100,000 |
| 3 | $150,000 |
| 4 | $200,000 |
| 5 | $250,000 |
| 6 | $300,000 |
| 7 | $350,000 |
| 8 | $400,000 |
| 9 | $450,000 |
| 10 | $500,000 |

---

## Appendix B: Key Product Rules Summary

| Rule | Detail |
|------|--------|
| TI Support SI constraint | Max 100% of Life Cover SI; absolute ceiling $300,000 |
| Major Trauma SI constraint | Max 300% of TRC SI when TRC < $25,000 |
| Early Trauma Benefit payout | Greater of $10,000 or 20% of TRC SI; ceiling $100,000 |
| Continuous Trauma Benefit | Max 3 full trauma claims per insured person |
| Trauma Reinstatement timing | 12-month wait after claim; requires Life Cover headroom or buy-back |
| Specific Injury dependency | Must co-exist with at least one eligible Personal Insurance cover |
| We Pay Your Premiums trigger | Insured unable to work >10 hours/week after wait period |
| Ten-Hour Benefit | Up to 10 hrs/week work without losing Living support benefit |
| Agreed Value vs Plus | Agreed Value offsets other income; Agreed Value Plus does not |
| Income Top-up Package | +33% monthly benefit for first 3 claim months; 25% bonus for part-time return |
| Immediate Assist — Crisis Benefit | Paid on diagnosis of 11 specified conditions; ignores waiting period |
| Inflation Adjustment + Premium Freeze | Mutually exclusive — system silently enforces |
| Age range | 11–75 for quote; cover-specific minimums (TPD min 17) |
| Occupation AM | Disables 6 covers (3 lump sum + 3 disability) |
| Occupation IC | All covers show underwriting referral; requires income |


| Immediate Assist — Crisis Benefit | Paid on diagnosis of 11 specified conditions; ignores waiting period |
| Inflation Adjustment + Premium Freeze | Mutually exclusive — system silently enforces |
| Age range | 11–75 for quote; cover-specific minimums (TPD min 17) |
| Occupation AM | Disables 6 covers (3 lump sum + 3 disability) |
| Occupation IC | All covers show underwriting referral; requires income |
