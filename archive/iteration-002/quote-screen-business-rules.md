# Quote Screen (Illustration Step) — Business Rules Reference

**Source:** Live DOM/interaction extraction from `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/Quote?QuoteId=&ApplicationId=` (brand-new quotes, blank `QuoteId`/`ApplicationId`), session date 2026-08-11.
**Scope:** The Quote screen only ("Illustration" step, step 1 of the Quote & Apply flow) — Personal Details, the multi-policy structure (Personal/Business), Lump Sum Covers, Disability Covers, Kids Cover, Premium panel, Adviser Use, Loadings, multi-life ("Add life"), and the Apply/Save button set. Does **not** cover later Apply-flow steps beyond the initial "Client summary" screen glimpsed when Apply succeeds — see `output/iteration-001/` for the fuller Apply-flow walkthrough.
**Purpose:** Ground truth for building automated test cases that verify the form's mandatory-field rules, cross-field/cross-cover/cross-policy dependencies, min/max limits, data types, and coverage combinations.
**Revision note:** This is a full rewrite of the first pass. Several early conclusions were corrected after deeper testing — most importantly, "Personal"/"Business" are NOT a two-way toggle (§3), and the Bundling Discount DOES count Disability covers (§7.7). Superseded claims are not repeated here; only the corrected, verified versions are.

---

## 1. How this was verified — the "Apply-time diagnostic" technique

The single most useful discovery for test design: clicking **Apply** re-runs full server-side validation and renders, **per cover card**, a live, self-correcting list of everything wrong with that cover — cross-cover dependency breaches, Sum Insured/benefit limit breaches, and any personal-detail fields still missing for pricing. Fix one item and click Apply again — the message shrinks to only what's still wrong. Proven with a worked example (§5.2).

**Recommended automated-test pattern:**
1. Activate the cover under test.
2. Enter a deliberately oversized Sum Insured / Monthly Benefit (e.g. 9,999,999).
3. **Click into and then blur (Tab away from) the value field** — see §7.6, this step is mandatory for Disability covers or the cover silently won't count.
4. Click Apply.
5. Assert on the exact error text — it names the real max-value formula and any unmet dependency, in one shot.
6. Correct the value, click Apply again — if the configuration is now fully valid, **Apply will silently navigate to a "Client summary" screen** (§9) — detect this by DOM content, not URL.

---

## 2. Screen entry / navigation

- Reached via `/QuoteAndApply/` ("Quotes and Applications" list, page title `StartJourney`) → click **New Quote** link → opens a **new browser tab** at `/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`.
- A blank `QuoteId=` and `ApplicationId=` in the URL is the signal that this is a genuinely new quote, not a resumed one.
- Page title while on this screen: `Quote`. Section header: **"Illustration"**.
- **CRITICAL AUTOMATION GOTCHA:** this screen and the "Client summary" screen reached via a successful Apply (§9) share the exact same URL. **Never use the URL to detect which screen is showing** — check DOM content instead (e.g. presence of "Illustration" vs "Client summary" heading, or which footer buttons exist).

---

## 3. Multi-life and multi-policy architecture (read this before anything else — it reshapes how every other section should be tested)

### 3.1 Multiple Lives ("Add life")
- An **"Add life"** button next to "Illustration" adds a new, fully independent `Life N` tab.
- Each Life has its own completely blank Personal Details and its own independent "Policies" structure (a fresh "Personal 1" policy is auto-created for it) — nothing is shared or copied from Life 1.
- The Premium panel aggregates **"Total Monthly/Yearly Premium (All Lives)"** — a true combined total across every life on the quote — while also showing a separate breakdown section per life.
- **Cross-life gate (confirmed):** you cannot switch away from a Life tab that hasn't met minimum requirements. Attempting to switch tabs while the current life is incomplete shows a blocking dialog: *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* (dismissed with an OK button). This means a test suite building a 2-life quote must fully complete Life 1's minimum viable state before it can move on to configure Life 2.
- Not tested in this pass: the exact minimum bar for that gate (is it the same $240/yr rule as §5.1? a fully-priced cover? just Personal Details?) — flagged as follow-up.

