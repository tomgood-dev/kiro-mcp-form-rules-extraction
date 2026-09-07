# Save Quote / Save As New — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/save-quote-save-as-new-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~17 min · 8 tests
- **Source:** Acceptance-criteria mode — Jira ACB-2241 (`docs/user-stories/User Story- Save Quote-Save As New.md`)
- **Result:** 6/8 passing, 1 confirmed-failing (AC12 discrepancy), 1 deferred

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01 | Save and Save as New actions both present | Valid quote (ANB/Gender/Occ + Life $500k) | Both actions present | ✅ Pass | |
| 2 | AC02 | Save opens reference popup (30-char "Add Reference (Optional)") + Save/Cancel | Click Save; read popup | Ref field maxLength 30 + Save + Cancel | ✅ Pass | Value-level: label + maxLength |
| 3 | AC04 | Cancel on reference popup closes it, returns to quote | Save → Cancel | Popup closed; quote form present | ✅ Pass | |
| 4 | AC05 | Save as New opens 30-char reference popup + Save/Cancel | Click Save as New; read popup | Ref field maxLength 30 + Save + Cancel | ✅ Pass | |
| 5 | AC09 | Close on a quote with data prompts save-confirm popup | Valid quote → Close | "Would you like to save…?" + Cancel/Save/Don't Save | ✅ Pass | Value-level: message + 3 buttons |
| 6 | AC10 | Cancel on close-confirm returns to quote | Close → Cancel | Quote form still present | ✅ Pass | |
| 7 | AC12 | Save with missing min-details → "Enter minimum details to save quote" | First name only → Close → Save | "Enter minimum details to save quote" | ❌ Fail | App shows inline "Required field!" instead of the specified message — expected-fail vs story |
| 8 | AC03/06/08/11/13 | Persisted quote number/status + home-page row + redirect-to-landing | — | — | 🚫 Deferred | Needs post-save QuoteId signal + reliable landing-list row-open (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC03, AC06, AC08, AC11, AC13 | Probe 2026-09-08: after clicking the reference-popup Save the URL QuoteId stayed empty (no confirmable created quote-number / "same quote" identity), and the Quotes & Applications landing list is lazy/flaky (populates only after "Refresh content"; empty within the wait on 2 of 3 accounts) with the saved-row open into a quote not reliably cracked (the row `<A>` anchor click returned to the landing page with a null QuoteId). So the persisted-quote-number, home-page-row, same-name re-save (AC08), Save-button-disabled-until-changed, and redirect-to-landing (AC11/AC13) clauses are not deterministically assertable yet. Reachable once the list row-open + a post-save QuoteId signal are established. |

## Discrepancies (confirmed, expected-fail)

| AC | Was (story) | Now (QA app) |
|---|---|---|
| AC12 | Save with missing minimum details displays "Enter minimum details to save quote" | No such message appears; the app renders inline "Required field!" markers on the empty ANB/Gender fields instead. Assertion written to the story's message; fails until the app surfaces it. |
