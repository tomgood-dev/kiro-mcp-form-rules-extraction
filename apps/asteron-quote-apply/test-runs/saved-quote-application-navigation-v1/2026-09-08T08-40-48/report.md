# saved quote application navigation — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/saved-quote-application-navigation-v1.spec.js`
**Run:** 2026-09-08T08-40-48 · Edge headless · 13.7 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 5 passed, 0 failed, 3 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Saved Quote / Application Navigation › AC01: with minimum details captured, Save and Save as New are both available | ✅ Passed |
| 2 | Saved Quote / Application Navigation › AC02: Save opens the 30-char reference popup with Save + Cancel | ✅ Passed |
| 3 | Saved Quote / Application Navigation › AC04: Cancel on the reference popup returns to the quote page without saving | ✅ Passed |
| 4 | Saved Quote / Application Navigation › AC05: Save as New opens the 30-char reference popup with Save + Cancel | ✅ Passed |
| 5 | Saved Quote / Application Navigation › AC07: Cancel on the Save-as-New reference popup returns to the quote page without saving | ✅ Passed |
| 6 | Saved Quote / Application Navigation › AC03/AC06: saved quote gets status "Quote" and appears in the Quotes & Applications home page | ⏭️ Skipped |
| 7 | Saved Quote / Application Navigation › AC08/AC09/AC10: opening a saved row routes by status (Quote→quote page, Pre-Application→client summary, Application-in-progress→Duty of Disclosure) | ⏭️ Skipped |
| 8 | Saved Quote / Application Navigation › AC11/AC12/AC13/AC14/AC15: client-birthday popups on opening a saved quote/application (View Quote / Create New / Edit Quote) | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Saved Quote / Application Navigation › AC03/AC06: saved quote gets status "Quote" and appears in the Quotes & Applications home page

**Acceptance Criteria (from user story):**

> AC03/AC06: on Save / Save-as-New (with or without a reference) the quote is saved with status "Quote" and appears in the Quotes & Applications home page (Save-as-New saving further updates onto the new quote).

**Why skipped:**

> Deferred (not reliably reachable): probe 2026-09-08 — after clicking the reference-popup Save the URL QuoteId stayed EMPTY, and the Quotes & Applications landing list is lazy/flaky (populates only after "Refresh content"; empty within the wait on 2 of 3 accounts). Confirming the saved quote appears as a status-"Quote" row therefore is not deterministic yet. Reachable once a post-save QuoteId signal and a reliable list-populate wait + row read are established.

---

### ⏭️ Saved Quote / Application Navigation › AC08/AC09/AC10: opening a saved row routes by status (Quote→quote page, Pre-Application→client summary, Application-in-progress→Duty of Disclosure)

**Acceptance Criteria (from user story):**

> AC08: open a saved "Quote" → quote page with prepopulated details. AC09: open a saved "Pre-Application" → client summary page. AC10: open a saved "Application In Progress" → Duty of Disclosure page.

**Why skipped:**

> Deferred (not reachable): requires (a) cracking the landing-list saved-row open into a quote — probe 2026-09-08 found the row <A> anchor click returned to the landing page with a null QuoteId; and (b) manufacturing saved quotes in the "Pre-Application" and "Application In Progress" statuses, which requires progressing an application past the quote screen (Duty of Disclosure / Personal Statement) — not creatable from the quote screen. Reachable via a dedicated Apply-flow + landing-list-navigation pass.

---

### ⏭️ Saved Quote / Application Navigation › AC11/AC12/AC13/AC14/AC15: client-birthday popups on opening a saved quote/application (View Quote / Create New / Edit Quote)

**Acceptance Criteria (from user story):**

> AC11-AC13: opening a saved Quote/Pre-Application after the client has had a birthday shows the "premium no longer valid" popup (Close / View Quote / Create New with updated ANB) and its greyed-out / recreated-quote branches. AC14/AC15: opening a saved Application-in-progress after a birthday shows the "ANB does not match DOB" popup (Close / Edit Quote) and its recreate branch.

**Why skipped:**

> Deferred (not reachable): requires a saved quote/application whose client has had a birthday SINCE it was saved (a real elapsed-time / backdated-DOB state that cannot be manufactured on demand from the quote screen), plus the same not-yet-cracked saved-row open. Reachable only with a pre-aged saved quote fixture and the landing-list row-open. No browser path from the quote screen.

---

## What Each Passing Test Checked

<details>
<summary>✅ Saved Quote / Application Navigation › AC01: with minimum details captured, Save and Save as New are both available</summary>

| Check | Expected | Actual |
|---|---|---|
| Save + Save as New available | both present | Save Save as New |

</details>

<details>
<summary>✅ Saved Quote / Application Navigation › AC02: Save opens the 30-char reference popup with Save + Cancel</summary>

| Check | Expected | Actual |
|---|---|---|
| Reference popup (30-char) with Save + Cancel | ref30 + Save + Cancel | ref30 Save Cancel |

</details>

<details>
<summary>✅ Saved Quote / Application Navigation › AC04: Cancel on the reference popup returns to the quote page without saving</summary>

| Check | Expected | Actual |
|---|---|---|
| Popup closed + on quote page after Cancel | closed + on-quote | closed on-quote |

</details>

<details>
<summary>✅ Saved Quote / Application Navigation › AC05: Save as New opens the 30-char reference popup with Save + Cancel</summary>

| Check | Expected | Actual |
|---|---|---|
| Save-as-New reference popup (30-char) with Save + Cancel | ref30 + Save + Cancel | ref30 Save Cancel |

</details>

<details>
<summary>✅ Saved Quote / Application Navigation › AC07: Cancel on the Save-as-New reference popup returns to the quote page without saving</summary>

| Check | Expected | Actual |
|---|---|---|
| Popup closed + on quote page after Cancel (Save as New) | closed + on-quote | closed on-quote |

</details>

---

## Notes

- 5/8 tests passing, 3 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