### 3.2 "Personal" and "Business" are ADD-POLICY buttons, not a two-way toggle
This is the most significant structural correction from the first pass of this research.
- **"Personal" and "Business" are ADD-POLICY actions.** Each click creates a brand-new, independently-numbered policy instance (Personal 1, Personal 2, Business 1, Business 2, ...) and immediately switches the panel to show/edit that new (empty) policy.
- **A single Life can carry MULTIPLE Personal policies AND multiple Business policies at once.** Confirmed by creating Personal 1, Business 1, Personal 2, Business 2 concurrently — the "Policies" badge counted up to "4".
- The **previously-created policy links** (e.g. "Personal 1", "Business 1") are clickable and switch the panel's Lump Sum/Disability Covers view back to that specific policy's own independent configuration — each policy has fully separate cover selections, checkboxes, everything.
- Each policy link has an adjacent **icon-only link with no visible text that instantly deletes that policy** — no confirmation dialog. Confirmed working for removing Personal 2, Business 1, and Business 2 individually.
- Policy numbering is **independent per type** — removing "Personal 2" did not renumber "Business 2" down to "Business 1".
- The cover menu shown (7 Lump Sum options for Personal vs. 4 for Business; 3 Personal-only Disability covers vs. 4 Business-specific ones) is a property of **which policy is currently selected** — confirmed by switching between a Personal-type and Business-type policy and watching the same accordion re-render with a different button set each time (§6, §7 detail the exact menus).
- The Specific Injury dependency tooltip text changes based on policy type: Personal's says *"...at least one eligible **Personal** Insurance cover"*; Business's says *"...at least one eligible **Business** Insurance cover"* — strongly implies the dependency check is scoped per-policy, not global across all policies on the Life. (Not conclusively proven with a live cross-policy Apply test — flagged as follow-up.)
- **Automation caution:** rapid scripted clicks between policies can produce a transient render mismatch (a stale cover card briefly rendered under the wrong policy's button palette was observed once during this session). Add a small settle point between policy-switch actions and re-read state before trusting it.

---

## 4. Personal Details (per Life)

| Field | Control type | Mandatory for cover pricing? | Notes |
|---|---|---|---|
| First Name | text input | **No** — never blocked Apply or pricing in any test | |
| Last Name | text input | **No** | |
| Date of birth | date text + picker | **No** — Age is used instead | placeholder "Select a date" |
| **Age next birthday** | number spinbutton | **Yes** | marked with `*`; DOM `required=true` |
| **Gender** | radio group (Male/Female) | **Yes** | marked with `*` |
| Smoking status (incl. vapes & e-cigarettes) | radio group (Yes/No) | Not observed to block pricing; defaults to "No" | marked with `*` in UI but never appeared in a missing-field error |
| **Occupation** | searchable virtual-select (type-ahead, library-driven `.vscomp-*` widget) | **Yes** (or Occupation Code as an alternative) | Selecting an Occupation **auto-fills and disables** Occupation Code below it. Also a **cover-availability gate** — see §7.5, Farmers Disability. |
| Occupation code | native select | Alternative to Occupation for "quick quote"; becomes **disabled/locked** once Occupation is chosen via search | Options: (blank), AM, AA, A1, A2, B, C, S, U, IC |
| **Employment status** | native select | **Yes** | Options: Select one, Employed, Self-Employed, Employed by own company, Other |
| **Pre-tax annual income ($)** | calc-mask currency input | **Yes for Disability Covers only** (not required to price Lump Sum covers) | marked `*`; tooltip: *"Annual income can include salary, wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax."* Drives the 75%/45%-of-income formulas in §7. |

**Confirmed minimum field set to price ANY Lump Sum cover:** Gender, Age Next Birthday, Occupation (or Occupation Code).
**Confirmed minimum field set to price ANY Disability cover:** the above **plus** Employment status and Pre-tax Annual Income.

### 4.1 Screen-level minimum premium rule
- **Rule:** Total Annualised Premium (across all of a life's covers) must be **≥ $240.00/year per life insured**.
- Enforced live/reactively — as soon as the total crosses $240, the banner error clears with no page reload or explicit "recalculate" action.
- Exact error text: *"The minimum premium is $240.00 per year per Life insured."*

---

## 5. Apply-time dynamic validation and premium-calc mechanics

### 5.1 The validation list is a live diff, not a static template
Clicking Apply re-evaluates and displays, per cover card, only what's *currently* wrong: cross-cover dependencies, Sum Insured/benefit limit breaches, and missing personal fields still needed to price that specific cover. It is genuinely dynamic, not a fixed checklist.

### 5.2 Worked example proving this (TPD)
1. Empty personal details, TPD active with an oversized Sum Insured → error: *"...Gender, Age Next Birthday & Occupation/Occupation Code"* (plus the max-SI line).
2. After filling Gender + Age + Occupation → error narrows to: *"Please enter a value for employment status."*
3. After filling Employment status → only the max-SI line remains: *"The maximum total Sum Insured per life for TPD Cover is $5,000,000."*

### 5.3 Exceeding a max value does not clamp
When entered Sum Insured/Monthly Benefit exceeds a cover's max, the premium calc does **not** clamp or partially calculate — the Total shows **$0.00** and the error banner appears instead. Premium only calculates once the value is within the valid range AND all mandatory personal fields are filled (and, for Disability covers, the field has been focused — see §7.6).

---

## 6. Lump Sum Covers

Menu on a **Personal** policy: **Life, TPD, Trauma, Cancer, Acd. Death, Needlestick, Specific Injury** (7). Menu on a **Business** policy: **Life, TPD, Trauma, Specific Injury** only (4) — no Cancer, Acd. Death, or Needlestick.

Toggle buttons with a tooltip on the button itself: **Cancer** ("Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit."), **Needlestick** ("For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV."), **Specific Injury** (wording changes by policy type, see §3.2).

Sum Insured/benefit fields are free-text **calc-mask** inputs unless noted otherwise (see §10.1 for the exact automation technique required).

### 6.1 Summary table

| Cover | Max Sum Insured | Premium Structure options | Sum Insured input type | Sub-benefits / extra fields |
|---|---|---|---|---|
| **Life** | *(no hard max observed — only large-SI discount bands)* | Full set: Stepped, Level to 50/60/65/70/75/80/100 | free-text calc-mask | Riders: TI Support, Acc. TPD, Acc. Trauma, Acc. Cancer (§6.3) |
| **TPD** | **$5,000,000** per life | Narrow: Stepped, Level to 65, Level to 70 | free-text calc-mask | **Definition** select: Own / Any / Modified (default Own) |
| **Trauma** ("Trauma Recovery Cover") | **$2,000,000** per life, **shared/combined with Cancer** | Narrow: Stepped, Level to 65, Level to 70 | free-text calc-mask | Checkboxes: Early Trauma Benefit, Trauma Reinstatement, Continuous Trauma Benefit. Toggle buttons: Major Trauma, TPD on Trauma (§6.4) |
| **Cancer** | Same **$2,000,000 combined cap** as Trauma (same error message) | Narrow: Stepped, Level to 65, Level to 70 | free-text calc-mask | None — just Sum Insured + Premium Structure. **No hard dependency on Trauma** despite descriptive tooltip (confirmed: activates and prices fine alone with $50,000 SI) |
| **Acd. Death** ("Accidental Death Cover") | **$1,000,000** (flat per-cover max, not "per life" wording) | Full set (same as Life) | free-text calc-mask | None |
| **Needlestick** | **$500,000** | Full set (same as Life) | **Fixed SELECT dropdown** — $0, $50,000, $100,000 ... $500,000 in $50k steps (NOT free text) | None |
| **Specific Injury** | **$5,000** per life (much smaller than other lump sum covers) | Full set (same as Life) | free-text calc-mask | **Hard dependency** — see §6.5 |

### 6.2 Life cover riders (accelerated benefits)

Activating a rider adds its own nested card with an independent Sum Insured input; the rider's own **Premium Structure select is disabled** (locked/mirrors the parent Life cover's structure). Once a rider is active, **its own toggle button becomes `disabled`** — remove it only via the rider card's own "Remove" link.

- **TI Support** — tooltip: *"Pays the Terminal illness support benefit sum insured if diagnosed as terminally ill with less than 24 months to live. Apply for up to 100% Life Cover sum insured to a maximum of $300,000."* → cap = MIN(100% of Life SI, $300,000).
- **Acc. TPD** ("Accelerated TPD") — adds a **Definition** select: Own / Any / Modified (default Own), same as standalone TPD.
- **Acc. Trauma** ("Accelerated Trauma") — adds the full Trauma sub-benefit set (§6.4) **plus** a **Life Cover Buyback** checkbox not present on standalone Trauma (needs a parent Life SI to buy back into).
- **Acc. Cancer** — same tooltip as standalone Cancer; presumed same simple shape (Sum Insured + locked Premium Structure only) — not independently re-verified.

### 6.3 Trauma sub-benefits (shared shape between standalone Trauma and Acc. Trauma, minus Buyback on standalone)

| Sub-benefit | Type | Tooltip / rule |
|---|---|---|
| Early Trauma Benefit | checkbox | *"...pays the greater of $10,000 or 20% of the Trauma Recovery sum insured, up to a maximum of $100,000."* |
| Trauma Reinstatement | checkbox | *"...allows reinstatement of Trauma Recovery Cover 12 months after a claim is made. There must be enough Life Cover to support the Trauma Recovery Cover reinstatement or Life Cover buy-back benefit should be selected."* → dependency on sufficient Life SI or Buyback |
| Continuous Trauma Benefit | checkbox | *"...Automatically reinstating the sum insured immediately after claim and allowing for up to 3 full trauma claims to be made under the policy for the same insured person."* |
| Life Cover Buyback | checkbox | **Accelerated/rider-only** — not present on standalone Trauma |
| Major Trauma | toggle button | *"...A maximum of 300% of the TRC sum insured applied if TRC is less than $25,000."* — **the formula for TRC ≥ $25,000 was not resolved** (an app-level "Request failed with an error" interrupted this specific test late in the session — flagged as an open follow-up, not a confirmed rule) |
| TPD on Trauma | toggle button | tooltip not captured |

### 6.4 Specific Injury — hard dependency (exact error text)

> *"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability"*

I.e. requires ≥1 of those 8 (Needlestick and Specific Injury itself do **not** count). Confirmed blocked at Apply-time when activated completely alone. The wording changes to "Business Insurance cover" on a Business policy (§3.2).

---

## 7. Disability Covers

### 7.1 Personal-policy menu
**Mortgage & Living, Income Protection, Workability.**

### 7.2 Business-policy menu
**Business Expenses, Business Disability, Farmers Disability, Mortgage & Living** — Mortgage & Living is the only cover shared between Personal and Business menus (same field shape on both).

All disability covers share: Monthly Benefit ($) free-text calc-mask input, Premium Structure usually limited to **Stepped / Level to Expiry** (never the 7-option Life-style list) — though on the Business-only covers this select is frequently **disabled/locked** rather than user-choosable (§7.4).

### 7.3 Personal disability covers — summary table

| Cover | Extra selector | Benefit Period options | Waiting Period options | Checkboxes | Split button | Max monthly benefit |
|---|---|---|---|---|---|---|
| **Mortgage & Living** | Cover Type: Annual Income / Monthly Mortgage. Basis select: **Agreed Value** / **Agreed Value Plus** (default) | 2 Years, 5 Years, To Age 65 (default), To Age 70 | 14, 30 (default), 60, 90, 180, 365, 730 days | Increasing Claim (✓default), Income Top-up Package, Specific Injury Support Benefit, Immediate Assist Package, **Ten-Hour Benefit** (✓default), Mental Health Discount | "Split Benefit" | **45% × Annual Income ÷ 12** (Agreed Value Plus basis; confirmed exact: $150,000 income → $5,625 max) |
| **Income Protection** | Cover type: **Loss Of Earnings** / **Loss Of Earnings Plus** (default) | 2 Years, 5 Years, To Age 65 (default), To Age 70 | 14, 30 (default), 60, 90, 180, 365, 730 days | Increasing Claim (✓default), Income Top-up Package, Specific Injury Support Benefit, Immediate Assist Package, Mental Health Discount (**no Ten-Hour Benefit**) | "Split Waiting Period" | **75% × Annual Income ÷ 12** (confirmed exact: $150,000 income → $9,375 max) |
| **Workability** | none (no Cover Type / Agreed-Value-style selector) | **Only** To Age 65, To Age 70 (no 2/5 Years) | **Only** 30, 45, 60, 75, 90 days (completely different set — no 14/180/365/730) | **Only** Increasing Claim | none | **75% × Annual Income ÷ 12** (same formula as Income Protection) |

Both "Agreed Value"-style basis selectors carry the same tooltip pattern:
> *"• Agreed Value - will offset 'other income' from the monthly benefit • Agreed Value Plus - will not offset 'other income' from the monthly benefit"*

Shared checkbox tooltips:
- **Income Top-up Package**: *"Includes two benefits: Income booster - Pays an extra 33% of the monthly benefit for the first 3 months on a full claim. 25% income bonus - Pays an extra 25% of income earned when back at work part time but still on claim."*
- **Specific Injury Support Benefit** (Monthly variant): *"...pays a multiple of the monthly benefit for specified injuries suffered as a result of an accident. While receiving payments under this benefit no additional Living or Homemaker Support benefit is payable."*
- **Immediate Assist Package**: *"Includes two benefits: Bed-Confinement - Pays a benefit for each day the insured is confined to bed during the waiting period. Crisis Benefit - Pays a benefit upon diagnosis with one of the 11 specified conditions (including cancer, heart attack and stroke), regardless of the waiting period."*
- **Ten-Hour Benefit** (Mortgage & Living only): *"Allows you to work up to 10 hours per week without affecting your Living support benefit."*
- **Split Benefit / Split Waiting Period**: splits the total monthly benefit into two sums insured — for a top-up/different waiting periods (M&L) or each with a different waiting period (IP).

### 7.4 Business-only disability covers — summary table

| Cover | Extra selector | Premium Structure | Benefit Period | Waiting Period | Checkboxes | Max monthly benefit |
|---|---|---|---|---|---|---|
| **Business Expenses** | none | **Disabled**, locked to Stepped | **Disabled**, locked to "1 Year" (full list rendered but unusable: 6/9/12/18/24 Months, 2 Years, 5 Years, To Age 65, To Age 70) | 14/30/60/90 Days (enabled) | none | **Occupation-based, not income-based**: *"The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666"* (for a Civil Engineer occupation) — not a simple % of Annual Income; appears to be an occupation-table lookup |
| **Business Disability** | **Classification**: Employed / Equity Owner (>75%) / Equity Owner (up to 75%) (default Employed) | **Disabled**, locked to Stepped (full list incl. "Level to Expiry" present but unusable) | 6/9/12/18/24 Months only (no Years/To-Age options) | 30/60/90 Days only (no 14 Days) | **Partial Disablement** (✓default), **Business Security** — tooltip: *"Allows future increases without medical underwriting. Financial justification for increases required."* | **Flat $50,000** — *"The maximum allowable monthly benefit for Business Disability Cover is $50,000"* (not occupation- or income-qualified in the message) |
| **Farmers Disability** | none | **Disabled**, locked to Stepped | 6/9/12/18/24 Months + 5 Years | 30/60/90 Days only | Same as Business Disability (Partial Disablement, Business Security) minus Classification | **Occupation-based**, same pattern as Business Expenses — see §7.5 |

### 7.5 Occupation as a cover-availability gate (not just a pricing input)

**Confirmed hard gate:** with a non-farming occupation ("Civil Engineer - qualified."), activating Farmers Disability and clicking Apply produces:
> *"Farmers Disability Cover is not available for the selected occupation"*

Switching Occupation to a farming occupation ("Farming / Farmer - Owner / Manager: >5 years' experience...") **removes** that blocking error, leaving only the max-benefit line (*"...for the selected occupation is $10,000"* for that specific farming occupation). This proves **Occupation gates cover availability outright for some covers**, not merely their pricing formula. The Needlestick tooltip's "for certain occupations" wording hints this pattern may also apply there — not independently confirmed in this pass.

### 7.6 CRITICAL: the "commitment" mechanism — auto-default requires focus+blur, not just activation

This is one of the most important, non-obvious findings in this report, with direct automated-testing implications:

- Clicking a Disability cover's toggle button (Income Protection, Mortgage & Living, etc.) **does not by itself** trigger the "auto-default Monthly Benefit to max" behavior. Confirmed: activated Income Protection via a plain button click, left its Monthly Benefit field completely untouched — the Total Yearly Premium stayed at the Life-only baseline, i.e. Income Protection contributed **$0**.
- The auto-default (max = 75%/45% of Annual Income, per the formulas above) only fires once the Monthly Benefit field **receives focus and then blurs** (Tab away, click elsewhere) — even with **zero characters typed**. Confirmed: clicked into the blank field, pressed Tab with no typing → Total Yearly Premium immediately jumped to reflect the auto-defaulted benefit.
- **An "activated but never focused" Disability cover is a phantom/uncommitted entry.** It shows as active in the UI, but:
  - Contributes **$0** to the premium.
  - Does **not** count toward the Bundling Discount cover-type tally (§7.7).
  - Is **silently dropped and not persisted** if you click Apply and proceed — confirmed by activating two disability covers without ever focusing either benefit field, clicking Apply (which succeeded, since a $0/uncommitted cover apparently doesn't trigger its own mandatory-field errors), landing on the Client summary screen showing only the Life-only premium, then returning to Quote and finding the Disability Covers count back at 0.
- **Automated test implication:** any test that relies on a Disability cover's auto-default value, or that checks a cover's continued presence after Apply, **must explicitly click into and blur (Tab out of) that cover's Monthly Benefit field.** Merely toggling the cover on is not sufficient and will produce a false negative.
- Not tested: whether an analogous "phantom until touched" state exists for Lump Sum cover Sum Insured fields (they have no valid $0 default to fall back to, so the concept may not directly transfer) — flagged as a follow-up.

### 7.7 Bundling Discount — corrected, verified rule

> Tooltip: *"A discount that applies to Personal & Business for taking out multiple cover types: 2 cover types: 15%, 3 or more cover types: 20%"*

**Verified rule: the discount counts distinct, properly-committed cover types across Lump Sum AND Disability combined** (an earlier pass of this research incorrectly concluded Disability covers were excluded — that was an artifact of the phantom-cover issue in §7.6, not a real category exclusion).

- 1 committed cover type → **None**
- 2 committed cover types (any mix of Lump Sum/Disability) → **"15% (2 covers)"** — confirmed with Life (Lump Sum) + TPD (Lump Sum) = 15%, and separately with Life (Lump Sum) + Income Protection (Disability, properly focused/blurred) = 15%
- 3+ committed cover types → **"20% (3 covers or more...")** — confirmed with Life + TPD + Trauma

A cover that is active but uncommitted (§7.6) does **not** count toward this tally.

### 7.8 Hard mutual-exclusivity rule (Workability)

> *"Workability Cover is not available to be taken in conjunction with Mortgage & Living Cover or Income Protection Cover"*

- **Workability cannot coexist with EITHER Mortgage & Living OR Income Protection** on the same policy.
- **Mortgage & Living AND Income Protection CAN coexist with each other** (confirmed — no exclusivity error when both active).
- Each cover's own max-benefit cap (§7.3) is independent — not a shared/depleting pool. The word "remaining" that appears in the M&L/IP error text does not indicate pool-sharing; it's just standard phrasing.

### 7.9 Secondary validation triggered by multiple covers

Once **2 or more covers are active and committed** on a policy, Apply also requires: *"Please select Commission Structure in Adviser Use for all applicable covers"* (§8). **Confirmed precisely:** 1 committed cover → no such error, Apply proceeds; 2 committed covers → error appears every time. This is a clean, reproducible trigger (cover count ≥ 2), not tied to a premium threshold.

---

## 8. Kids Cover (Personal policy only)

- "Number of Kids" select: 0–9.
- Selecting **N** generates **N** repeated "Kid 1" … "Kid N" blocks, each with: First Name, Last Name, **Date of birth*** (mandatory — shows an inline "Required field!" message if left blank when validated), Gender (Male/Female), and a **Sum insured** select.
- Kid's Date of birth is a **native `<input type="date">`** with hard bounds `min="2005-08-13"` and `max="2026-08-11"` (i.e. roughly a 21-year window ending "today" at the time of testing — this is almost certainly a rolling "child must be under 21" style constraint, not a fixed calendar date; re-derive the exact rule relative to the current date when building test data).
- Sum insured options are a fixed tier list: **$50,000 (labelled "Free" — no additional premium)**, then $60,000, $70,000, … up to $200,000 in $10,000 increments.
- Not available on Business policies.

---

## 9. What "Apply" actually does — navigation to a "Client summary" screen

This is a major mechanism discovered in this pass, and it changes how "Apply" should be understood by test designers:

**Apply validates the current policy's configuration. If it's fully valid, it silently navigates the single-page app forward to a "Client summary" screen — WITHOUT changing the browser URL.**

Confirmed directly: with a valid Life + TPD configuration, clicking Apply produced:
- A **"Client summary"** heading, replacing "Illustration"
- A Life 1 status badge reading **"PRE APPLICATION"**
- New fields that are mandatory **at this next step** (unlike on the Quote screen itself): **First Name\*, Middle Name, Last Name\*, Date of Birth\***
- A single **"Proceed to application"** button
- The footer button set changes completely: Close/View PDF/Save as New/Save/Apply all disappear, replaced by a single **"Return to Quote"** button
- `window.location.href` remained byte-for-byte identical to the Quote screen's URL throughout

**"Return to Quote"** goes back to the Illustration screen with all prior configuration intact.

**CRITICAL AUTOMATION GOTCHA:** because the URL never changes, any test harness must detect the Client-summary transition via DOM content (heading text, footer button set) — polling the URL will never reveal that navigation happened, and a script that keeps querying for Quote-screen-only elements after this silent transition will get `null`/`undefined` results without any thrown error, which can easily be misread as "nothing happened" or a stuck calculation.

If Apply's validation fails (any of the errors described throughout §5–§7), the screen stays on "Illustration" and shows the error text.

---

## 10. Adviser Use ("Commissions" dialog) and Loadings popup

### 10.1 Adviser Use
- **"Default for agency (40002)"** select: Please Select / **LEVEL 30** (default) / SPREAD 20 / UPFRONT, with a disabled "Update" button.
- **"Split commission"** checkbox — tooltip: *"You should only select this option if you do not have an existing default commission split."*
- Per-policy table (e.g. "Personal Insurance 1") with columns: **Commission Structure / Premium Structure / Sum Insured ($) Benefit Amount**.
- **"Select IC/RC"** select: Please Select / "IC-100%, RC-100%" (default).
- **"Select All"** select: bulk-applies one Commission Structure choice to every cover row at once.
- Each active, committed cover gets its own row: an editable Commission Structure select (defaults to LEVEL 30) plus read-only Premium Structure and Sum Insured/Benefit Amount.
- Validation tie-in: see §7.9.

### 10.2 Loadings
- Rate-input mode toggle: **Percentage** / **Per Mille**.
- One independent loading-% select **per cover category**: **Life, TPD, Trauma Recovery, Cancer Cover, Disability** — each: None, 25%, 50%, 75%, 100% … up to 400% in 25% increments.
- Category-level underwriting loading multiplier, applied regardless of which specific cover(s) within that category are active.

---

## 11. Premium panel and Payment frequency

- **Total Monthly/Annualised Premium (All Lives)** — sticky summary at top; the label itself switches between "Total Monthly Premium" and "Total Annualised Premium" depending on the selected payment frequency. Tooltip: *"This is the total premium the clients will pay for the year. For example, the monthly premium x 12 or the half-yearly premium x 2"* — this tooltip is the authoritative statement of the conversion logic: each frequency option is a display conversion of one underlying annual premium (Yearly ×1, Half Yearly ×2, Quarterly ×4, Monthly ×12, and by the same logic Fortnightly ×26), not an independent recalculation. (The exact ×26 Fortnightly assumption was not independently re-verified against a live premium figure in this pass — treat as high-confidence but not 100%-confirmed.)
- Per-policy breakdown: **Payment frequency** select — Fortnightly, **Monthly** (default), Quarterly, Half Yearly, Yearly.
- **Bundling Discounts** — see §7.7 for the corrected, verified rule.

---

## 12. Automation / data-type notes

### 12.1 Calc-mask Sum Insured / Monthly Benefit fields
- DOM attributes on the raw input are typically `min="0" max="99999999" maxLength="10"`, but this is **not** the true business-rule limit — the real max is enforced server-side per cover (see the tables throughout §6–§7) and is usually far smaller than 99,999,999.
- **Never type the full number in one action** (`fill`/`pressSequentially`) — the mask corrupts, producing garbage like `.2.0.0.0.0.0.` in the raw DOM value. Correct sequence: click the field → press Backspace ~10× to clear it down to `.` → press each digit key **individually** as real keystrokes → Tab out to blur.
- Even after correct entry, reading `element.value` via JS can show a stale/garbled string — trust the **accessible/rendered value** (e.g. via an accessibility snapshot showing `"200,000"`) over the raw DOM property.
- Exceeding the max does not clamp — see §5.3.
- For Disability covers specifically, the field must be focused+blurred at least once for its value (including the auto-default) to actually register — see §7.6.

### 12.2 Native date inputs
- Kid's Date of Birth is a real `<input type="date">` with explicit `min`/`max` bounds (§8) — use ISO `YYYY-MM-DD` values when setting it programmatically (a `dd/mm/yyyy`-formatted string will be rejected by Playwright's `fill` as a malformed value even though that's the field's *displayed* placeholder format).
- The main Personal Details "Date of birth" field is a text input with a date-picker attached, not a native date input — different handling required if it's ever populated (not exercised in this pass since it was never required for pricing).

