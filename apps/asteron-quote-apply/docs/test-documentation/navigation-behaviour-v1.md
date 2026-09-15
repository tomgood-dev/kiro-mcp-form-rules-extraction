# Navigation Behaviour — apply-flow progress panel / URE (navigation-behaviour-v1)

- **Test file:** `tests/quote-screen/navigation-behaviour-v1.spec.js`
- **Last run:** 2026-09-15, QA, ~21 min (two full apply-flow builds). 1 passed, 1 failed (expected-fail discrepancy), 1 skipped (deferred).
- **Source:** `docs/user-stories/User Story- Navigation Behaviour.md` (acceptance-criteria mode). Tick markup + sidebar behaviour confirmed live via `probes/probe-ure-nav-2026-09-15.js`; apply-flow map in `docs/apply-flow-end-to-end-2026-09-15.md`.
- **PC01** (URE questionnaire completed) is satisfied by driving through the Personal Statement to the Underwriting Decision.

## Results

| # | AC | What's Tested | Expected | Status | Notes |
|---|----|---------------|----------|--------|-------|
| 1 | AC01 | Completed sections show a completion tick in the progress sidebar | ≥4 sections ticked; Personal Details ticked | ✅ Pass | Tick = `<i class="text-success fa fa-check-ci">` next to each completed step. |
| 2 | AC03 (literal) | Clicking a progress-panel step navigates to that page | Navigates (spec) | ❌ Fail | **Discrepancy (expected-fail).** The sidebar step is a read-only `<div>` (no anchor, cursor:auto); clicking it does NOT navigate. |
| 3 | AC03 (intent) | Previous button navigates to the prior page; completed pages retain their ticks | Navigates + ticks retained | ✅ Pass | The story's underlying goal ("go to previous pages to update details") IS met — via the footer Previous button. |
| 4 | AC02 | Changing an answer that triggers further questions removes the completion tick | tick disappears | 🚫 Deferred | Reachable but not yet characterized — needs a probe mapping which answer-change spawns follow-up questions + the resulting untick. |
| 5 | AC04 | Updating section 3/4 + Next unticks section 5+ | section 5+ untick | 🚫 Deferred | Same as AC02 — the mid-questionnaire mutation path is not yet mapped. |

## Discrepancy (AC03 literal)

- **AC / Rule ID:** AC03
- **Verbatim requirement:** "When I want to update any of the previous pages And click those pages Then I should be redirected to corresponding page And I should be able to see completion tick."
- **Reproduction:** complete the URE questionnaire; in the left progress panel, click a completed step (e.g. "4. Personal Details").
- **Expected:** clicking the panel page redirects to that page.
- **Actual:** the progress-panel step is a non-interactive `<div>` (no `<a>`, `cursor:auto`); clicking it does nothing (URL unchanged). Confirmed live (probe-ure-nav-2026-09-15.js). Previous-page navigation is available via the footer **Previous** button instead (see test #3, which passes).
- **Environment:** QA, account a, 2026-09-15.
- **Test encoding:** `expect(stepClickNavigated).toBe(true)` in test #1 — expected-to-fail until the panel steps are made clickable (or the story is reconciled to "Previous button" with the BA).

## Deferred

| AC(s) | Reason |
|-------|--------|
| AC02, AC04 | Reachable (flow + sidebar fully driveable; AC01/AC03-Previous encoded+passing) but not yet characterized: both need mid-questionnaire answer-MUTATION that forces NEW follow-up questions, then re-reading tick state to prove the untick. The specific answer that spawns follow-ups hasn't been mapped by a probe. `getApplyFlowSidebar()`/`clickApplyFlowStep()` + apply-flow helpers make this the clear next follow-up. |
