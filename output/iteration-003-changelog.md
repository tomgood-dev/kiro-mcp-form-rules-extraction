# Iteration 003 — Changelog

**Date:** 2026-08-13  
**Iteration:** 003  
**Scope:** Quote Screen — all sections (Personal Details, Lump Sum Covers, Disability Covers, Kids Cover, Policy Structure, Premium & Bundling)  
**Method:** Direct interaction with live `outsystems-dev` environment via `server.js` HTTP interface (Kiro CLI → Playwright → OutSystems Reactive Web app)  
**Author:** Automated extraction session (Kiro CLI)

---

## Executive Summary

Iteration 003 resolved **all 4 open discrepancies** from sessions 1–2, corrected **8 material errors** in previously-documented rules, and added **22 new rule IDs** that had never been tested before. The most significant corrections are the Income Protection 3-tier formula (previously documented as a single 75% tier) and the Specific Injury dependency requirement (previously documented as standalone-capable).

---

## 1. Rules CORRECTED (existing rules that were wrong)

### 1.1 Specific Injury — Field Type

| | Before (iteration 001–002) | After (iteration 003) |
|---|---|---|
| **Rule ID** | LSC-32 | LSC-32 |
| **What it said** | Sum Insured is a **fixed-tier dropdown** (implying a mechanism like Needlestick's $50k-step select) | Sum Insured is a **calc-mask free-text input** (same as Life/TPD/Trauma/Cancer) |
| **Why wrong** | Session 2 likely confused Specific Injury with Needlestick, or observed a stale UI state | |
| **Evidence** | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

### 1.2 Specific Injury — Dependency Requirement

| | Before | After |
|---|---|---|
| **Rule ID** | LSC-34 | LSC-34 |
| **What it said** | Specific Injury has **no companion requirement** — can be taken standalone | Specific Injury **REQUIRES a companion cover**. Exact error: *"Specific Injury Lump Sum requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection, Mortgage & Living or Workability"* |
| **Why wrong** | Earlier testing likely had another cover already active when testing Specific Injury, masking the dependency | |
| **Evidence** | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

### 1.3 Life Cover Duplicates — Not a No-op

| | Before | After |
|---|---|---|
| **Rule ID** | LSC-39 | LSC-39 |
| **What it said** | Re-clicking the Life toggle after activation is a **no-op** (one Life cover instance per policy, same as TPD/Trauma/Cancer) | Re-clicking the Life toggle **creates a new instance** (at least 2 confirmed, likely 3). Each defaults to the next Premium Structure in sequence (1st = Stepped, 2nd = Level to 50). The 3rd instance requires the 2nd to have Sum Insured filled first |
| **Why wrong** | Earlier testing likely only clicked once and assumed the same behavior as other covers | |
| **Evidence** | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

### 1.4 Add Life — Blocked When Incomplete

| | Before | After |
|---|---|---|
| **Rule ID** | POL-12 | POL-12 |
| **What it said** | "Add life" succeeds **unconditionally** — no minimum bar required on current life | Add Life **IS blocked** when the current life doesn't meet minimum requirements. Modal: *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life"* |
| **Why wrong** | Earlier testing started from a completely empty Life 1 (no covers configured). Once any cover is activated (even incompletely), the system enforces completion before allowing a new life | |
| **Evidence** | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

### 1.5 Income Protection Formula — 3-Tier Progressive

| | Before | After |
|---|---|---|
| **Rule ID** | DC-21 | DC-21 |
| **What it said** | Maximum monthly benefit = **75% × Annual Income ÷ 12** (single tier, no cap mentioned) | **3-TIER progressive formula:** Tier 1: 75% of first $320k. Tier 2: +50% of $320k–$560k. Tier 3: +20% above $560k. **Product hard cap: $30,000/month.** Formula: `min($30,000, (75% × min(income, $320k) + 50% × max(0, min(income, $560k) - $320k) + 20% × max(0, income - $560k)) ÷ 12)` |
| **Why wrong** | Earlier testing used only income = $150,000 (entirely within Tier 1, so the formula appeared to be a flat 75%). Higher income values were never tested | |
| **Evidence** | [iteration-003-exclusivity-and-formulas.md](iteration-003-exclusivity-and-formulas.md) — confirmed at $150k (→$9,375), $400k (→$23,333), $600k (→$30,000 cap) |

### 1.6 Bundling Discount — Minimum Thresholds Required

| | Before | After |
|---|---|---|
| **Rule ID** | PREM-20 | PREM-20 |
| **What it said** | The discount counts **any** committed cover type (implying no minimum sum insured threshold) | The discount counts only covers **meeting or exceeding their category's minimum sum insured / monthly benefit threshold** (see PREM-23 through PREM-26). Covers below threshold are priced normally but do NOT count toward the bundling tally |
| **Why wrong** | Earlier testing always used relatively large sum insured values (≥$100k) that exceeded minimums, never probing the low end | |
| **Evidence** | [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) |

### 1.7 Business Policy 4th Cover — Specific Injury (Not Cancer)

| | Before | After |
|---|---|---|
| **Rule ID** | LSC-01b | LSC-01b |
| **What it said** | Session 2 reported **Cancer** as the 4th Business Lump Sum cover | Business Lump Sum: Life, TPD, Trauma, **Specific Injury** (4 covers). Cancer is NOT available on Business policies |
| **Why wrong** | Session 2's observation was erroneous — possibly confusing the cover menu with a Personal policy while investigating Business behavior | |
| **Evidence** | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md), confirmed via cover menu enumeration on a fresh Business policy |