### 12.3 Occupation search widget
- A `.vscomp-*`-classed virtual-select component, not a native `<select>`. Click the combobox, then type into a dynamically-IDed `.vscomp-search-input` element to filter, then click the matching `.vscomp-option` element. The wrapper/search-input ID changes across screen loads (not stable) — always re-query it fresh.
- Selecting an occupation option auto-fills and disables the separate "Occupation code" native select.

### 12.4 Radios, checkboxes, and cover-toggle buttons
- Standard Playwright `browser_click` (real mouse events) works correctly on OutSystems radio groups and checkboxes in this app — no `scrollIntoView`+coordinate-click workaround is needed when using genuine Playwright interaction (this contradicts an older internal playbook that warned about this, which was written against a different, more primitive automation harness).
- Cover-toggle buttons respond correctly to a plain JS `.click()` via `evaluate`. Once a cover/rider is active, its own toggle button typically becomes `disabled` (Life-cover riders, Disability covers) — remove the cover via its card's "Remove" link, not by re-clicking the disabled toggle. Top-level Lump Sum cover buttons (Life, TPD, etc.) did **not** show this disabling behavior in observed tests, consistent with card names like "Life Cover A" suggesting the underlying data model supports multiple named instances per cover type — **not independently confirmed by actually adding a second instance of the same top-level cover in this pass; flagged as a good follow-up test** (does clicking "Life" again after "Life Cover A" already exists add a "Life Cover B", or re-toggle/error?).

