# Saved Quote / Application Navigation — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/saved-quote-application-navigation-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~14 min · 8 tests
- **Source:** Acceptance-criteria mode — `docs/user-stories/User Story- Saved Quote-Application Navigation.md`
- **Result:** 5/8 passing, 3 deferred

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01 | Save + Save as New available with min details captured | Valid quote | Both present | ✅ Pass | |
| 2 | AC02 | Save opens 30-char reference popup + Save/Cancel | Click Save | Ref maxLength 30 + Save + Cancel | ✅ Pass | |
| 3 | AC04 | Cancel on reference popup returns to quote without saving | Save → Cancel | Popup closed; on quote page | ✅ Pass | |
| 4 | AC05 | Save as New opens 30-char reference popup + Save/Cancel | Click Save as New | Ref maxLength 30 + Save + Cancel | ✅ Pass | |
| 5 | AC07 | Cancel on Save-as-New reference popup returns to quote | Save as New → Cancel | Popup closed; on quote page | ✅ Pass | |
| 6 | AC03/06 | Saved quote gets status "Quote" and appears in home page | — | — | 🚫 Deferred | Lazy/flaky list + empty post-save QuoteId |
| 7 | AC08/09/10 | Open saved row routes by status (Quote/Pre-App/App-in-progress) | — | — | 🚫 Deferred | Row-open not cracked + statuses not manufacturable |
| 8 | AC11-15 | Client-birthday popups on opening a saved quote/application | — | — | 🚫 Deferred | Needs a pre-aged saved fixture + row-open |

## Deferred

| AC(s) | Reason |
|---|---|
| AC03, AC06 | Probe 2026-09-08: post-save URL QuoteId stayed empty and the Quotes & Applications landing list is lazy/flaky (populates only after "Refresh content"; empty within the wait on 2 of 3 accounts). Confirming the saved quote appears as a status-"Quote" row is not deterministic yet. |
| AC08, AC09, AC10 | Requires (a) cracking the saved-row open into a quote (the row `<A>` anchor click returned to the landing page with a null QuoteId), and (b) manufacturing "Pre-Application" and "Application In Progress" saved states, which need progressing an application past the quote screen (Duty of Disclosure / Personal Statement) — not creatable from the quote screen. |
| AC11, AC12, AC13, AC14, AC15 | Requires a saved quote/application whose client has had a birthday since it was saved (a real elapsed-time / backdated-DOB state not manufacturable on demand from the quote screen), plus the same not-yet-cracked saved-row open. |