### 1.8 Workability Cap — Corrected Formula

| | Before | After |
|---|---|---|
| **Rule ID** | DC-27 | DC-27 |
| **What it said** | Maximum monthly benefit = **75% × Annual Income ÷ 12** (no hard cap mentioned) | Maximum = **min($10,000, 75% × Annual Income ÷ 12)**. Product hard cap: **$10,000/month** (applies when income exceeds $160,000) |
| **Why wrong** | Earlier testing used $150,000 income (→$9,375, below cap), so the cap was never observed | |
| **Evidence** | [iteration-003-exclusivity-and-formulas.md](iteration-003-exclusivity-and-formulas.md) — confirmed at $100k (→$6,250), $150k (→$9,375), $200k (→$10,000 cap) |

---

## 2. Rules ADDED (genuinely new — never previously tested)

### 2.1 Age-Banding Limits (Personal Details)

| Rule ID | Summary | Evidence |
|---|---|---|
| `PD-28` | Life Cover max $50,000 for ANB 11–16. Error: *"The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"* | [iteration-003-age-banding.md](iteration-003-age-banding.md) |
| `PD-29` | TPD max $250,000 for ANB 17–21. Error: *"The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. Age Next Birthday 17-21 is only eligible for Modified TPD"* | [iteration-003-age-banding.md](iteration-003-age-banding.md) |
| `PD-30` | TPD Definition restricted to 'Modified' for ANB 17–21 (server-side enforcement only — UI still shows Own/Any/Modified) | [iteration-003-age-banding.md](iteration-003-age-banding.md) |
| `PD-31` | Maximum ages per cover: Accidental Death ≤ 70, Needlestick ≤ 65, Specific Injury ≤ 61. All enforce server-side (button remains clickable, error shown after activation) | [iteration-003-age-banding.md](iteration-003-age-banding.md) |
| `PD-32` | Premium Structure dropdown shows ALL options regardless of age — no client-side filtering of "Level to X" options even when age exceeds the target | [iteration-003-age-banding.md](iteration-003-age-banding.md) |

### 2.2 Cross-Cover Exclusivity & Checkbox Behavior (Disability Covers)

