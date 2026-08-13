# Personal Details

> Child of [Quote Screen](../page.md). Rule ID prefix: `PD-`

Personal Details is a per-life section (each Life tab has its own, independent copy — see [Policy Structure — POL-11](../policy-structure/page.md)). It captures the identity and demographic data used to price covers.

## Field reference

| Rule ID | Field | Type | Required to price a **Lump Sum** cover | Required to price a **Disability** cover | Notes |
|---|---|---|---|---|---|
| `PD-01` | First Name | Text, max 20 chars | No | No | Never blocks pricing or Apply at the Quote stage |
| `PD-02` | Last Name | Text, max 30 chars | No | No | Same as First Name |
| `PD-03` | Date of birth | Date picker | No (Age is used instead) | No | See `PD-05` for the DOB↔Age relationship |
| `PD-04` | Age next birthday | Number | **Yes** | **Yes** | Marked `*`; see `PD-06` for valid range |
| `PD-05` | Gender | Button group (Male/Female) | **Yes** | **Yes** | Marked `*`; changing it triggers a full page recalculation (see below) |
| `PD-06` | Smoking status (incl. vapes & e-cigarettes) | Button group (Yes/No) | Not observed to block pricing | Not observed to block pricing | Defaults to "No"; affects premium rate, not eligibility |
| `PD-07` | Occupation | Searchable type-ahead (virtual-select widget) | **Yes** (or Occupation Code as an alternative) | **Yes** | Selecting an option auto-fills and **disables** Occupation Code below it. Also gates cover *availability* — see [Lump Sum Covers §Occupation gating](../lump-sum-covers/page.md) and [Disability Covers §Occupation gating](../disability-covers/page.md) |
| `PD-08` | Occupation code | Native select: (blank), AM, AA, A1, A2, B, C, S, U, IC | Alternative to Occupation | Alternative to Occupation | Becomes disabled/locked once Occupation is chosen via search |
| `PD-09` | Employment status | Native select: Select one / Employed / Self-Employed / Employed by own company / Other | Not required | **Required** | Selecting *any* real value (not just "Select one") is what makes the Disability Covers section appear at all |
| `PD-10` | Pre-tax annual income ($) | Masked currency input | Not required | **Required** | Marked `*`. Drives the income-percentage formulas throughout Disability Covers. See tooltip text below |

**Tooltip — Pre-tax annual income:** *"Annual income can include salary, wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax."*

## Age next birthday — valid range and errors

| Rule ID | Rule |
|---|---|
| `PD-11` | Valid range is **11–75 inclusive**. Below or above produces validation errors. |
| `PD-12` | **Two different error messages** appear for an out-of-range age: client-side *"Age next birthday should be between 11 and 75"* and server-side *"Age Next Birthday must be between 11 and 75"* (the latter appears after tab-out/blur). |
| `PD-13` | The number input type prevents typing a minus sign directly, so a literal `-1` cannot be entered as such — but see `PD-16` for how a negative age can still occur via DOB. |
| `PD-14` | Individual covers can carry their **own, tighter minimum age** on top of the 11–75 general range — e.g. TPD (Stepped Premium Structure) requires a minimum Age Next Birthday of **17**, producing *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"* if breached. |

## DOB ↔ Age — bidirectional relationship

| Rule ID | Rule |
|---|---|
| `PD-15` | Setting Date of Birth **auto-calculates** Age Next Birthday. |
| `PD-16` | Manually typing a value directly into Age Next Birthday **clears** the Date of Birth field — the two fields are mutually exclusive sources of truth, last-write-wins. |
| `PD-17` | There is **no explicit "future date" validation** on DOB — a future DOB simply calculates a negative age, which then fails the 11–75 range check with the standard age-range error text. |
| `PD-18` | A very old DOB (e.g. year 1900) can produce an anomalous calculated age (observed: -3), suggesting a calculation edge case/overflow at extreme date values rather than a deliberate validation rule — flagged for developer attention, not confirmed as intentional. |

## Cross-field effects

| Rule ID | Trigger | Effect |
|---|---|---|
| `PD-19` | **Gender changed** | Triggers a **full page recalculation** — affects which cover buttons are available/disabled, all premiums, and cover eligibility. This is the most disruptive single field change on the whole screen. |
| `PD-20` | **Employment Status set to any real value** (not "Select one") | Reveals the Disability Covers section (Mortgage & Living, Income Protection, Workability) for the first time. Leaving it at "Select one" hides Disability Covers entirely. |
| `PD-21` | **Occupation Code = IC** ("Individual Consideration") | Every cover shows an underwriting-referral warning: *"Please contact underwriting as this Occupation requires Individual Consideration."* Pre-tax Annual Income becomes effectively required — if missing, the combined error *"You must complete the following fields - Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status & Annual Income $"* appears. |
| `PD-22` | **Occupation Code = AM** (Armed Forces) | See [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) for the specific covers this disables — noted here because it's triggered from this section. |

## Name field behavior (character filtering)

| Rule ID | Rule |
|---|---|
| `PD-23` | While typing, First Name/Last Name strip **apostrophes**, **numbers**, and **hash (`#`)** characters as they're entered. Hyphens, other special characters (`!`, `@`, `$`, `%`), and HTML angle brackets are **preserved** — there is no XSS sanitization at the input level, though this is a display-layer concern, not necessarily an exploitable one without confirming how the value is later rendered/used server-side. |
| `PD-24` | This character filtering appears to be an artifact of the specific keystroke-simulation method used during testing (real character-by-character typing) rather than a value set directly via script, which was observed to bypass both the filter and the max-length limit. **Needs developer confirmation of which behavior is the "real" validation** — the filtering seen may be specific to how a real browser keyboard event is handled by the page's own JS, in which case it's a genuine rule; if it's an artifact of the test tool's typing method, it isn't. |

## Error message reference (this section)

| Rule ID | Error text | Trigger |
|---|---|---|
| `PD-25` | *"Required field!"* | Age Next Birthday empty |
| `PD-26` | *"Age next birthday should be between 11 and 75"* | Client-side range check |
| `PD-27` | *"Age Next Birthday must be between 11 and 75"* | Server-side range check (after blur) |
| `PD-28` | *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"* | Age < 17 with a TPD cover configured |
| `PD-29` | *"You must complete the following fields - Gender, Age Next Birthday & Occupation/Occupation Code"* | Cover(s) configured but required personal fields still empty (this list narrows dynamically as fields are filled — see [Validation & Navigation](../validation-and-navigation/page.md)) |
| `PD-30` | *"Please contact underwriting as this Occupation requires Individual Consideration"* | Occupation Code = IC with incomplete fields |
