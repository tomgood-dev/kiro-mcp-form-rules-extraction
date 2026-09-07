# navigation behaviour — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/navigation-behaviour-v1.spec.js`
**Run:** 2026-09-08T08-40-50 · Edge headless · 2.0 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 0 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Navigation Behaviour (URE questionnaire) › AC01/AC02/AC03/AC04: URE completion ticks appear/disappear and previous-page navigation | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Navigation Behaviour (URE questionnaire) › AC01/AC02/AC03/AC04: URE completion ticks appear/disappear and previous-page navigation

**Acceptance Criteria (from user story):**

> AC01: when the URE personal questionnaire is completed, a completed tick appears in the navigation panel.
> AC02: changing an answer that triggers further questions removes the completion tick.
> AC03: clicking a previous page navigates there and shows its completion tick.
> AC04: after updating details in section 3 or 4 and clicking Next, section 5 onwards are no longer ticked.
> 
> Deferred reason: PC01 requires a COMPLETED URE questionnaire. The URE (underwriting) questionnaire is
> inside the Apply/underwriting flow, past the Quote screen and Duty of Disclosure — not reachable from
> the quote screen (probe 2026-09-08 confirmed no quote-screen path into it).

**Why skipped:**

> Deferred (not reachable from the Quote screen): all ACs concern the URE underwriting questionnaire navigation panel (completion ticks + previous-page navigation), which requires a completed URE questionnaire deep in the Apply/underwriting flow (past Duty of Disclosure). Not reachable from the quote screen. Encode in a dedicated URE/underwriting-flow test pass once that flow is reachable end-to-end.

---

## Notes

- 0/1 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