| Rule ID | Summary | Evidence |
|---|---|---|
| `DC-45` | Business Disability + Farmers Disability are **mutually exclusive** within the same policy (server-side validation, not UI-disabled). Error: *"Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other"* | [iteration-003-exclusivity-and-formulas.md](iteration-003-exclusivity-and-formulas.md) |
| `DC-46` | **NO cross-policy exclusions.** Workability on a Personal policy does NOT block Business Disability on a Business policy. Each policy type is independent | [iteration-003-exclusivity-and-formulas.md](iteration-003-exclusivity-and-formulas.md) |
| `DC-47` | Mental Health Discount disabled when Benefit Period = 2 Years (both IP and M&L). All other Benefit Period values → enabled | [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) |
| `DC-48` | Ten-Hour Benefit (M&L only) auto-checks for Self-Employed / Employed by own company; defaults OFF for Employed / Other | [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) |
| `DC-49` | Increasing Claim (cover-level) and Inflation Adjustment Benefit (policy-level) are fully INDEPENDENT — no cross-field dependency | [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) |

### 2.3 Kids Cover Prerequisites

| Rule ID | Summary | Evidence |
|---|---|---|
| `KID-08` | Kids Cover requires at least one Personal Insurance Cover before Apply succeeds. Error: *"Please add at least one Personal Insurance Cover before adding Kids Cover"* | [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) |
| `KID-09` | Kids premium is a single aggregated line in the parent life's premium total — NOT itemized per child | [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) |

### 2.4 Needlestick Companion Requirement & Mechanism

| Rule ID | Summary | Evidence |
|---|---|---|
| `LSC-31b` | Needlestick REQUIRES a companion cover (narrower list than Specific Injury — excludes Acd. Death, M&L, Workability). Error: *"Needlestick Cover requires one of the following covers to also be selected: Life, Trauma Recovery, Cancer, TPD or Income Protection"* | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |
| `LSC-41` | Needlestick standalone blocked (same rule as LSC-31b, codified in lifecycle section) | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |
| `LSC-42` | Confirmed: Needlestick uses a **select dropdown** (fixed-tier), NOT a calc-mask — distinct from Specific Injury | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

### 2.5 Bundling Minimum Thresholds (Premium)

| Rule ID | Summary | Evidence |
|---|---|---|
| `PREM-23` | Life bundling minimum: Sum Insured ≥ $100,000 (exact boundary confirmed: $99,999 → "None", $100,000 → "15%") | [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) |
| `PREM-24` | TPD bundling minimum: Sum Insured ≥ $100,000 (exact boundary confirmed) | [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) |
| `PREM-25` | Trauma bundling minimum: Sum Insured ≥ ~$25,000 ($20k → "None", $25k → "15%"; exact boundary likely $25k) | [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) |
| `PREM-26` | M&L bundling minimum: Monthly Benefit ≥ $500–$1,000/mo ($500 → "None", $1,000 → "15%"; exact boundary not narrowed) | [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) |

### 2.6 Business Policy Structure (Policy Structure)

| Rule ID | Summary | Evidence |
|---|---|---|
| `POL-14` | Business Lump Sum covers confirmed: Life, TPD, Trauma, Specific Injury (4 covers) | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |
| `POL-15` | Business Disability covers confirmed: Business Expenses, Business Disability, Farmers Disability (+ M&L shared) | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |
| `POL-16` | Cover-menu split is driven by **policy type** (Personal vs Business), NOT by occupation code | [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) |

---

## 3. Discrepancies CLOSED

All 4 open discrepancies from the hub page (`business-rules/page.md` §4) are now **RESOLVED**:

| # | Discrepancy | Resolution | Linked Rule |
|---|---|---|---|
| 1 | Is Personal/Business a two-state toggle or an add-policy action? | **CONFIRMED: add-policy action.** Each click creates a new independently-numbered policy (Personal 1, Personal 2, Business 1, ...). Session 2's "toggle" description was observing only a single policy | POL-06 through POL-09 |
| 2 | What is the Business policy's 4th Lump Sum cover? | **CONFIRMED: Specific Injury.** Cancer, Accidental Death, Needlestick NOT available on Business | LSC-01b, POL-14 |
| 3 | Does cover-menu split correlate with policy type or occupation code? | **CONFIRMED: policy type.** Occupation code affects eligibility within the menu, not which covers appear | POL-16 |
| 4 | Does switching Life tabs require the current life to meet a minimum bar? | **CONFIRMED: Yes.** Modal: *"Cannot proceed — Please enter the minimum requirement..."* The earlier "unconditional" finding was from a state before any cover was partially configured | POL-12 |

