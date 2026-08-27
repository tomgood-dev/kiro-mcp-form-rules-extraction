# Select Default Commission Category — Test Run Report

**Test file:** `select-default-commission-category-v1.spec.js`
**Run:** 2026-08-27 08:39 · Edge headless · 7.6 min
**Environment:** outsystems-dev.asteronlife.co.nz
**Result:** 3 passed, 5 failed (known regressions — ACB-13175)

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | AC01/AC02/AC03/AC14: Default for Agency display + Flexi Rate N/A auto-select | ✅ Passed |
| 2 | AC11: 30% Flexi Rate forces Nil Commission | ✅ Passed |
| 3 | AC04/AC05: Update button disabled until changed | ❌ Failed |
| 4 | ADV-08: Example 1, Flexi Rate 2.5% — single valid IC/RC option (AC10, AC14) | ❌ Failed |
| 5 | ADV-09: Example 2, Flexi Rate 7.5% — single valid IC/RC option (AC10, AC14) | ❌ Failed |
| 6 | ADV-10: Example 3, Flexi Rate 15% — single valid IC/RC option (AC10, AC14) | ❌ Failed |
| 7 | ADV-11: Example 4, Flexi Rate 12.5% — multiple valid IC/RC options, no auto-select (AC10, AC15) | ✅ Passed |
| 8 | AC06/AC07/AC08: Update button save, confirmation message, persistence | ❌ Failed |

---

## Preconditions

- Logged-in adviser session (account: hanno.coetzee+1123@resolutionlife.com.au)
- Each test opens its own **fresh, priced quote** (Age 35, Male, Occupation Code AA, Life $500k) — any valid persona works; the quote just needs to price so Adviser Use has something to act on
- For Flexi Rate tests: the rate is set on the quote **before** opening Adviser Use, on its own fresh quote per value

---

## Failed Tests — Detail

### ❌ Test 3: AC04/AC05 — Update button disabled until changed

**Acceptance Criteria (verbatim from ACB-13175):**

> **AC04** — *Update Button Disabled by Default*
> **Given** the currently saved default commission category is displayed
> **When** no changes have been made by the user
> **Then** the Update button is disabled.
>
> **AC05** — *Enable Update Button After Change*
> **Given** the user changes the selected commission category
> **When** the new selection differs from the saved value
> **Then** the Update button becomes enabled.

**Steps to reproduce:**
1. Open a fresh priced quote, open Adviser Use.
2. Immediately (zero interaction) check the Update button's disabled state.

**Expected:** `disabled = true`
**Actual:** `disabled = false` — the button starts enabled with no changes made.

<!-- Screenshot (next run): ![AC04/AC05 failure](screenshot-placeholder) -->

---

### ❌ Test 4: ADV-08 — Flexi Rate 2.5%, single valid IC/RC option

**Acceptance Criteria (verbatim from ACB-13175):**

> **AC14** — *Auto-Select Single Available IC/RC Option*
> **Given** the selected commission category and Flexi-Rate combination has only one valid IC/RC option
> **When** the commission details are displayed
> **Then** QA automatically selects the available IC/RC option
> **And** no manual user selection is required.

**Steps to reproduce:**
1. Open a fresh quote, set Flexi Rate = 2.5%.
2. Open Adviser Use.
3. Read the "Select IC/RC" dropdown's selected value.

**Expected:** Auto-selected to `IC-100%, RC-50%` (the only Upfront-valid option)
**Actual:** Stays on `Please Select`

<!-- Screenshot (next run): ![ADV-08 failure](screenshot-placeholder) -->

---

### ❌ Test 5: ADV-09 — Flexi Rate 7.5%, single valid IC/RC option

**Acceptance Criteria (verbatim from ACB-13175):**

> **AC14** — (same as above)

**Steps to reproduce:**
1. Open a fresh quote, set Flexi Rate = 7.5%.
2. Open Adviser Use.
3. Read the "Select IC/RC" dropdown's selected value.

**Expected:** Auto-selected to `IC-75%, RC-100%`
**Actual:** Stays on `Please Select`

<!-- Screenshot (next run): ![ADV-09 failure](screenshot-placeholder) -->

---

### ❌ Test 6: ADV-10 — Flexi Rate 15%, single valid IC/RC option

**Acceptance Criteria (verbatim from ACB-13175):**

> **AC14** — (same as above)

**Steps to reproduce:**
1. Open a fresh quote, set Flexi Rate = 15%.
2. Open Adviser Use.
3. Read the "Select IC/RC" dropdown's selected value.

**Expected:** Auto-selected to `IC-50%, RC-50%`
**Actual:** Stays on `Please Select`

<!-- Screenshot (next run): ![ADV-10 failure](screenshot-placeholder) -->

---

### ❌ Test 8: AC06/AC07/AC08 — Update save, confirmation, persistence

**Acceptance Criteria (verbatim from ACB-13175):**

> **AC06** — *Save Updated Default Commission Category*
> **Given** the user has selected a different commission category
> **When** the user clicks the Update button
> **Then** the selected commission category is saved as the agency default
> **And** the updated value is available for future quotes and applications.
>
> **AC07** — *Display Confirmation Message*
> **Given** the default commission category has been successfully saved
> **When** the save operation completes
> **Then** the following confirmation message is displayed:
> "Your default commission structure setting has been updated."
>
> **AC08** — *Persist Saved Value*
> **Given** a default commission category has been saved
> **When** the user exits and later reopens the Adviser Use function
> **Then** the previously saved default commission category is displayed.

**Steps to reproduce:**
1. Open a fresh priced quote, open Adviser Use.
2. Change "Default for Agency" from Upfront to Level 30.
3. Click the Update button.
4. Check for the confirmation message.
5. Sign out, sign back in with the same account.
6. Open a new fresh priced quote, open Adviser Use.
7. Check whether the value persisted as Level 30.

**Expected:** Confirmation message appears (AC07); fresh session shows Level 30 (AC06/AC08).
**Actual:** No confirmation message. Fresh session still shows Upfront — value did not persist.

<!-- Screenshot (next run): ![AC06/AC07/AC08 failure](screenshot-placeholder) -->

---

## Notes

- All 5 failures were first identified on 2026-08-25 and have reproduced consistently across 3 independent runs (2026-08-25, 2026-08-26, 2026-08-27). No variance between runs.
- Findings 4-6 (AC14 at 2.5%/7.5%/15%) share a pattern: the auto-select logic works at Flexi Rate N/A (trivially one option) and correctly does *not* fire at 12.5% (multiple valid options, AC15), but fails at every rate where it should pick the single Upfront-valid option from a multi-option list.
- The test assertions are written to the **spec's expected behavior** — they will pass automatically once the regressions are fixed, with no test changes needed.
- Original detailed investigation: `test-runs/select-default-commission-category/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`
