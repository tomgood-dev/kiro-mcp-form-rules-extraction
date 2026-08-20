# Exhaustive Boundary & Validation Analysis — Asteron Connect Quote Screen

**Date:** 2026-08-19 (Quote Screen core categories); Commission Category area added 2026-08-20  
**Status:** Complete for the original Quote Screen scope (Personal Details through Kids Cover, Premium & Bundling). Adviser Use / Commission Category (§1.6b) is partial — only the parts confirmed against its source user story so far; the multi-option IC/RC matrix is not yet mapped.  
**Method:** AI-driven headless Playwright probing (Chromium, headless mode, single-session sequential)

---

## Step 1: Variable & Input Mapping

### 1.1 Personal Details (per Life)

| Field | ID / Selector | Type | States / Options | Constraints | Default |
|-------|---------------|------|------------------|-------------|---------|
| First Name | `b15-Input_FirstName` | text | Free-text | Max 20 chars; strips `'`, `#`, digits on real keystrokes | Empty |
| Last Name | `b15-Input_LastName` | text | Free-text | Max 30 chars; same char filter as First Name | Empty |
| Date of Birth | `b15-Input_BirthDate` | date | Native date picker | Auto-calculates ANB; clears if ANB manually typed | Empty |
| Age Next Birthday | `input[id*="Input_AgeNextBirthday"]` | number | 0–99 typeable | Valid: 11–75 inclusive | Empty |
| Gender | `.button-group-item` (Male/Female) | button group | Male, Female | Required for pricing; triggers full recalc | Neither selected |
| Smoking | `.button-group-item` (Yes/No) | button group | Yes, No | Affects premium rate, not eligibility | **No** (selected via `button-group-selected-item` class) |
| Occupation | Searchable type-ahead | virtual-select | Free-text search → fills OCC code | Disables OCC Code dropdown once selected | Empty |
| Occupation Code | `b15-OccupationCode_Dropdown` | select | (blank), AM, AA, A1, A2, B, C, S, U, IC | Values: -1, 0, 1, 2, 3, 4, 5, 6, 7, 8 | Blank (-1) |
| Employment Status | `b15-EmploymentStatus_Dropdown` | select | Select one, Employed, Self-Employed, Employed by own company, Other | Required for Disability pricing; required for Apply | Select one |
| Pre-tax Annual Income | `b15-Input_AnnualIncome` (or `b15-b4-MaskedInput`) | calc-mask | Digits only, displays with comma formatting | Required for DC formula caps; drives M&L/IP/Workability maximums | Empty |

### 1.2 Lump Sum Covers (Personal policy)

| Cover | Button Text | SI Field Type | Premium Structure Options | Key Constraints |
|-------|-------------|---------------|--------------------------|-----------------|
| Life | `Life` | calc-mask | Stepped, Level to 50/60/65/70/75/80/100 (8) | No hard max found; ANB 11–16: $50k cap |
| TPD | `TPD` | calc-mask | Stepped, Level to 65, Level to 70 (3) | Max $5M; ANB<17: min-age error; ANB 17-21: $250k cap, Modified only |
| Trauma | `Trauma` | calc-mask | Stepped, Level to 65, Level to 70 (3) | Combined cap with Cancer+Major Trauma: $2M |
| Major Trauma | `Major Trauma` | calc-mask | Stepped only (locked) | <$25k TRC: 300% cap; ≥$25k TRC: only $2M combined cap |
| Cancer | `Cancer` | calc-mask | Stepped, Level to 65, Level to 70 (3) | Shares $2M cap with Trauma; no Trauma dependency |
| Acd. Death | `Acd. Death` | calc-mask | Locked to Stepped (8-opt dropdown disabled) | Max $1M; max ANB 70 (error after SI entry at 71) |
| Needlestick | `Needlestick` | **select dropdown** | Locked to Stepped (disabled) | $0–$500k in $50k steps (11 opts); AA-only (no-op for others); requires companion cover |
| Specific Injury | `Specific Injury` | calc-mask | Stepped, Level to 50/60/65/70/75/80/100 (8) | Requires companion cover; min $500; max ANB 61; AM blocked |

### 1.3 Lump Sum Covers (Business policy)

| Cover | Available | Notes |
|-------|-----------|-------|
| Life | ✅ | Same as Personal |
| TPD | ✅ | Same as Personal |
| Trauma | ✅ | Same as Personal |
| Specific Injury | ✅ | Same as Personal |
| Cancer | ❌ | Not on Business menu |
| Acd. Death | ❌ | Not on Business menu |
| Needlestick | ❌ | Not on Business menu |