---

## 4. Summary Table — All Changes by Page/Section

| Page | Corrections | New Rules | Discrepancies Closed |
|---|---|---|---|
| **Personal Details** | — | PD-28, PD-29, PD-30, PD-31, PD-32 (5 new) | — |
| **Lump Sum Covers** | LSC-32 (field type), LSC-34 (dependency), LSC-39 (duplicates), LSC-01b (Business 4th cover) | LSC-31b, LSC-41, LSC-42 (3 new) | #2 (Business 4th cover) |
| **Disability Covers** | DC-21 (IP formula), DC-27 (Workability cap) | DC-45, DC-46, DC-47, DC-48, DC-49 (5 new) | — |
| **Kids Cover** | — | KID-08, KID-09 (2 new) | — |
| **Policy Structure** | POL-12 (Add Life blocking) | POL-14, POL-15, POL-16 (3 new) | #1 (Personal/Business mechanism), #3 (cover-menu driver), #4 (Add Life blocking) |
| **Premium & Bundling** | PREM-20 (minimum thresholds) | PREM-23, PREM-24, PREM-25, PREM-26 (4 new) | — |
| **Hub page** | — | — | All 4 marked RESOLVED with strikethrough |

**Totals:** 8 corrections · 22 new rule IDs · 4 discrepancies closed

---

## 5. Test Methodology

### Environment
- **Target:** Asteron Life Quote & Apply — OutSystems Reactive Web (outsystems-dev environment)
- **Interface:** `server.js` HTTP API → Playwright browser automation → live app
- **Session type:** Stateful browser session; sequential form interactions replicating real user behavior

### HTTP Commands Used (via server.js)

| Command | Purpose |
|---|---|
| `GET /state` | Read current page state (step, visible sections, active covers) |
| `GET /fields` | Enumerate all visible fields with types, options, values, required/disabled state |
| `GET /buttons` | Read button states (enabled/disabled, active/inactive class) |
| `GET /errors` | Capture validation errors currently displayed |
| `POST /interact` | Interact with a specific field (type text, select option, click button) |
| `POST /navigate` | Trigger navigation actions (Next, Apply, Back) |
| `POST /wait` | Wait for app to settle after an interaction |

### Testing Strategy

1. **One field at a time** — changed one field/cover, then re-read ALL fields and errors to detect side effects
2. **Boundary probing** — tested at exact thresholds (e.g., $99,999 vs $100,000 for bundling)
3. **Cross-field exploration** — activated covers in isolation, then in combinations, to surface dependency/exclusivity rules
4. **Multi-income testing** — tested disability formulas at 3+ income levels ($100k, $150k, $200k, $400k, $600k) to reveal tiered behavior
5. **Age variation** — tested at ANB 14, 16, 17, 20, 25, 56, 61, 65, 70, 75 to surface banding
6. **Policy-type comparison** — compared Personal vs Business cover menus on the same life

### Evidence Files

All raw observations are preserved in:

| File | Content |
|---|---|
| [iteration-003-age-banding.md](iteration-003-age-banding.md) | Age-related caps, TPD definition restriction, max ages per cover |
| [iteration-003-bundling-minimums.md](iteration-003-bundling-minimums.md) | Per-cover bundling thresholds with exact boundary testing |
| [iteration-003-checkboxes-and-kids.md](iteration-003-checkboxes-and-kids.md) | Mental Health Discount/Ten-Hour/Increasing Claim behavior; Kids Cover prerequisites |
| [iteration-003-dependencies-and-duplicates.md](iteration-003-dependencies-and-duplicates.md) | Specific Injury/Needlestick companion requirements; Life duplicates; Business cover menu; Add Life blocking; Personal/Business policy mechanism |
| [iteration-003-exclusivity-and-formulas.md](iteration-003-exclusivity-and-formulas.md) | IP 3-tier formula; Workability cap; Business Disability/Farmers Disability exclusivity; cross-policy independence |