---

## 13. Explicitly NOT tested / open follow-ups

Being transparent about the boundary of what was verified vs. inferred:

1. **Save, Save as New, Close, View PDF** — these footer buttons were never clicked/exercised in this pass (only Apply was, extensively, as the validation/navigation trigger). Their functional behavior is undocumented.
2. **Major Trauma's cap formula for Trauma Recovery Cover ≥ $25,000** — only the "<$25,000 → 300%" case was captured; the test to find the ≥$25,000 formula was interrupted by a genuine application error ("Request failed with an error") and not completed.
3. **Business Expenses' and Farmers Disability's exact occupation-based benefit formula** — confirmed to be occupation-table-driven (not a flat number or simple income percentage) but the underlying table/formula itself was not reverse-engineered beyond single data points.
4. Whether the "phantom until focused" commitment issue (§7.6) also affects Lump Sum cover Sum Insured fields.
5. Whether adding a top-level Lump Sum cover a second time creates a second named instance ("Life Cover B") or behaves as a simple re-toggle (§12.4).
6. The precise minimum-requirement bar that gates switching away from an incomplete Life tab (§3.1).
7. Whether the Specific Injury dependency check (§6.4) is truly scoped per-policy or can be satisfied by a cover on a *different* policy under the same Life.
8. Exhaustive confirmation of the Fortnightly ×26 payment-frequency conversion factor against a live calculated figure.
9. Needlestick's tooltip mentions "for certain occupations" — whether it has a hard occupation-availability gate like Farmers Disability was not tested.