### 1.4 Disability Covers (Personal policy)

| Cover | Button Text | SI Field | Premium Structure | Benefit Period | Waiting Period |
|-------|-------------|----------|-------------------|----------------|----------------|
| Mortgage & Living | `Mortgage & Living` | calc-mask | Stepped / Level to Expiry | 2yr / 5yr / Age 65 / Age 70 | 14/30/60/90/180 Days |
| Income Protection | `Income Protection` | calc-mask | Stepped / Level to Expiry | 2yr / 5yr / Age 65 / Age 70 | 14/30/60/90/180/365/730 Days |
| Workability | `Workability` | calc-mask | Stepped / Level to Expiry | Age 65 / Age 70 only | 30/45/60/75/90 Days |

### 1.5 Disability Covers (Business policy)

| Cover | Button Text | SI Field | Key Constraints |
|-------|-------------|----------|-----------------|
| Business Expenses | `Business Expenses` | calc-mask | Flat $16,666/mo cap; AM/AA/A1/A2/B/C eligible; S/U blocked |
| Business Disability | `Business Disability` | calc-mask | Flat $50,000/mo cap; mutually exclusive with Farmers Disability |
| Farmers Disability | `Farmers Disability` | calc-mask | Flat $10,000/mo cap; B/C only + Self-Employed/Own Company |

### 1.6 Policy-Level Controls

| Field | ID / Selector | Type | Options | Default |
|-------|---------------|------|---------|---------|
| Inflation Adjustment Benefit | `b23-b1-Checkbox_InflationAdjustmentBenefit` | checkbox | On/Off | **On** |
| Premium Freeze | `b23-b1-Checkbox_PremiumFreeze` | checkbox | On/Off | Off |
| We Pay Your Premiums | `b23-b1-Dropdown_Premiums` | select | None, 30 days, 60 days, 90 days | None |
| Flexi Rate | `b23-b1-Dropdown_FlexiRate` | select | N/A, 2.5%–30.0% in 2.5% steps (13 opts) | N/A |
| Payment Frequency | `PaymentFrequencyDropdown` | select | Fortnightly, Monthly, Quarterly, Half Yearly, Yearly | Monthly |
| Number of Kids | `b23-b14-Dropdown1` | select | 0–9 | 0 |

### 1.6b Adviser Use / Commission Category (added 2026-08-20, see `adviser-use-commission/page.md`)

Opened via the **Adviser Use** button on a valid, priced quote — a "Commissions" modal, not part
of the main Illustration form. Field IDs include dynamic per-quote path segments (e.g.
`b25-b18-...`) — locate these by option-set fingerprint, not hardcoded ID, per
`comm-cat-v1.spec.js`.

| Field | Fingerprint | Type | Options | Default |
|-------|-------------|------|---------|---------|
| Default for Agency | Options exactly `[Upfront, Level 30, Spread 20]`, no "Please Select" | select | Upfront, Level 30, Spread 20 | Upfront (first-time) |
| Select IC/RC (per cover) | First option `"Please Select"`, rest match `/^IC-\d+%, RC-\d+%$/` | select | Varies by Flexi Rate (1 option at N/A, up to 5+ at other rates) | Auto-selected if exactly 1 real option |
| Select All / per-cover commission category | First option `"Please Select"`, rest are commission category names | select | Please Select, Upfront, Level 30, Spread 20 (subset valid for current IC/RC) | Varies |
| Update button | `button:has-text("Update")` within the modal | button | — | Disabled until Default-for-Agency selection differs from saved value |

This area was tested in **acceptance-criteria mode** against a written user story (ACB-13175),
not reverse-engineered from scratch — only the parts confirmed against that spec are documented
here; the multi-option IC/RC matrix, cross-quote persistence, and STP payload are not yet mapped.
See `comm-cat-v1.md` for current pass/fail status.

### 1.7 Boundary Conditions Summary

