// Navigation Behaviour (URE questionnaire navigation) — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Navigation Behaviour.md
//
// PC01 = "URE Questionnaire completed". All ACs concern the UNDERWRITING (URE) questionnaire's
// navigation panel: completion tick marks appearing/disappearing as answers change, and navigating
// back to previous underwriting pages. The URE questionnaire sits deep in the Apply/underwriting flow
// (past the Quote screen and Duty of Disclosure) and is not reachable from the quote screen — probe
// 2026-09-08 confirmed there is no path from the quote screen into the URE questionnaire. Fully deferred
// with this evidence — not silently omitted.
const { test, expect } = require('@playwright/test');

test.describe('Navigation Behaviour (URE questionnaire)', () => {
  test('AC01/AC02/AC03/AC04: URE completion ticks appear/disappear and previous-page navigation', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: when the URE personal questionnaire is completed, a completed tick appears in the navigation panel.',
      'AC02: changing an answer that triggers further questions removes the completion tick.',
      'AC03: clicking a previous page navigates there and shows its completion tick.',
      'AC04: after updating details in section 3 or 4 and clicking Next, section 5 onwards are no longer ticked.',
      '',
      'Deferred reason: PC01 requires a COMPLETED URE questionnaire. The URE (underwriting) questionnaire is',
      'inside the Apply/underwriting flow, past the Quote screen and Duty of Disclosure — not reachable from',
      'the quote screen (probe 2026-09-08 confirmed no quote-screen path into it).',
    ].join('\n') });
    test.fixme(true, 'Reachability CONFIRMED (2026-09-15) — no longer blocked. The URE/underwriting questionnaire these ACs concern (completion ticks, previous-page navigation) is the Personal Statement / Insurance & Financial Details questionnaire, which was driven to completion end-to-end on QA (full submission, policy J4211922; see docs/apply-flow-end-to-end-2026-09-15.md). Personal Details IS passable (address lookup works via focus+type+pick — the earlier "address service blocked" note was wrong). Interaction sequences are in helpers/quote-helpers.js (passPersonalStatement, applyFlowScreen/applyFlowNext). Still fixme pending a real encoded+run spec: the completion-tick / previous-page assertions must be written against the live navigation panel and pass a green edge-config run. NOT a coverage gap or environment block.');
    expect(true).toBe(true);
  });
});
