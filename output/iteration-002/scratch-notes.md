# Scratch notes — Quote screen (Illustration step) business rules
Working file. Will be synthesized into final quote-screen-business-rules.md at the end.

## Screen identity
- URL: /QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=
- Title: "Quote" (page title "Quote", section header "Illustration")
- Reached via StartJourney (/QuoteAndApply/) -> "New Quote" link -> opens in new tab with blank QuoteId/ApplicationId

## Top-level structure
- "Illustration" header + "Add life" button (adds another Life tab, e.g. Life 2 — for joint/multi-life quotes) — NOT YET TESTED
- Tabs: "Life 1" (per life insured)
  - Personal Details (accordion, expanded by default)
  - Policies (accordion) -> tabs "Personal" / "Business" (Personal selected by default)
    - Policy-level toggles: Inflation Adjustment Benefit (checkbox), Premium Freeze (checkbox), We Pay Your Premiums (dropdown), Flexi Rate (dropdown)
    - Lump Sum Covers (accordion, count badge)
    - Disability Covers (accordion, count badge)
    - Kids Cover (accordion, count badge)
- Right rail: Premium summary panel (sticky) + per-life premium breakdown, Adviser Use / Loadings popups

## Personal Details fields (ids stable enough within a session — OutSystems regenerates per load)
| Field | Type | id pattern | Mandatory? | Notes |
|---|---|---|---|---|
| First Name | text | b15-Input_FirstName | not enforced at Apply-time with empty form (no error surfaced) | |
| Last Name | text | b15-Input_LastName | same as above | |
| Date of birth | date text w/ picker | b15-Input_BirthDate | not enforced (Age used instead for premium calc) | placeholder "Select a date" |
| Age next birthday* | number spinbutton | b15-Input_AgeNextBirthday | YES — required=true in DOM; premium calc blocked without it | labeled with * |
| Gender* | radio group (Male/Female) | b15-ButtonGroup_Gender | YES | labeled with *; standard Playwright click works fine (no scrollIntoView hack needed via real browser automation) |
| Smoking status (incl. vapes & e-cigarettes)* | radio group (Yes/No) | b15-ButtonGroup_Smoker | YES | defaults to "No" |
| Occupation | React-Select searchable combobox | vscomp-ele-wrapper-* | not blocking premium calc in test (left blank, premium still computed) — TBC if blocks Apply/Next step | free text search |
| Occupation code | native select | b15-OccupationCode_Dropdown | options: (blank), AM, AA, A1, A2, B, C, S, U, IC | default blank (-1) |
| Employment status | native select | b15-EmploymentStatus_Dropdown | options: Select one, Employed, Self-Employed, Employed by own company, Other | default "Select one" (-1) |
| Pre-tax annual income ($)* | text/currency | b15-b4-MaskedInput | labeled with * | tooltip: "Annual income can include salary, wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax." |

### Validation behavior observed
- Clicking "Apply" with a completely empty form (no covers, no personal details) surfaces ONE banner error at top of Personal Details:
  "The minimum premium is $240.00 per year per Life insured."
  — no other field-level errors appear at this point (First Name/Last Name/DOB/Occupation/Employment/Income did NOT show as required in this state).
- Once a Lump Sum Cover is added (e.g. Life, Sum Insured $200,000), a PER-COVER inline error appears on the cover card itself:
  "You must complete the following fields: Gender & Age Next Birthday."
  — this is scoped to the cover card (Life Cover A), not a generic banner. Implies premium calc engine needs Gender+Age minimum to price ANY cover.
- After Age (35) + Gender (Male) are set, error clears and premium recalculates automatically (no manual "calculate" step) — Total Yearly Premium: $254.16 (Monthly $21.18 x 12), which clears the $240 minimum-premium banner (240 < 254.16).
- Minimum premium rule = $240.00/year per Life insured, evaluated against Total Annualised Premium (all covers for that life); real-time, clears as soon as premium total crosses threshold.

## Policy-level toggles (Personal tab)
| Element | Type | Default | Notes |
|---|---|---|---|
| Inflation Adjustment Benefit | checkbox | CHECKED by default | id b23-b1-Checkbox_InflationAdjustmentBenefit |
| Premium Freeze | checkbox | unchecked | id b23-b1-Checkbox_PremiumFreeze |
| We Pay Your Premiums | select | "None" | options: None, 30 days, 60 days, 90 days. Tooltip: "Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period." id b23-b1-Dropdown_Premiums |
| Flexi Rate | select | "N/A" | options: N/A, 2.5%, 5.0%, 7.5%, 10.0%, 12.5%, 15.0%, 17.5%, 20.0%, 22.5%, 25.0%, 27.5%, 30.0%. Tooltip: "Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission." id b23-b1-Dropdown_FlexiRate |

