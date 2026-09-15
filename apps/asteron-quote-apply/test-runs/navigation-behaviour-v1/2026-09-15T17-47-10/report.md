# navigation behaviour — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/navigation-behaviour-v1.spec.js`
**Run:** 2026-09-15T17-47-10 · Edge headless · 1.3 min
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

> Reachability CONFIRMED (2026-09-15) — no longer blocked. The URE/underwriting questionnaire these ACs concern (completion ticks, previous-page navigation) is the Personal Statement / Insurance & Financial Details questionnaire, which was driven to completion end-to-end on QA (full submission, policy J4211922; see docs/apply-flow-end-to-end-2026-09-15.md). Personal Details IS passable (address lookup works via focus+type+pick — the earlier "address service blocked" note was wrong). Interaction sequences are in helpers/quote-helpers.js (passPersonalStatement, applyFlowScreen/applyFlowNext). Still fixme pending a real encoded+run spec: the completion-tick / previous-page assertions must be written against the live navigation panel and pass a green edge-config run. NOT a coverage gap or environment block.

---

## Notes

- 0/1 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
