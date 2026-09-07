// Occupation (Apply-flow screen) — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Occupation.md
//
// This story is the APPLY-FLOW "Occupation" screen, NOT the quote-screen occupation control.
// Its ACs are application-flow navigation/capture: AC02 capture Employer/Country/Address + the
// "applying for any of the following offers" dropdown; AC03 "click Previous -> Insurance History
// screen"; AC04 "click Next -> Income screen". These live deep in the Apply flow (after Duty of
// Disclosure), which is not reachable from the Quote screen without progressing a full application
// (historically payment/flow-gated — see validation-and-navigation notes and the iteration-001
// payment-gate finding). The QUOTE-screen occupation control (dropdown + code) is covered by the
// Occupational Codes spec (occupational-codes-v1). Deferred here with that reachability evidence.
const { test, expect } = require('@playwright/test');

test.describe('Occupation — Apply-flow screen', () => {
  test('AC01/AC02/AC03/AC04: Apply-flow Occupation screen (Employer/Country/Address; Previous->Insurance History; Next->Income)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: ability to provide the client\'s Occupation on the application. AC02: capture "applying for offers" dropdown (Not applicable / Dentists & Dental Surgeons), Employer name, Country, Address. AC03: Previous -> Insurance History screen. AC04: Next -> Income screen.',
      '',
      'Deferred reason: this is the Apply-FLOW Occupation screen (its ACs are application navigation:',
      'Previous->Insurance History, Next->Income), reached only after progressing an application past',
      'Duty of Disclosure — not reachable from the Quote screen. The Apply flow is historically',
      'payment/flow-gated in this environment. The quote-screen occupation control is covered separately',
      'by occupational-codes-v1 (ACB-6504).',
    ].join('\n') });
    test.fixme(true, 'Deferred (not reachable from the Quote screen): the Occupation story is the Apply-flow screen (Previous->Insurance History, Next->Income; captures Employer/Country/Address). Reaching it requires progressing a full application past Duty of Disclosure, which is not driveable from the quote screen in this environment (Apply flow historically payment/flow-gated). Encode as part of a dedicated Apply-flow test pass once that flow is reachable end-to-end. The quote-screen occupation dropdown + code eligibility is already covered by occupational-codes-v1.');
    expect(true).toBe(true);
  });
});
