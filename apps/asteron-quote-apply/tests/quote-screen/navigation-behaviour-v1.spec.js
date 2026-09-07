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
    test.fixme(true, 'Deferred (not reachable from the Quote screen): all ACs concern the URE underwriting questionnaire navigation panel (completion ticks + previous-page navigation), which requires a completed URE questionnaire deep in the Apply/underwriting flow (past Duty of Disclosure). Not reachable from the quote screen. Encode in a dedicated URE/underwriting-flow test pass once that flow is reachable end-to-end.');
    expect(true).toBe(true);
  });
});