## Lump Sum Covers — top-level buttons (before any activated)
Life, TPD, Trauma, Cancer*, Acd. Death, Needlestick*, Specific Injury*
(* = has its own tooltip on the toggle button itself, others don't)
- Cancer tooltip: "Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit."
- Needlestick tooltip: "For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV."
- Specific Injury tooltip: "The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Personal Insurance cover." -> DEPENDENCY: requires >=1 other eligible Personal Insurance cover already active. NOT YET VERIFIED (need to test activating alone to see if blocked/errored).

### LIFE cover (activated)
- Card label: "Life Cover A" + Remove link
- Sum Insured ($): min 0 / max 99999999 (DOM attrs), maxLength 10. Uses calc-mask input (see automation note below). Tooltip: "The large sum insured discount bands for Life Cover are: $150,000–$199,999 / $200,000–$249,999 / $250,000–$299,999 / $300,000–$349,999 / $350,000–$399,999 / $400,000–$499,999 / $500,000–$749,999 / $750,000–$999,999 / $1,000,000+"
- Premium Structure: select — Stepped (default), Level to 50, Level to 60, Level to 65, Level to 70, Level to 75, Level to 80, Level to 100
- Sub-cover riders (buttons, each adds its own nested card, mutually does NOT disable Life): TI Support, Acc. TPD, Acc. Trauma, Acc. Cancer
  - Once a rider is activated, ITS OWN toggle button becomes `disabled` (can't re-click to toggle off — must use the rider card's "Remove" link instead)
  - TI Support: tooltip "Pays the Terminal illness support benefit sum insured if diagnosed as terminally ill with less than 24 months to live. Apply for up to 100% Life Cover sum insured to a maximum of $300,000." -> cap = MIN(100% of Life SI, $300,000). Card fields: Sum Insured ($) [independent editable input], Premium Structure [DISABLED select, locked/mirrors parent "Stepped"]
  - Acc. TPD ("Accelerated TPD"): NO tooltip on toggle button. Card fields: Sum Insured ($), Premium Structure [disabled, mirrors parent], **Definition** select — options: Own, Any, Modified (default "Own") = TPD definition type
  - Acc. Trauma ("Accelerated Trauma"): NO tooltip on toggle button. Card fields: Sum Insured ($), Premium Structure [disabled, mirrors parent], plus nested sub-benefit checkboxes/buttons:
    - Early Trauma Benefit (checkbox, unchecked default) — tooltip: "The Early trauma benefit provides a partial payment for an additional 20 conditions which are less severe in nature. It pays the greater of $10,000 or 20% of the Trauma Recovery sum insured, up to a maximum of $100,000."
    - Trauma Reinstatement (checkbox) — tooltip: "Trauma reinstatement benefit allows reinstatement of Trauma Recovery Cover 12 months after a claim is made. There must be enough Life Cover to support the Trauma Recovery Cover reinstatement or Life Cover buy-back benefit should be selected." -> DEPENDENCY: needs sufficient Life Cover SI or Life Cover Buyback selected
    - Continuous Trauma Benefit (checkbox) — tooltip: "...Automatically reinstating the sum insured immediately after claim and allowing for up to 3 full trauma claims to be made under the policy for the same insured person."
    - Life Cover Buyback (checkbox, no tooltip captured yet)
    - Major Trauma (button/toggle) — tooltip: "...A maximum of 300% of the TRC sum insured applied if TRC is less than $25,000." -> cap = 300% of Trauma Recovery SI if TRC < $25,000 (implies different/lower cap logic above $25k — NEEDS FOLLOW-UP)
    - TPD on Trauma (button/toggle, no tooltip captured yet)
  - Acc. Cancer: tooltip identical to standalone Cancer tooltip. Presumably same card shape as Cancer standalone (NEEDS CONFIRMATION).

### Automation gotcha confirmed this session
- Standard Playwright browser_click DOES work for OutSystems radio groups (Gender) — no scrollIntoView+coordinate hack required when using true Playwright mouse events (unlike the old server.js `force:true` click, which the existing playbook warned about).
- Cover-toggle buttons (Life/TPD/Trauma/.../TI Support/Acc. TPD etc.) respond to a plain JS `.click()` via evaluate — worked fine both for activating AND is blocked (correctly, since native disabled buttons ignore .click()) once a rider is active and its button gets `disabled`.
- Sum Insured calc-mask field: typing full string via `pressSequentially`/`type` in one go corrupts the mask (produces ".2.0.0.0.0.0."-style garbage in the raw `value` DOM property). Correct approach: click field, press Backspace ~10x to clear to ".", then press digit keys ONE AT A TIME via real key presses. NOTE: even after this, the raw `input.value` DOM property can appear stale/garbled when read via evaluate — the ACCESSIBLE/rendered value (via snapshot, e.g. "200,000") is the reliable source of truth, not `element.value`.

## Apply-time dynamic validation (KEY TECHNIQUE)
Clicking "Apply" (or presumably "Save"/"Next") re-evaluates and displays, per cover card, a live list of:
1. Cross-cover dependency requirements (e.g. Specific Injury)
2. Max Sum Insured breaches
3. Currently-missing mandatory personal fields needed to price THAT cover
This list is DYNAMIC — re-run Apply after fixing one issue and the message shrinks to only what's still wrong (confirmed: TPD's message went from "Gender, Age Next Birthday & Occupation/Occupation Code" -> "employment status" only -> none, as each was fixed in turn). This is the most reliable way to enumerate a cover's full mandatory-field + limit rule set: set an oversized/edge Sum Insured, click Apply, read the error text, fix one thing at a time.

