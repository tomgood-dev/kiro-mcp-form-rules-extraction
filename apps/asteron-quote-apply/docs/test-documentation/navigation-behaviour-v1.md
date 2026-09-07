# Navigation Behaviour (URE questionnaire) — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/navigation-behaviour-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · <1 min · 1 test
- **Source:** Acceptance-criteria mode — `docs/user-stories/User Story- Navigation Behaviour.md`
- **Result:** 0/1 passing, 1 deferred (URE questionnaire not reachable from the quote screen)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01-04 | URE completion ticks appear/disappear + previous-page navigation | — | — | 🚫 Deferred | PC01 = completed URE questionnaire (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC01–AC04 | All ACs concern the URE (underwriting) questionnaire's navigation panel — completion tick marks appearing/disappearing as answers change, and navigating back to previous underwriting pages. PC01 requires a **completed URE questionnaire**, which sits deep in the Apply/underwriting flow (past the Quote screen and Duty of Disclosure). Probe 2026-09-08 confirmed no path from the quote screen into the URE questionnaire. Reachable only in a dedicated URE/underwriting-flow test pass once that flow is reachable end-to-end. |