---

## 6. What Remains Untested / Caveats

### Not tested in this iteration

| Area | Status | Notes |
|---|---|---|
| **Cancer / Accidental Death / Needlestick bundling minimums** | Inferred only | Cancer likely matches Trauma (~$25k); AD/Needlestick not tested. IP/Workability likely match M&L threshold |
| **M&L bundling exact boundary** | Narrowed to $500–$1,000/mo | Could be $500, $750, or $1,000 — needs binary search with $100 increments |
| **Trauma bundling exact boundary** | Narrowed to $20k–$25k | Likely $25k (round number) but $21k–$24k not tested |
| **Specific Injury sum insured maximum** | Not tested | Other covers have explicit maxima (TPD $5M, AD $1M, Trauma+Cancer $2M combined) — SI max unknown |
| **Life Cover 3rd+ instance behavior** | Partially tested | 3rd instance requires 2nd to be filled — upper limit of instances unknown |
| **Premium Structure server-side validation at age boundaries** | Not tested | PD-32 confirms no client-side filtering; what errors "Level to 50" at ANB 56 produces is not confirmed |
| **Riders (Acc. TPD, Acc. Trauma, Acc. Cancer) age banding** | Not tested | May inherit parent cover's age restrictions or have their own |
| **Business policy age banding** | Not tested | Age banding rules tested only on Personal policies |
| **Occupation code S and U full cover availability** | Partially tested | Tested for Business Expenses and Farmers Disability; full Personal menu at these codes not systematically verified |
| **Apply Flow (Steps 2–6)** | Out of scope for iteration 003 | Remains at single-pass exploratory depth from earlier sessions |

### Caveats on confirmed rules

1. **Income Protection Tier 3 is effectively moot.** The $30,000/month product cap coincides with the Tier 2 ceiling ($560k income). Tier 3 (20% above $560k) can never contribute to an accessible benefit — the cap is already hit. This may be intentional (future-proofing for cap changes) or a documentation/config artifact.

2. **Age banding enforcement is server-side only.** Buttons remain clickable, dropdowns remain unfiltered — errors appear only after activation or save. Automated tests must check for errors AFTER interactions, not assume UI will prevent invalid states.

3. **Specific Injury Premium Structure "not locked" finding** contradicts Accidental Death (locked to Stepped) despite both being minor/supplementary covers. This is confirmed behavior, not an error in testing — SI genuinely allows Level options while AD does not.

4. **Policy-type driven cover menu** means testing a new cover on "the wrong policy type" will simply not find it. Always verify which policy type is currently selected before asserting cover absence/presence.

---

## 7. Impact Assessment

### For Business Analysts

The most significant finding is the **Income Protection 3-tier formula** (DC-21). Any acceptance criteria, premium calculators, or comparison tools referencing "75% of income" are incomplete above $320k annual income. The formula should be updated in all downstream documentation.

The **bundling minimum thresholds** (PREM-23–26) mean that low-value covers (e.g., Trauma at $10,000) will NOT trigger bundling discounts — this affects premium illustrations and may surprise advisers quoting small sums.

### For Developers / QA

The **Specific Injury field type correction** (LSC-32) means any test automation targeting this field as a `<select>` dropdown will fail — it's a `calc-mask` free-text input requiring the same interaction pattern as Life/TPD/Trauma.

The **Life Cover duplicate behavior** (LSC-39) means regression tests asserting "clicking Life button is a no-op" are incorrect and should be updated to expect instance creation.

---

*End of iteration 003 changelog. Next iteration should prioritize: Specific Injury maximum sum insured, exact M&L/Trauma bundling boundaries, Level-to-X age validation errors, and rider age banding.*
