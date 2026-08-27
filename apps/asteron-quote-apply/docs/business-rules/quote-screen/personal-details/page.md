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
| `PD-09` | Employment status | Native select: Select one / Employed / Self-Employed / Employed by own company / Other | Not required | **Required** | *(Corrected 2026-08-26 — see `PD-20` below: the Disability Covers section/buttons are visible and enabled regardless of this field's value; Employment Status still blocks Apply if a Disability cover is priced without it set.)* |
| `PD-10` | Pre-tax annual income ($) | Masked currency input | Not required | **Required** | Marked `*`. Drives the income-percentage formulas throughout Disability Covers. See tooltip text below |

**Tooltip — Pre-tax annual income:** *"Annual income can include salary, wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax."*

## Age next birthday — valid range and errors

| Rule ID | Rule |
|---|---|
| `PD-11` | Valid range is **11–75 inclusive**. Below or above produces validation errors. *(Corrected 2026-08-26: the error does NOT reliably appear on blur alone — confirmed live that setting an out-of-range age + tabbing away produces no visible error until a cover is priced and Apply is clicked; only then does the server-side message fire. Test accordingly — don't assert on blur-only.)* |
| `PD-12` | **Two different error messages** appear for an out-of-range age: client-side *"Age next birthday should be between 11 and 75"* (shown inline next to the field once Apply is clicked) and server-side *"Age Next Birthday must be between 11 and 75"* (shown in the Apply-result error banner). Both were confirmed present together in the same Apply response, 2026-08-26 — the client-side message is not actually an earlier/separate event from the server-side one, contrary to the original framing. |
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
| `PD-20` | **Employment Status set to any real value** (not "Select one") | *(Corrected 2026-08-26)* Does **not** reveal or hide the Disability Covers section — confirmed live that the Mortgage & Living/Income Protection/Workability buttons are visible and enabled (`disabled: false`) before Employment Status is ever touched, identically to after. The original claim ("reveals for the first time") does not hold; `.kiro/steering/project-context.md`'s note ("Disability cover buttons visible regardless of Employment Status setting") was correct. Employment Status's actual effect (per `PD-09`) is that Apply is blocked if a Disability cover is priced without it set — a validation-time requirement, not a visibility one. |
| `PD-21` | **Occupation Code = IC** ("Individual Consideration") | Every cover shows an underwriting-referral warning: *"Please contact underwriting as this Occupation requires Individual Consideration."* Pre-tax Annual Income becomes effectively required — if missing, the combined error *"You must complete the following fields - Gender, Age Next Birthday, Occupation/Occupation Code, Employment Status & Annual Income $"* appears. |
| `PD-22` | **Occupation Code = AM** (Armed Forces) | See [Lump Sum Covers](../lump-sum-covers/page.md) and [Disability Covers](../disability-covers/page.md) for the specific covers this disables — noted here because it's triggered from this section. |

## Name field behavior (character filtering)

| Rule ID | Rule |
|---|---|
| `PD-23` | While typing, First Name/Last Name strip **apostrophes**, **numbers**, and **hash (`#`)** characters as they're entered. Hyphens, other special characters (`!`, `@`, `$`, `%`), and HTML angle brackets are **preserved** — there is no XSS sanitization at the input level, though this is a display-layer concern, not necessarily an exploitable one without confirming how the value is later rendered/used server-side. |
| `PD-24` | This character filtering appears to be an artifact of the specific keystroke-simulation method used during testing (real character-by-character typing) rather than a value set directly via script, which was observed to bypass both the filter and the max-length limit. **Needs developer confirmation of which behavior is the "real" validation** — the filtering seen may be specific to how a real browser keyboard event is handled by the page's own JS, in which case it's a genuine rule; if it's an artifact of the test tool's typing method, it isn't. |

## Age-banding — cover restrictions by age

| Rule ID | Rule |
|---|---|
| `PD-28` | **Life Cover max $50,000 for ANB 11–16.** Exact error: *"The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"*. No sum insured cap was observed for Life Cover at ANB 17–21 (tested up to $999,999). |
| `PD-29` | **TPD max $250,000 for ANB 17–21.** Exact error: *"The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. Age Next Birthday 17-21 is only eligible for Modified TPD"*. Below ANB 17, TPD still activates (Sum Insured field appears) but immediately shows the error from `PD-36`: *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"*. *(Corrected 2026-08-19: previously stated TPD was "silently blocked (button click is a no-op)" below ANB 17 — live testing confirms the cover does activate, it just errors.)* |
| `PD-30` | **TPD Definition restricted to 'Modified' for ANB 17–21.** The dropdown still shows all three options (Own / Any / Modified) — restriction is enforced **server-side only**. Selecting Own or Any at ANB 17–21 triggers the error in `PD-29`. |
| `PD-31` | **Maximum ages per cover (server-side — button remains clickable, error on SI entry):** Accidental Death (button text: `Acd. Death`) ANB ≤ 70 (*"The maximum Age Next Birthday for Accidental Death Cover is 70"*), Needlestick ANB ≤ 65 (*"The maximum Age Next Birthday for Needlestick cover is 65"*), Specific Injury ANB ≤ 61 (*"The maximum Age Next Birthday for Specific Injury cover is 61"*), **TPD (Stepped) ANB ≤ 65** (*"The maximum Age Next Birthday for Stepped 'Standalone TPD Cover' is 65"* — see [Lump Sum Covers — LSC-11b](../lump-sum-covers/page.md), added 2026-08-26). Cover activates and Sum Insured field appears, error shows after entering a value and blurring — not blocked at the UI level. *(Confirmed 2026-08-19 via live headless testing; TPD row added 2026-08-26.)* |
| `PD-32` | **Premium Structure dropdown shows ALL options regardless of age** (no client-side filtering). All "Level to X" options remain visible even when the client's age exceeds the level-to target age (e.g. "Level to 50" visible at ANB 56). Server validates on Save/Apply/Calculate. |

## Error message reference (this section)

| Rule ID | Error text | Trigger |
|---|---|---|
| `PD-33` | *"Required field!"* | Age Next Birthday empty |
| `PD-34` | *"Age next birthday should be between 11 and 75"* | Client-side range check |
| `PD-35` | *"Age Next Birthday must be between 11 and 75"* | Server-side range check (after blur) |
| `PD-36` | *"The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17"* | Age < 17 with a TPD cover configured |
| `PD-37` | *"You must complete the following fields - Gender, Age Next Birthday & Occupation/Occupation Code"* | Cover(s) configured but required personal fields still empty (this list narrows dynamically as fields are filled — see [Validation & Navigation](../validation-and-navigation/page.md)) |
| `PD-38` | *"Please contact underwriting as this Occupation requires Individual Consideration"* | Occupation Code = IC with incomplete fields |
