// Clone Quote — acceptance-criteria mode (Jira ACB-5748).
// Source: docs/user-stories/User Story - Clone Quote.md
//
// PC01 = a SUBMITTED application. All ACs (AC01-AC05) are gated on cloning a submitted application from
// the landing page. Probe (2026-09-08): the landing "Quotes and Applications" status filter includes
// "Submitted", but filtering to Submitted returned ZERO rows on the test account — there is no submitted
// application to clone. Creating one requires the full Apply → Payment → Submit flow, which is
// payment-gated in this environment (see iteration-001 payment-gate finding). So Clone is not reachable
// from the browser without first submitting an application. Fully deferred with this evidence — not
// silently omitted.
const { test, expect } = require('@playwright/test');

test.describe('Clone Quote (ACB-5748)', () => {
  test('AC01/AC02/AC03/AC04/AC05: clone a submitted application (prepopulated quote; birthday-locked variant; Apply Now uses quote-level data only)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: when an application has been submitted, I can select the option to Clone the quote for it.',
      'AC02: clicking Clone Quote on the landing page successfully clones the quote.',
      'AC03: the cloned quote is displayed with Personal Details, all covers/options (personal+business), Kids Cover, Premium & Frequency, Discounts, Commissions & Loadings prepopulated, and I can Apply Now.',
      'AC04: if a client had a birthday before the Clone action, the cloned quote is prepopulated AND greyed out with the "quote is locked … select CREATE NEW" message.',
      'AC05: after cloning, Apply Now uses only quote-level data (no prior application answers/interview/personal details/payment).',
      '',
      'Deferred reason: PC01 requires a SUBMITTED application. Probe 2026-09-08 — the landing status filter',
      'includes "Submitted" but returned ZERO submitted rows on the test account; creating one requires the',
      'full Apply → Payment → Submit flow (payment-gated). Clone is a landing-page action on a submitted',
      'application and cannot be reached from the quote screen without that submission.',
    ].join('\n') });
    test.fixme(true, 'Deferred (not reachable): PC01 is a Submitted application. Probe 2026-09-08 found 0 rows under the landing "Submitted" status filter, and producing a submitted application requires the full Apply+Payment+Submit flow (payment-gated in this environment). Clone Quote therefore has no browser path here. Reachable once a submitted-application fixture exists on a test account (or the payment gate is bypassable in a test env), then encode AC01-AC05 against a real cloned quote.');
    expect(true).toBe(true);
  });
});