| Field | Min Valid | Max Valid | Below Min | Above Max | Zero | Empty |
|-------|-----------|-----------|-----------|-----------|------|-------|
| Age Next Birthday | 11 | 75 | Error at 10 | Error at 76 | Error | "Required field!" |
| Life SI (ANB <17) | $1 | $50,000 | — | Cap error | — | Zombie state |
| TPD SI (ANB 17-21) | $1 | $250,000 | — | Cap error | — | Zombie state |
| TPD SI (ANB 22-75) | $1 | $5,000,000 | — | Cap error | — | Zombie state |
| Acd. Death SI | $1 | $1,000,000 | — | Cap error | — | Zombie state |
| Trauma + Cancer + MT (combined) | $1 | $2,000,000 | — | Cap error | — | — |
| Major Trauma (TRC <$25k) | $1 | 300% × TRC | — | Cap error | — | — |
| IP Monthly Benefit | $1 | Formula-based (max $30k) | — | Cap error | — | Auto-defaults to max |
| M&L Monthly Benefit | $1 | min($7,500, 45% × income ÷ 12) | — | Cap error | — | Auto-defaults to max |
| Workability Monthly | $1 | min($10k, 75% × income ÷ 12) | — | Cap error | — | Auto-defaults to max |
| Business Expenses | $1 | $16,666 | — | Cap error | — | — |
| Business Disability | $1 | $50,000 | — | Cap error | — | — |
| Farmers Disability | $1 | $10,000 | — | Cap error | — | — |
| Number of Kids | 0 | 9 | — | — | No kids section | — |

---

## Step 2: Rule-to-Field Traceability Matrix

### 2.1 Age Rules → Field Mapping

| Rule ID | Rule Summary | Field(s) Affected | Verification Status |
|---------|-------------|-------------------|---------------------|
| PD-11 | Age valid range 11–75 | Age Next Birthday | ✅ Confirmed (10=error, 11=OK, 75=OK, 76=error) |
| PD-12 | Two error message variants (client + server) | Age Next Birthday | ✅ Confirmed |
| PD-14 | TPD Stepped min age 17 | Age + TPD cover | ✅ Confirmed (activates but errors) |
| PD-28 | Life max $50k for ANB 11-16 | Age + Life SI | ✅ Confirmed |
| PD-29 | TPD max $250k for ANB 17-21 | Age + TPD SI | ✅ Confirmed |
| PD-31 | Cover max ages (Acd Death 70, Needlestick 65, SI 61) | Age + Cover activation | ✅ Acd Death confirmed (activates, errors after SI) |
| PD-15 | DOB auto-calculates ANB | DOB → ANB | ⚠️ DOB field found (type=date), interaction not fully tested |
| PD-16 | ANB clears DOB | ANB → DOB | ⚠️ Confirmed DOB empty after setting ANB |

### 2.2 Occupation Rules → Cover Availability

| Rule ID | Rule Summary | Fields | Verification Status |
|---------|-------------|--------|---------------------|
| LSC-02 | Needlestick AA-only | OCC Code + Needlestick button | ⚠️ **CORRECTED**: Button present for ALL OCCs; click is no-op for non-AA (state-dependent behavior observed) |
| LSC-03 | AM blocks Cancer/Acd Death/Specific Injury | OCC Code + Cover buttons | ⚠️ Buttons present for AM; enforcement likely on activation (not DOM removal) |
| PD-21 | IC shows underwriting warning | OCC Code | ⚠️ Warning not immediate; likely on Apply |
| DC-06 | Farmers Disability needs Self-Employed + B/C | OCC + Employment Status | 🔲 Not yet probed |

### 2.3 Income → Disability Cover Formulas

| Rule ID | Rule Summary | Fields | Verification Status |
|---------|-------------|--------|---------------------|
| DC-15 | M&L max = 45% × income / 12 | Income + M&L benefit | ✅ Confirmed (3 income levels) |
| DC-21 | IP 3-tier: 75%/$320k + 50%/$320-560k + 20%/>$560k, cap $30k | Income + IP benefit | ✅ Confirmed (7 income levels, all tiers + cap) |
| DC-27 | Workability = min($10k, 75% × income / 12) | Income + Work benefit | ✅ Confirmed (5 levels including cap boundary) |
| DC-33 | Business Expenses flat $16,666/mo | None (flat) | 🔲 Not yet probed |
| DC-39 | Business Disability flat $50,000/mo | None (flat) | 🔲 Not yet probed |
| DC-44 | Farmers Disability flat $10,000/mo | None (flat) | 🔲 Not yet probed |

### 2.4 Cover Dependency Rules