Mandatory personal fields needed to price ANY Lump Sum cover (confirmed via this technique): Gender, Age Next Birthday, Occupation (or Occupation Code for quick quote), Employment status.

## TPD cover (standalone)
- Card: "TPD A" / Remove
- Sum Insured tooltip (large-SI discount bands): $100,000–$249,999 / $250,000–$499,999 / $500k+
- **Max Sum Insured per life for TPD Cover: $5,000,000** (exact error: "The maximum total Sum Insured per life for TPD Cover is $5,000,000.")
- Premium Structure options: Stepped, Level to 65, Level to 70 (NARROWER set than Life's 7 options — no 50/60/75/80/100)
- Extra field: **Definition** select — Own, Any, Modified (default "Own") — TPD definition type, present directly on standalone TPD (not just the Accelerated TPD rider)
- Selecting an Occupation via the React/virtual-select search AUTO-POPULATES and DISABLES the Occupation Code dropdown (locks to the derived code, e.g. "Civil Engineer - qualified." -> code "AA")

## Trauma cover (standalone) — "Trauma Recovery Cover"
- Card: "Trauma A" / Remove
- **Max Sum Insured per life for Trauma Recovery Cover, INCLUDING Cancer Cover: $2,000,000** (shared/combined cap — exact error: "The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000.")
- Premium Structure options: Stepped, Level to 65, Level to 70 (same narrow set as TPD)
- Sub-benefit checkboxes: Early Trauma Benefit, Trauma Reinstatement, Continuous Trauma Benefit (no "Life Cover Buyback" on standalone — that's Accelerated/rider-only, makes sense since there's no parent Life SI to buy back into)
- Sub-benefit toggle buttons: Major Trauma, TPD on Trauma
- (See Life > Acc. Trauma section above for full tooltip text of each sub-benefit)

## Cancer cover (standalone)
- Card: "Cancer A" / Remove
- Shares the SAME combined cap as Trauma: max $2,000,000 total across Trauma+Cancer (same error message)
- Premium Structure options: Stepped, Level to 65, Level to 70
- No sub-benefit checkboxes/buttons — just Sum Insured + Premium Structure
- Tooltip says "provides additional money over and above the Trauma Recovery sum insured" but this is DESCRIPTIVE only — NOT a hard validation dependency. Confirmed: Cancer can be activated and priced with $50,000 SI with ZERO other covers active and no error. (Contrast with Specific Injury, which DOES hard-block without a companion cover — see below.)

## Acd. Death cover (standalone) — "Accidental Death Cover"
- Card name is actually "Accidental Death A" (button label abbreviates to "Acd. Death")
- **Max sum insured for Accidental Death Cover: $1,000,000** (exact error: "The maximum sum insured for Accidental Death Cover is $1,000,000.") — this is a flat per-cover max, not "per life"/combined wording like Trauma/Cancer
- Premium Structure options: full set — Stepped, Level to 50, 60, 65, 70, 75, 80, 100 (same as Life)
- No sub-benefits

## Needlestick cover (standalone)
- Card: "Needlestick A" / Remove
- **Sum Insured is a FIXED SELECT DROPDOWN, not a free-text/calc-mask field** — options: $0, $50,000, $100,000, $150,000, $200,000, $250,000, $300,000, $350,000, $400,000, $450,000, $500,000 (i.e. max $500,000, in $50k increments)
- Premium Structure: full set (Stepped, 50/60/65/70/75/80/100)
- No sub-benefits

## Specific Injury cover (standalone)
- Card: "Specific Injury A" / Remove
- **HARD DEPENDENCY (blocks at Apply, confirmed via validation message):** "Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability" — i.e. requires >=1 of: Life, Trauma, Cancer, TPD, Acd. Death, Income Protection, Mortgage & Living, Workability (Needlestick and Specific Injury itself do NOT count)
- **Max total Sum Insured per life for Specific Injury Lump Sum: $5,000** (very small cap vs other lump sum covers — exact error: "The maximum total Sum Insured per life for Specific Injury Lump Sum is $5,000")
- Premium Structure: full set (Stepped, 50/60/65/70/75/80/100)
- No sub-benefits

## Automation gotcha: exceeding max Sum Insured
When entered Sum Insured exceeds the cover's max, the premium calc does NOT clamp or partially calculate — Total Yearly/Monthly Premium shows $0.00 and the error banner appears instead. Premium only calculates once SI is within the valid range AND all mandatory personal fields are filled.

## Disability Covers
Mandatory personal fields to price ANY disability cover: Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status, AND (unlike Lump Sum covers) **Annual Income $** — confirmed via error: "You must complete the following fields - Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status & Annual Income $".

Old playbook note about mislabeled Waiting/Benefit Period dropdowns (Dropdown_WaitingPeriod3 / Dropdown2) does NOT reproduce on this Quote/Illustration screen — labels are correct and clean here. That mislabeling may be specific to a later Apply-flow step (UnderwritingDecision), not this screen — flag for the automation team to re-verify in context.

### Mortgage & Living
- Card: "Mortgage & Living" / Remove
- Cover Type select: "Annual Income" (default) / "Monthly Mortgage" — changes the calc basis
- Monthly Benefit ($) — free-text calc-mask input
- Premium Structure: Stepped (default) / Level to Expiry (only 2 options — all disability covers use this narrow set, never the 7-option Life-style list)
- Extra select: **Agreed Value** / **Agreed Value Plus** (default selected) — tooltip: "• Agreed Value - will offset 'other income' from the monthly benefit • Agreed Value Plus - will not offset 'other income' from the monthly benefit"
- Benefit Period select: 2 Years, 5 Years, To Age 65 (default), To Age 70
- Waiting Period select: 14, 30 (default), 60, 90, 180, 365, 730 Days
- Checkboxes: Increasing Claim (checked by default), Income Top-up Package (tooltip: income booster +33% of benefit for first 3 months on full claim, + 25% income bonus when back part-time on claim), Specific Injury Support Benefit — Monthly variant (tooltip: "pays a multiple of the monthly benefit for specified injuries... while receiving payments under this benefit no additional Living or Homemaker Support benefit is payable"), Immediate Assist Package (tooltip: Bed-Confinement daily benefit during waiting period + Crisis Benefit on diagnosis of 1 of 11 specified conditions regardless of waiting period), Ten-Hour Benefit (checked by default; tooltip: "work up to 10 hours per week without affecting your Living support benefit"), Mental Health Discount (unchecked, no tooltip)
- Toggle button: Split Benefit — tooltip: "Splits the total monthly benefit into two sums insured to allow a top-up on the base cover or different waiting periods."
- **Max monthly benefit formula (Agreed Value Plus, Annual Income basis) = 45% × Annual Income ÷ 12.** Confirmed exact: income $150,000 -> max $5,625. Exact error text: "The maximum remaining monthly benefit for Mortgage and Living Cover Agreed Value Plus is $5,625" (note "remaining" wording — see cross-cover note below; in practice the cap did NOT change when combined with other covers in testing, so "remaining" appears to just be standard phrasing, not evidence of a shared pool — Workability's incompatibility, not a shared cap, is what actually links these covers — see Workability below).

### Income Protection
- Card: "Income Protection" / Remove
- Cover type select: **Loss Of Earnings** / **Loss Of Earnings Plus** (default selected) — same offset-vs-not distinction as M&L's Agreed Value / Agreed Value Plus, just different naming
- Same field shape as M&L minus the Cover Type (Annual Income/Monthly Mortgage) selector: Monthly Benefit ($), Premium Structure (Stepped/Level to Expiry), Benefit Period (2/5 Years, To Age 65 default, To Age 70), Waiting Period (14/30 default/60/90/180/365/730 days)
- Same checkbox set as M&L (Increasing Claim checked default, Income Top-up Package, Specific Injury Support Benefit, Immediate Assist Package, Mental Health Discount) MINUS Ten-Hour Benefit
- Toggle button: **Split Waiting Period** (not "Split Benefit") — tooltip: "Splits the total monthly benefit into two sums insured each with a different waiting period."
- **If Monthly Benefit ($) is left BLANK, the field auto-defaults to the calculated max and premium calculates successfully anyway** (confirmed: left blank, Apply produced no error, and Total Yearly Premium calculated as $32,003.64 i.e. $2,666.97/month for an implied $9,375 benefit) — this is DIFFERENT from Lump Sum covers, where blank Sum Insured fields would presumably block pricing. NEEDS FOLLOW-UP: confirm M&L behaves the same way when left blank (not yet tested — only tested M&L with an oversized value).
- **Max monthly benefit formula = 75% × Annual Income ÷ 12.** Confirmed exact: income $150,000 -> max $9,375. Exact error text: "The maximum remaining monthly benefit for Income Protection benefit is $9,375"

### Workability
- Card: "Workability" / Remove
- Simplest of the three: NO Cover Type selector, NO Agreed-Value-style offset selector
- Fields: Monthly Benefit ($), Premium Structure (Stepped/Level to Expiry)
- Benefit Period select: **only** To Age 65, To Age 70 (no 2/5 Years options — narrower than M&L/IP)
- Waiting Period select: **30, 45, 60, 75, 90 Days only** (completely different set from M&L/IP's 14/30/60/90/180/365/730 — no long-tail options)
- Only ONE checkbox: Increasing Claim (no Income Top-up/Specific Injury/Immediate Assist/Mental Health Discount/Split-anything)
- **Max monthly benefit formula = 75% × Annual Income ÷ 12** (same as Income Protection). Exact error text: "The maximum allowable monthly benefit for Workability based on annual income $150,000 is $9,375" (note: different phrasing from IP/M&L — "maximum allowable... based on" vs "maximum remaining" — but numerically identical formula/cap; the "remaining" wording elsewhere does NOT indicate a shared/depleting pool, since this cap did not shrink when other covers were added — see hard exclusivity rule below instead)
- **HARD MUTUAL-EXCLUSIVITY RULE (confirmed via validation message):** "Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover" — i.e. Workability cannot coexist with EITHER Mortgage & Living OR Income Protection on the same life. (Not yet tested: whether Workability can coexist with itself doubled, or whether M&L + IP can coexist with each other — worth testing in automated suite.)

CONFIRMED: Mortgage & Living AND Income Protection CAN coexist together (no exclusivity error) — the exclusivity rule is specific to Workability vs {M&L, IP}, not M&L vs IP.
NEW RULE found while testing coexistence: once 2+ covers are active, Apply also requires **"Please select Commission Structure in Adviser Use for all applicable covers"** — i.e. Commission Structure inside the "Adviser Use" popup becomes mandatory per cover once multiple covers exist. (Single-cover quotes did not show this error in earlier tests — worth re-verifying whether it's actually tied to cover COUNT ≥2 or something else, e.g. total premium threshold.)

## TODO remaining
- [ ] Confirm M&L auto-default-when-blank behavior (like IP) vs strictly requiring input
- [ ] Confirm exact trigger for "select Commission Structure in Adviser Use" (cover count? premium threshold?) — inspect Adviser Use popup contents
## Kids Cover
- "Number of Kids" select: 0–9
- Selecting N > 0 generates N repeated "Kid N" blocks, each with: First Name, Last Name, Date of birth, Gender (Male/Female), Sum insured select
- Sum insured options are a FIXED TIER LIST: $50,000 (labelled "(Free)" — no additional premium), then $60,000, $70,000 ... up to $200,000 in $10,000 increments
- Kids Cover section only appears under the **Personal** policy tab — not present under Business (see below)

## Adviser Use popup ("Commissions" dialog)
- "Default for agency (40002)" select: Please Select / LEVEL 30 (default) / SPREAD 20 / UPFRONT, + disabled "Update" button
- "Split commission" checkbox — tooltip: "You should only select this option if you do not have an existing default commission split."
- Per-policy table (e.g. "Personal Insurance 1") with columns: Commission Structure / Premium Structure / Sum Insured ($) Benefit Amount
- "Select IC/RC" select: Please Select / "IC-100%, RC-100%" (default)
- "Select All" select: bulk-applies a Commission Structure (LEVEL 30/SPREAD 20/UPFRONT) to every cover row at once
- Each active cover gets its own row with its own Commission Structure select (defaults to LEVEL 30) plus read-only Premium Structure and Sum Insured/Benefit Amount
- **Validation:** once 2+ covers are active, Apply requires every cover's Commission Structure to be set (not "Please Select") — exact error: "Please select Commission Structure in Adviser Use for all applicable covers". Single-cover quotes did not trigger this in earlier tests, though covers defaulted to LEVEL 30 already so the exact trigger condition (count vs something else) wasn't conclusively isolated — flag for automated-test follow-up.

## Loadings popup
- Toggle: Percentage / Per Mille (rate input mode)
- One "loading %" select PER COVER CATEGORY: Life, TPD, Trauma Recovery, Cancer Cover, Disability — each independently selectable: None, 25%, 50%, 75%, 100%, ... up to 400% in 25% steps
- This applies an underwriting risk loading multiplier per category, independent of which specific covers within that category are active

## Business tab (vs Personal tab) — CONFIRMED STRUCTURAL DIFFERENCES
- "Premium Freeze" checkbox is ABSENT on Business (Personal-only toggle). Inflation Adjustment Benefit, We Pay Your Premiums, Flexi Rate all still present.
- **Lump Sum Covers menu is narrower on Business:** only Life, TPD, Trauma, Specific Injury (4 options) — Cancer, Acd. Death, and Needlestick are NOT offered under Business.
- **Disability Covers menu is entirely different on Business:** Business Expenses, Business Disability, Farmers Disability, Mortgage & Living (4 options) — Income Protection and Workability (Personal-only) are replaced by three business-specific covers; Mortgage & Living is the only cover shared between Personal and Business.
- Mortgage & Living's field shape under Business (Monthly Benefit, Premium Structure Stepped/Level to Expiry, Benefit Period 2/5yr/To65/To70, Waiting Period 14–730 days) matches the Personal-tab version exactly.
- Kids Cover section does not appear under Business (kids cover is a Personal-only concept).
- NOT YET EXPLORED in depth (flagged for a follow-up pass, same "oversized value + Apply" technique should work): Business Expenses, Business Disability, Farmers Disability — their own field sets, max-benefit formulas, and dependencies are undocumented so far.

## MAJOR CORRECTION: "Personal" / "Business" are NOT tabs — they are "Add Policy" buttons
This invalidates the earlier report's §8 framing (Business as an alternate exclusive view of the same policy). Re-tested cleanly:

- The **"Personal" and "Business" buttons are ADD-POLICY actions**, not a toggle/tab pair. Each click creates a brand-new, independently-numbered policy instance (Personal 1, Personal 2, Business 1, Business 2, ...) and immediately switches the panel to show/edit that new (empty) policy.
- **A single Life can carry MULTIPLE Personal policies AND multiple Business policies simultaneously.** Confirmed by creating Personal 1, Business 1, Personal 2, Business 2 concurrently (Policies badge counted up to "4").
- The **previously-created policy links** (e.g. "Personal 1", "Business 1") are clickable and switch the panel's Lump Sum/Disability Covers view back to that specific policy's own independent configuration — each policy has its own fully separate cover selections, checkboxes, etc.
- Each policy link has an adjacent **icon-only link with no visible text that instantly deletes that policy** (no confirmation dialog). Confirmed working: removed Personal 2, Business 1, Business 2 individually and the Policies badge/links updated immediately and correctly.
- Policy numbering is **independent per type** — removing "Personal 2" did not renumber "Business 2" down to "Business 1"; each type (Personal vs Business) has its own counter.
- The cover-menu shown (7 Lump Sum options + Cancer/Acd.Death/Needlestick tooltips for Personal; 4 narrower Lump Sum options + Business-flavored tooltips for Business) is a property of **which policy is currently selected**, confirmed by switching between a Personal-type and Business-type policy and watching the exact same accordion re-render with a different button set each time.
- The Specific Injury dependency tooltip text changes based on policy type: Personal's says *"...at least one eligible **Personal** Insurance cover"*; Business's says *"...at least one eligible **Business** Insurance cover"* — strongly implies the dependency check is scoped to covers within the SAME policy, not globally across all policies on the Life (not yet 100% proven with a live Apply-time test across two different policies — flagged as follow-up).
- **Caution for automated testing:** rapid-fire scripted clicks between policies can produce a transient render mismatch (briefly showed a stale cover card under the wrong policy's button palette during this session) — worth a small settle/wait between policy-switch actions in test scripts, and don't trust a single snapshot immediately after switching without a follow-up read to confirm it settled.
- **Open question carried forward:** does the Bundling Discount ("2 cover types: 15%, 3+: 20%") count distinct cover CATEGORIES within one policy, or does having multiple POLICIES (e.g. a Personal + a Business policy) also factor in? Needs a dedicated test now that the multi-policy mechanism is understood.

## Business-only Disability Covers (Business Expenses, Business Disability, Farmers Disability)

All three share the base shape: Monthly Benefit ($) calc-mask, plus Premium Structure and Benefit Period/Waiting Period selects — BUT unlike Personal disability covers, these often come with the Premium Structure and/or Benefit Period **DISABLED/locked** rather than user-selectable.

### Business Expenses
- Card fields: Monthly Benefit ($), Premium Structure (**disabled**, locked to "Stepped" — full option list rendered in DOM but all disabled), Benefit Period (**disabled**, locked to "1 Year" — options are short-term: 6/9/12/18/24 Months, 2 Years, 5 Years, To Age 65, To Age 70, but user cannot change it), Waiting Period (enabled: 14/30/60/90 Days only)
- No checkboxes.
- **Max monthly benefit is OCCUPATION-BASED, not income-based**: exact error *"The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"* (for Civil Engineer - qualified). Formula not a simple % of the $150,000 Annual Income entered (16,666 ≈ income ÷ 9, but this is more likely an occupation-table lookup than a fixed personal-income formula — needs actuarial-table cross-reference, not inferable from UI alone).

### Business Disability
- Card fields: Monthly Benefit ($), Premium Structure (**disabled**, locked to Stepped; full list incl. "Level to Expiry" present but disabled), **Classification** select — Employed / Equity Owner (>75%) / Equity Owner (up to 75%) (default "Employed"), Benefit Period (6/9/12/18/24 Months only — no Years/To-Age options), Waiting Period (30/60/90 Days only — no 14 Days)
- Checkboxes: **Partial Disablement** (checked by default, no tooltip captured), **Business Security** — tooltip: *"Allows future increases without medical underwriting. Financial justification for increases required."*
- **Max monthly benefit: flat $10,000... correction, confirmed exact: "$50,000"** — error: *"The maximum allowable monthly benefit for Business Disability Cover is $50,000"* — a flat cap, not occupation- or income-qualified in the message wording.

### Farmers Disability
- Same shape as Business Disability minus the Classification field. Benefit Period adds a "5 Years" option (6/9/12/18/24 Months + 5 Years). Same two checkboxes (Partial Disablement, Business Security).
- **HARD OCCUPATION-CLASS GATE (confirmed):** with Occupation = "Civil Engineer - qualified.", activating this cover and clicking Apply produces: *"Farmers Disability Cover is not available for the selected occupation"* — the cover is entirely blocked for non-farming occupations, not just capped at $0.
- Switching Occupation to a farming occupation ("Farming / Farmer - Owner / Manager: >5 years' experience...") **removes** that blocking error, leaving only the max-benefit line: *"The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000"* for that specific farming occupation — confirming the cap, like Business Expenses, is occupation-table-driven, not a flat number or simple income percentage.
- **This proves Occupation is a gating field for cover AVAILABILITY, not just a pricing input** — worth testing systematically against other covers too as a general pattern (not yet done for the Personal-tab covers, e.g. does Needlestick or Income Protection have occupation-based availability gates? The Needlestick tooltip already hints "for certain occupations" — follow-up).

## CORRECTED: Apply button's true behavior (supersedes earlier "stability observation" below)
**Apply navigates the SPA forward to a "Client summary" screen once the current configuration is fully valid — WITHOUT changing the browser URL at all.** Confirmed directly: clicked Apply with Life ($200k) + TPD (valid) → page content completely changed to a "Client summary" heading, Life 1 status badge "PRE APPLICATION", new mandatory fields (First Name*, Middle Name, Last Name*, Date of Birth*), a single "Proceed to application" button, and the footer button set changed to just "Return to Quote" (Close/View PDF/Save/Save as New/Apply all disappear) — yet `window.location.href` was byte-for-byte identical to the Quote screen's URL throughout.
- **CRITICAL AUTOMATION GOTCHA:** never use the URL to detect which screen/step is showing in this app — check DOM content instead (e.g. presence of "Illustration" vs "Client summary" heading, or the footer button set). This single-page-app updates screens internally without any URL change.
- A "Return to Quote" button on the Client summary screen goes back to the Quote/Illustration screen with all prior configuration intact.
- This fully explains an earlier misdiagnosed "stuck premium" observation (see superseded note below) — it was very likely silent navigation to this Client summary screen combined with my automation scripts continuing to query for Quote-screen-only elements (which safely no-op/return undefined rather than error), not a genuine calculation defect.

## CORRECTED: Bundling Discount counts BOTH Lump Sum and Disability cover types together
Earlier note incorrectly concluded Disability covers never count toward Bundling Discount. Re-tested cleanly and this is WRONG — the real rule:
- **Bundling Discount = f(count of distinct, properly-priced/committed cover types across Lump Sum + Disability combined)** — 2 distinct types → 15%, 3+ → 20%. Confirmed: Life (Lump Sum) + Income Protection (Disability), both genuinely priced (Life $18.00/mo, Income Protection A $204.79/mo) → Bundling Discount showed **"15% (2 covers)"**.
- The earlier false "None" result for this same Life+IP combination happened because Income Protection's Monthly Benefit field had never been focused/blurred yet (see next section) — it was a phantom **uncommitted** cover contributing $0 and not counted at all, not evidence that disability covers are excluded from the category.
- Exact UI label format observed: "15% (2 covers)" and "20% (3 covers or more..." (truncated in DOM text) — not just the tooltip's generic "X cover types" wording.

## CRITICAL: Disability cover "commitment" mechanism — auto-default requires focus+blur, not just activation
This is a significant, non-obvious rule with direct automated-testing implications:
- Clicking a Disability cover's toggle button (e.g. Income Protection, Mortgage & Living) alone does **NOT** trigger its "auto-default Monthly Benefit to max" behavior. Confirmed: activated Income Protection via a raw button click, left its Monthly Benefit field completely untouched — Total Yearly Premium stayed at the Life-only baseline ($254.16), i.e. IP contributed **$0**.
- The auto-default (max = 75%/45% of Annual Income, per cover — see earlier formulas) only fires once the Monthly Benefit field **receives focus and then blurs** (Tab away, click elsewhere) — even with ZERO characters typed into it. Confirmed: clicked into the blank field, pressed Tab (no typing at all) → Total Yearly Premium immediately jumped to $2,673.48 (Life $254.16 + Income Protection ≈ $2,419.32/yr), and the field's default value took effect.
- **An "activated but never focused" Disability cover is a phantom/uncommitted entry**: it shows in the cover-toggle UI as active, but:
  - Contributes $0 to the premium
  - Does NOT count toward the Bundling Discount cover-type tally
  - Is **silently dropped/not persisted** once you click Apply and proceed (or possibly on any save) — confirmed by activating Income Protection + Mortgage & Living without ever focusing either field, clicking Apply (which succeeded and navigated to Client Summary showing $254.16 — the Life-only amount), then returning to Quote and finding Disability Covers count back at 0 (both silently gone).
- **Automated test implication:** any test scenario that relies on a Disability cover's auto-default max value MUST explicitly click into (and blur/tab out of) that cover's Monthly Benefit field — simply toggling the cover on is insufficient and will produce a false-negative (cover silently missing) if the test later checks for its presence or premium contribution.
- **Not yet tested:** whether this same "phantom until focused" behavior applies to Lump Sum cover Sum Insured fields too, or is specific to Disability covers' auto-default mechanic (Lump Sum covers have no auto-default — they have no valid default SI — so the concept may not directly transfer, but an analogous "does an activated-but-empty Lump Sum cover silently drop on Apply" check would be a good follow-up).

## STABILITY OBSERVATION (SUPERSEDED — root cause now identified above as silent SPA navigation, not corruption; kept for the record)
After extensive rapid, programmatic add/remove/edit cycling across multiple covers, multiple policies (Personal 1, Business 1, plus transiently Personal 2/Business 2), and an occupation switch, on ONE quote instance, the Total Yearly Premium became permanently stuck at $0.00 even after:
- Removing the only other active cover (Mortgage & Living) so Life ($200,000, Age 35, Male — a configuration independently proven earlier in this session to correctly price at $254.16/year) was the sole active cover
- Fully completing Kids Cover (both kids' DOB filled) then resetting Kids back to 0
- Re-typing the Life Sum Insured value via genuine keyboard input (not just programmatic dispatch) to force a legitimate blur-triggered recalculation
None of these individually-reasonable fixes restored the premium calculation. This was NOT cleanly isolated to a single root cause and is likely an artifact of firing many rapid state changes without letting the app's XHR/reactive cycle settle between them (a testing-methodology risk, not necessarily a real user-reachable bug) — but it could also indicate a genuine latent defect where a stale calculation state persists after certain cover-removal sequences. **Recommend the QA team manually reproduce this with deliberate pacing** (one change, wait for the page to settle, check premium, repeat) rather than trusting this as a confirmed rule. A fresh quote was started for all subsequent testing in this session to avoid building further findings on a possibly-corrupted instance.

## TODO remaining (lower priority / follow-up)
- [ ] Confirm M&L auto-default-when-blank behavior (like IP) vs strictly requiring input
- [ ] Confirm exact trigger for "select Commission Structure in Adviser Use" (cover count? premium threshold?)
- [ ] Deep-dive Business Expenses / Business Disability / Farmers Disability covers (not yet explored)
- [ ] Payment frequency dropdown effect on displayed amounts (Fortnightly/Monthly/Quarterly/Half Yearly/Yearly) — appears to be a pure display/frequency conversion of the same annual premium, not a separate recalculation, but not exhaustively confirmed across all 5 options
- [ ] Bundling Discount actual trigger (2 cover types => 15%, 3+ => 20%) — never observed a non-"None" value in testing despite having 2 disability covers active simultaneously (Income Protection + Mortgage & Living) — needs follow-up to determine what counts as a distinct "cover type" for this discount
- [ ] "Add life" button behavior (adds Life 2 — joint quote) — not tested
- [ ] Save vs Save as New vs Apply button behavior differences — not tested (only Apply was exercised, repeatedly, as the validation-trigger)
- [ ] Close / View PDF button behavior — not tested
- [ ] First Name/Last Name/DOB — confirmed NOT required to clear the Apply-time validation banner in any test performed; still worth a footnote that this may change at a later Apply-flow step (Client/Personal Details step), which is out of scope for this Quote screen
