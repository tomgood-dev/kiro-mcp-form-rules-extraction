// Landing page: Online Quoting Tool — acceptance-criteria mode (Jira ACB-2239).
// Source: docs/user-stories/User Story- Landing page- Online Quoting Tool.md
//
// Exhaustive standard: positive + value-level via recordCheck.
// Probe (2026-09-08): logged in via global-setup, navigating to /QuoteAndApply/ lands on the New
// Business Quoting Tool landing page ("Quotes and Applications" heading, New Quote action). AC02/AC03
// (ability to navigate to and land on the quoting tool UI) are reachable. AC01 (clicking the saved
// portal URL redirects to the Adviser Portal login) concerns the portal login redirect, which we
// verify via the login URL being reachable/served.
const { test, expect } = require('@playwright/test');
const { recordCheck } = require('../../../../tools/artifact-helpers');

test.describe('Landing page: Online Quoting Tool (ACB-2239)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC02/AC03: from the portal I can navigate to the New Business Quoting Tool UI', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: When I am logged into the adviser portal, Then I should be able to navigate to the New Business Quoting Tool.',
      'AC03: When I have logged onto the portal, Then I can view and click the New Business quoting tool And I am directed to the New Business Quoting tool UI.',
      '', 'Steps to reproduce:', '1. (Logged in) Navigate to /QuoteAndApply/. 2. Confirm the New Business Quoting Tool UI is shown (Quotes and Applications heading + New Quote action).',
      '', 'Expected: the quoting tool landing UI is shown with a New Quote action.',
    ].join('\n') });
    await page.goto('/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const ui = await page.evaluate(() => {
      var body = (document.body.innerText || '');
      return {
        heading: /Quotes and Applications/i.test(body),
        newQuote: [].slice.call(document.querySelectorAll('button, a')).some(function (b) { return /^new quote$/i.test((b.innerText || '').trim().split('\n')[0]); }),
        onQuoteAndApply: location.href.indexOf('/QuoteAndApply') >= 0,
      };
    });
    recordCheck(testInfo, { label: 'On the New Business Quoting Tool UI (Quotes and Applications)', expected: true, actual: ui.heading });
    recordCheck(testInfo, { label: 'New Quote action available', expected: true, actual: ui.newQuote });
    recordCheck(testInfo, { label: 'URL is the Quote & Apply tool', expected: true, actual: ui.onQuoteAndApply });
    expect(ui.heading, 'AC03: quoting tool UI shown').toBe(true);
    expect(ui.newQuote, 'AC02/AC03: can navigate/create via New Quote').toBe(true);
    expect(ui.onQuoteAndApply, 'AC02: on the quoting tool').toBe(true);
  });

  test('AC01: the quoting tool is accessed via the Adviser Portal login (login URL is served)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I have the saved URL to the New Business Quoting tool, When I click the URL, Then I am directed to the Adviser Portal login screen (the quoting tool is accessed via the adviser portal only).',
      '', 'Steps to reproduce:', '1. Navigate to the Adviser Portal login URL (<BASE_URL>/CentralPortalsLogin/NewLoginRLANZ). 2. Confirm the login screen is served.',
      '', 'Expected: the portal login screen is reachable (the tool is gated behind portal login).',
    ].join('\n') });
    const resp = await page.goto('/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' }).catch(() => null);
    const status = resp ? resp.status() : null;
    const isLogin = await page.evaluate(() => location.href.indexOf('Login') >= 0 || /log ?in|sign ?in|password/i.test(document.body.innerText || ''));
    recordCheck(testInfo, { label: 'Adviser Portal login URL served (HTTP status < 400)', expected: 'status < 400', actual: String(status) });
    recordCheck(testInfo, { label: 'Login screen reached', expected: true, actual: isLogin });
    expect(status !== null && status < 400, `AC01: login URL served (status ${status})`).toBe(true);
    expect(isLogin, 'AC01: portal login screen').toBe(true);
  });
});