| Rule ID | Rule Summary | Fields | Verification Status |
|---------|-------------|--------|---------------------|
| LSC-32/34 | Specific Injury requires companion cover | SI activation + other covers | ✅ Confirmed (error on Apply without companion) |
| LSC-31b/41 | Needlestick requires companion cover | Needlestick + other covers | ⚠️ Needlestick now activates for all OCCs — companion check needs separate test |
| KID-08 | Kids Cover requires ≥1 Personal Insurance Cover | Kids + any cover | ✅ Confirmed ("Please add at least one Personal Insurance Cover before adding Kids Cover") |
| DC-28 | Workability exclusive with M&L and IP | Workability + M&L/IP | ✅ Confirmed (both combinations error) |
| DC-45 | Business Disability + Farmers Disability mutually exclusive | Both business DC covers | 🔲 Not yet probed |

### 2.5 Bundling Discount Rules

| Rule ID | Rule Summary | Fields | Verification Status |
|---------|-------------|--------|---------------------|
| PREM-20 | 3+ qualifying covers → 20% | Multiple covers | ✅ Confirmed (locally tested + live probe) |
| PREM-22 | 1 cover → "None" | Single cover | ✅ Confirmed (live probe) |
| PREM-23 | Life ≥$100k to count | Life SI | ✅ Confirmed (exact boundary $99,999→None, $100,000→15%) |
| PREM-24 | TPD ≥$100k to count | TPD SI | ⚠️ Field targeting issue in probe; confirmed in local test run |
| PREM-25 | Trauma ≥$25k to count | Trauma SI | ✅ Confirmed ($24,999=doesn't count, $25,000=counts) |
| PREM-26 | M&L ≥$500-$1000/mo to count | M&L benefit | ⚠️ Boundary not exactly confirmed |

### 2.6 Policy Structure Rules

| Rule ID | Rule Summary | Fields | Verification Status |
|---------|-------------|--------|---------------------|
| POL-05 | Inflation Adj. + Premium Freeze mutually exclusive (silent) | Both checkboxes | ✅ Confirmed (both directions — silent uncheck) |
| POL-06 | Personal/Business creates new policy (not toggle) | Policy buttons | ✅ Confirmed (Personal 1 → Business 1 created) |
| POL-12 | Add Life blocked when current life incomplete | Add Life button | ✅ Confirmed (modal: "Please correct the errors before proceeding to another life") |
| POL-14 | Business: Life, TPD, Trauma, Specific Injury only | Policy type + covers | ✅ Confirmed (+ Business Expenses, Business Disability, Farmers Disability) |

### 2.7 Hidden / Implied Rule Conflicts

| Conflict | Rules Involved | Impact |
|----------|---------------|--------|
| **DOM vs. Enforcement model mismatch** | LSC-02, LSC-03, PD-20 (docs say DOM removal) vs. live app (buttons always present) | Tests must assert on activation behavior (no-op / error), NOT on DOM presence |
| **PD-29 contradicts itself** | States "silently blocked (no-op)" but PD-14 documents an error message for same scenario | Resolved: cover activates, error shows — PD-14 is correct |
| **DC auto-default + commitment trap** | DC-01/DC-02/DC-03 | Disability covers need explicit focus+blur to "commit"; without it they're phantom entries |
| **Bundling + uncommitted DC covers** | PREM-20/21 + DC-01 | An activated-but-uncommitted DC cover contributes $0 and doesn't count for bundling |

---

## Step 3: Permutation & Combination Matrix

### 3.1 Equivalence Partitions

#### Age (ANB)

| Partition | Values | Expected Behavior |
|-----------|--------|-------------------|
| Below minimum | 0–10 | "between 11 and 75" error |
| Child band (Life capped) | 11–16 | Life max $50k; TPD errors on activation |
| Young adult (TPD restricted) | 17–21 | TPD max $250k, Modified only |
| Standard adult | 22–60 | All covers available, no age caps (except cover-specific max ages) |
| Specific Injury max age | 62–64 | SI errors on activation at 62+ |
| Needlestick max age | 66–69 | Needlestick errors at 66+ |
| Acd Death max age | 71–75 | Acd. Death errors at 71+ |
| Above maximum | 76–99 | "between 11 and 75" error |

#### Occupation Code

| Partition | Codes | Key Behavior |
|-----------|-------|--------------|
| Full access (except Needlestick) | AM, A1, A2, B, C, S, U, IC | All buttons present; some activate as no-op depending on cover |
| Needlestick-eligible | AA only | Needlestick activates |
| Business Expenses blocked | S, U | Error on activation |
| Farmers Disability eligible | B, C + Self-Employed | Only combination that allows Farmers |
| IC (Individual Consideration) | IC | Warning on Apply; all fields required |

#### Employment Status

| Partition | Value | Key Behavior |
|-----------|-------|--------------|
| Not set | "Select one" | Apply blocked ("complete employment details"); Disability covers visible but income not entered |
| Standard | Employed, Other | Standard behavior |
| Self-employed variants | Self-Employed, Employed by own company | Enables Farmers Disability (with B/C OCC); Ten-Hour auto-checks for M&L |

### 3.2 Boundary Value Analysis (BVA)

| Boundary | Just Below | At Boundary | Just Above | Verified? |
|----------|-----------|-------------|-----------|-----------|
| Age min (11) | 10 → error | 11 → valid | 12 → valid | ✅ |
| Age max (75) | 74 → valid | 75 → valid | 76 → error | ✅ |
| Life SI cap (ANB<17) | $49,999 → OK | $50,000 → OK | $50,001 → error | ⚠️ Exact boundary not tested (tested $999,999) |
| TPD SI cap (17-21) | $249,999 → OK | $250,000 → OK | $250,001 → error | ⚠️ Tested $300k → error |
| TPD SI max ($5M) | $4,999,999 → OK | $5,000,000 → OK | $5,000,001 → error | ✅ Confirmed |
| Acd Death SI ($1M) | $999,999 → OK | $1,000,000 → OK | $1,000,001 → error | ✅ Confirmed |
| Major Trauma 300% (TRC $20k) | $59,999 → OK | $60,000 → OK | $60,001 → error | ✅ Confirmed |
| Major Trauma $2M ceiling | $1,975,000 → OK | — | $1,975,001 → error | ✅ Confirmed |
| IP cap ($30k/mo) | $29,999 → OK | $30,000 → OK | $30,001 → error | ✅ Confirmed (auto-defaults to $30k at $560k+ income) |
| Workability cap ($10k/mo) | $9,999 → OK | $10,000 → OK | $10,001 → error | ✅ Confirmed ($160k income = exact boundary) |
| Bundling: Life $100k | $99,999 → None | $100,000 → 15% | — | ✅ Confirmed |
| Bundling: Trauma $25k | $20,000 → None | $25,000 → 15% | — | ✅ Confirmed (exact between $20-25k) |
| Business Expenses ($16,666) | — | — | $16,667 → error | 🔲 Not probed |
| Acd Death max age (70) | 70 → activates OK | — | 71 → activates + error | ✅ Confirmed |

### 3.3 Decision Table: Disability Cover Combinations

| M&L | IP | Workability | Result |
|-----|----|----|--------|
| ❌ | ❌ | ❌ | No disability covers |
| ✅ | ❌ | ❌ | M&L alone — valid |
| ❌ | ✅ | ❌ | IP alone — valid |
| ❌ | ❌ | ✅ | Workability alone — valid |
| ✅ | ✅ | ❌ | M&L + IP — **valid** (coexist) |
| ✅ | ❌ | ✅ | M&L + Workability — **BLOCKED** (exclusivity error) |
| ❌ | ✅ | ✅ | IP + Workability — **BLOCKED** (exclusivity error) |
| ✅ | ✅ | ✅ | All three — **BLOCKED** (Workability conflicts with both) |

**All 8 combinations confirmed via live probing ✅**

### 3.4 Decision Table: Policy Type × Cover Availability

| Cover | Personal | Business |
|-------|----------|----------|
| Life | ✅ | ✅ |
| TPD | ✅ | ✅ |
| Trauma | ✅ | ✅ |
| Cancer | ✅ | ❌ |
| Acd. Death | ✅ | ❌ |
| Needlestick | ✅ (AA only) | ❌ |
| Specific Injury | ✅ | ✅ |
| Mortgage & Living | ✅ | ✅ (shared) |
| Income Protection | ✅ | ❌ |
| Workability | ✅ | ❌ |
| Business Expenses | ❌ | ✅ |
| Business Disability | ❌ | ✅ |
| Farmers Disability | ❌ | ✅ |

**Business policy menu confirmed via live probing ✅**

---

## Step 4: Comprehensive Test Scenarios

### 4.1 Happy Paths (Valid Variations)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| HP-01 | Standard adult, single Life cover | Age 35, Male, AA, Life $500k | Premium calculated, no errors |
| HP-02 | Multi-cover with bundling | Age 40, Female, A1, Life $200k + TPD $200k | 15% discount |
| HP-03 | 3-cover bundling | Age 35, Male, B, Life $100k + TPD $100k + Trauma $25k | 20% discount |
| HP-04 | Disability cover M&L | Age 30, Male, AA, Employed, $120k income, M&L at max ($4,500) | Premium calculated |
| HP-05 | IP at tier 2 income | Age 35, Male, AA, Employed, $400k income, IP at default ($23,333) | Premium calculated |
| HP-06 | Workability at cap | Age 45, Male, B, Employed, $200k income, Workability ($10,000) | Premium calculated |
| HP-07 | M&L + IP together | Age 35, Male, AA, Employed, $150k, both at max | No exclusivity error |
| HP-08 | Child band Life $50k | Age 15, Male, AA, Life $50,000 | No cap error |
| HP-09 | Young adult TPD $250k Modified | Age 20, Male, AA, TPD $250k, Definition=Modified | No cap error |
| HP-10 | Business policy standard | Business, Life $500k + TPD $500k + Business Expenses $16,666 | Premium calculated |
| HP-11 | Acd Death at max age | Age 70, Male, AA, Acd Death $500k | No age error |
| HP-12 | Needlestick with companion (AA) | Age 35, Male, AA, Life $100k + Needlestick $100k | No companion error |

### 4.2 Edge Cases & Conditional Paths

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| EC-01 | Major Trauma at TRC=$25k threshold | TRC $25,000, Major Trauma $1,975,000 | OK (no 300% cap, only $2M ceiling) |
| EC-02 | Major Trauma at TRC=$24,999 | TRC $24,999, Major Trauma $74,998 | OK (300% = $74,997, testing $74,998 for rounding) |
| EC-03 | IP at tier 1/2 boundary ($320k) | Income $320,000, IP auto-default | Should be $20,000 (75% × $320k / 12) |
| EC-04 | IP at tier 2/3 boundary ($560k) | Income $560,000, IP auto-default | Should be $30,000 (cap) |
| EC-05 | Workability at cap boundary ($160k) | Income $160,000, Work auto-default | Should be exactly $10,000 |
| EC-06 | DOB sets extreme age | DOB = 1950 → ANB ~76 | Age error should trigger |
| EC-07 | Gender change with active covers | Covers configured → switch Male↔Female | Full recalc, premium changes |
| EC-08 | OCC change with active Needlestick (AA→B) | AA + Needlestick active → switch to B | Behavior unclear — needs probing |
| EC-09 | Uncommitted DC cover + Apply | Activate M&L but never focus/blur benefit field | Cover should be silently dropped |
| EC-10 | Life Cover duplicate instances | Click Life twice | 2nd instance appears with Level 50 default |
| EC-11 | Inflation Adj + Premium Freeze | Both checked | Silent mutual exclusion (one unchecks) |
| EC-12 | Zero-value Sum Insured field + Apply | Life activated, SI left at "." | $240 minimum premium error |

### 4.3 Negative Paths & Validation Triggers

| # | Scenario | Setup | Expected Error |
|---|----------|-------|----------------|
| NP-01 | Age below range | Age = 10 | "between 11 and 75" |
| NP-02 | Age above range | Age = 76 | "between 11 and 75" |
| NP-03 | Age empty + Apply | No age entered + cover active | "Required field!" + "You must complete..." |
| NP-04 | Life SI > $50k at ANB 15 | Age 15, Life $999,999 | "Maximum 'Life Cover'... $50,000" |
| NP-05 | TPD SI > $250k at ANB 20 | Age 20, TPD $300k | "maximum 'TPD Cover'... $250,000" |
| NP-06 | TPD at age 15 | Activate TPD at ANB 15 | "minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17" |
| NP-07 | TPD > $5M | TPD $5,000,001 | "maximum total Sum Insured per life for TPD Cover is $5,000,000" |
| NP-08 | Acd Death > $1M | Acd Death $1,000,001 | "maximum sum insured for Accidental Death Cover is $1,000,000" |
| NP-09 | Acd Death at age 71 | Age 71, Acd Death $100k | "maximum Age Next Birthday for Accidental Death Cover is 70" |
| NP-10 | Major Trauma exceeds 300% | TRC $20k, MT $60,001 | "maximum Sum Insured for Major Trauma Benefit..." |
| NP-11 | Combined Trauma >$2M | TRC $25k + MT $1,975,001 | "maximum total Sum Insured per life for Trauma Recovery Cover... $2,000,000" |
| NP-12 | Specific Injury standalone | Only SI active, no companion | "Specific Injury Lump Sum requires one of the following..." |
| NP-13 | Workability + M&L | Both active and committed | "not available to be taken in conjunction..." |
| NP-14 | Workability + IP | Both active and committed | "not available to be taken in conjunction..." |
| NP-15 | IP exceeds formula cap | Income $150k, IP $10,000 | "maximum remaining monthly benefit for Income Protection benefit is $9,375" |
| NP-16 | M&L exceeds formula cap | Income $150k, M&L $6,000 | "maximum remaining monthly benefit for Mortgage and Living... $5,625" |
| NP-17 | No cover + Apply | No covers activated | "Please add at least one cover to this policy" |
| NP-18 | Employment Status missing + Apply | Employment = "Select one" | "Please complete the client's employment details before applying" |
| NP-19 | IC occupation, fields incomplete | OCC=IC, missing income | "Please contact underwriting as this Occupation requires Individual Consideration" |
| NP-20 | Minimum premium breach | Cover with very low SI | "minimum premium is $240.00 per year per Life insured" |

---

## Step 5: Logical Gaps & Vulnerability Report

### 5.1 Document Corrections Required (confirmed via live testing)

| # | Issue | What Docs Say | What App Actually Does | Impact |
|---|-------|---------------|------------------------|--------|
| GAP-01 | Needlestick button DOM removal | LSC-02: "completely removed from the DOM" for non-AA | Button PRESENT for all OCCs; click is no-op for non-AA | Tests must assert on activation behavior, not DOM presence |
| GAP-02 | TPD "silently blocked" below 17 | PD-29: "button click is a no-op" | TPD activates (SI field appears), error shows immediately | Corrected in docs 2026-08-19 |
| GAP-03 | Employment Status hides Disability section | PD-20: "Reveals the Disability Covers section... leaving it at 'Select one' hides..." | Disability cover buttons VISIBLE regardless of Employment Status | All cover buttons always rendered |
| GAP-04 | AM disables Cancer/Acd Death/SI | LSC-03: "additionally disables" | Buttons present for AM; enforcement on activation/apply only | Need to probe activation at AM specifically |
| GAP-05 | Acd Death button text | Docs say "Accidental Death" | Button text is `Acd. Death` | Tests must use abbreviated text |
| GAP-06 | **Needlestick AA-only restriction removed** | LSC-02: "only available for OCC=AA" | Needlestick activates for ALL OCC codes (B, AA both confirmed) | **LSC-02 may be completely obsolete** — the restriction appears to have been removed from the current app version. Tests should NOT assert OCC-based Needlestick blocking. |
| GAP-07 | **M&L has undocumented $7,500/month hard cap** | DC-15: formula stated as `45% × income / 12` with no cap | App caps at $7,500 regardless of income above $200k. Error: "maximum remaining monthly benefit... is $7,500" | DC-15 corrected. Formula is actually `min($7,500, 45% × income / 12)`. |

### 5.2 Ambiguities in Business Rules (No Clear Spec)

| # | Ambiguity | What's Unknown |
|---|-----------|---------------|
| AMB-01 | Needlestick state-dependency | If OCC=AA, activate Needlestick, then change to OCC=B — does Needlestick persist or error? |
| AMB-02 | M&L bundling threshold exact boundary | Docs say "$500–$1,000/mo" — exact cutoff between these not narrowed |
| AMB-03 | Cancer/IP/Workability bundling minimums | Inferred but "not independently tested" per docs |
| AMB-04 | IC occupation + all fields filled | Does the warning disappear, or does it always block Apply? |
| AMB-05 | Maximum number of Life Cover instances | Docs say "at least 2 confirmed, likely 3" — hard limit unknown |
| AMB-06 | Kids Cover DOB bounds | "~21-year rolling window" — exact min/max dates not confirmed |
| AMB-07 | Needlestick companion cover list | Is it enforced on activation, or only on Apply? |

### 5.3 Potential Bypass Vectors

| # | Vector | Description | Risk |
|---|--------|-------------|------|
| BYP-01 | OCC change after cover activation | Activate covers at eligible OCC, then change to ineligible OCC — do existing covers survive? | Medium — could result in invalid quotes persisting |
| BYP-02 | Age change after cover activation | Activate Acd Death at 70, then change age to 71 — does existing cover error, persist, or silently drop? | Medium |
| BYP-03 | Income reduction after DC activation | Enter $200k, commit IP at $12,500, then reduce income to $100k — does cap retroactively enforce? | Medium |
| BYP-04 | Uncommitted DC cover as pseudo-active | Activate DC cover but never commit (phantom per DC-01) — does it block Apply, count for anything? | Low — documented as "silently dropped" |
| BYP-05 | Rapid multiple policy creation | Spam Personal/Business buttons — any limit? | Low |

### 5.4 Probing Still Required

| Category | What Needs Testing | Priority |
|----------|-------------------|----------|
| PREM | Bundling TPD $100k exact boundary (field targeting issue in probe — known to pass from local test run) | Low — likely confirmed |
| LSC | AM occupation cover activation (Cancer, Acd Death, SI — do they error on activation or Apply?) | Medium |
| DC | Farmers Disability OCC + Employment gate | Medium |
| DC | Business Disability + Farmers mutual exclusion | Medium |
| DC | Mental Health checkbox disabled at BP=2yr | Low |
| DC | Ten-Hour auto-check for Self-Employed | Low |

### 5.5 Newly Confirmed Findings (this session)

| # | Finding | Details |
|---|---------|---------|
| NEW-01 | **Payment frequencies are independently calculated** | Monthly=$38.06, Fortnightly=$17.57, Quarterly=$114.19, Half Yearly=$224.03, Yearly=$435.00. Monthly×12=$456.72 ≠ Yearly=$435.00. Each frequency has its own rate table — NOT derived from Annual÷N. |
| NEW-02 | **POL-05 confirmed both directions** | Checking Freeze unchecks Inflation; checking Inflation unchecks Freeze. Silent, no error message. |
| NEW-03 | **POL-12 wording slightly different** | Modal says *"Please correct the errors before proceeding to another life"* (docs said *"minimum requirement for a quote"*). Same blocking behavior. |
| NEW-04 | **Kids DOB bounds confirmed** | Kid DOB: min=2005-08-21, max=2026-08-19 (relative to today 2026-08-19). Adult DOB: min=1952-08-19, max=2016-08-19. |
| NEW-05 | **Kids SI tiers: 16 options** | $50,000 (Free), $60k–$200k in $10k steps. Confirmed exactly as documented. |
| NEW-06 | **KID-08 error text confirmed** | *"Please add at least one Personal Insurance Cover before adding Kids Cover"* |
| NEW-07 | **Needlestick activates for ALL OCCs** | Both OCC=B and OCC=AA successfully activated Needlestick (selects increased from 6→8 in both cases). The AA-only restriction documented in LSC-02 appears to have been removed from the current app version. **This is the most significant discrepancy found.** |
| NEW-08 | **Bundling: Trauma $25k is the exact threshold** | At Trauma $24,999 + Life + TPD: discount still "None" (Trauma doesn't count). At $25,000: "15% (2 covers)" — confirming Trauma counts at exactly $25k. Note: the "2 covers" text suggests only Life + Trauma counted (TPD field entry issue). |
| NEW-09 | **M&L has a hard cap of $7,500/month** | Docs previously stated DC-15 formula as `45% × income / 12` with no cap. Live testing at $320k and $400k income confirms the auto-default stays at $7,500 (= 45% × $200k / 12). Error message: *"The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $7,500."* The cap is equivalent to treating income as capped at $200k for M&L purposes. |

---

## Appendix: Confirmed Field IDs (for test automation)

```
Age:            input[id*="Input_AgeNextBirthday"]
DOB:            input#b15-Input_BirthDate
First Name:     input#b15-Input_FirstName
Last Name:      input#b15-Input_LastName
Income:         input#b15-Input_AnnualIncome (or b15-b4-MaskedInput)
OCC Code:       select#b15-OccupationCode_Dropdown
Employment:     select#b15-EmploymentStatus_Dropdown
Gender:         .button-group-item (Male/Female)
Smoking:        .button-group-item (Yes/No) — "No" has .button-group-selected-item
Cover buttons:  button.cover-button (text: Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury, Mortgage & Living, Income Protection, Workability)
Sum Insured:    input[id*="Input_SumInsured"]
Inflation Adj:  input#b23-b1-Checkbox_InflationAdjustmentBenefit
Premium Freeze: input#b23-b1-Checkbox_PremiumFreeze
We Pay Premiums: select#b23-b1-Dropdown_Premiums
Flexi Rate:     select#b23-b1-Dropdown_FlexiRate
Payment Freq:   select[id*="PaymentFrequencyDropdown"]
Kids Count:     select#b23-b14-Dropdown1
Remove link:    a (innerText = "Remove")
Apply button:   button role="button" name="Apply"
```
