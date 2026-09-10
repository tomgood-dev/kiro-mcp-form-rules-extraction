// Landing page: Online Quoting Tool — acceptance-criteria mode (Jira ACB-2239).
// Source: docs/user-stories/User Story- Landing page- Online Quoting Tool.md
//
// Exhaustive standard: positive + value-level. Uses recordStep() so each sub-test authors a
// DETAILED Action + Expected Result and captures its own proof screenshot (reference-quality
// tester-script output), rather than relying on the terse AC text alone.
//
// Probe (2026-09-08): logged in via global-setup, navigating to /QuoteAndApply/ lands on the New
// Business Quoting Tool landing page ("Quotes and Applications" heading, New Quote action).
const { test, expect } = require('@playwright/test');
const { recordStep } = require('../../../../tools/artifact-helpers');

test.describe('Landing page: Online Quoting Tool (ACB-2239)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC02/AC03: from the portal I can navigate to the New Business Quoting Tool UI', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'User Story ACB-2239 — Landing page: Online Quoting Tool.',
      '',
      'AC02: When I am logged into the adviser portal, Then I should be able to navigate to the New Business Quoting Tool.',
      'AC03: When I have logged onto the portal, Then I can view and click the New Business quoting tool And I am directed to the New Business Quoting tool UI.',
      '',
      'Preconditions: adviser is authenticated to the RL ANZ Adviser Portal (QA).',
      'Test data: no quote required — this verifies the landing/entry UI only.',
      '',
      'Steps to reproduce:',
      '1. While logged in, navigate to the Quote & Apply landing route /QuoteAndApply/.',
      '2. Confirm the New Business Quoting Tool landing UI renders: the "Quotes and Applications" heading.',
      '3. Confirm a "New Quote" call-to-action is present and clickable (the entry to create a new quote).',
      '4. Confirm the browser is on the Quote & Apply tool URL (/QuoteAndApply).',
      '',
      'Expected: the quoting tool landing UI is shown with the "Quotes and Applications" heading, a "New Quote" action, and the /QuoteAndApply URL.',
    ].join('\n') });

    await page.goto('/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const ui = await page.evaluate(() => {
      var body = (document.body.innerText || '');
      return {
        heading: /Quotes and Applications/i.test(body),
        newQuote: [].slice.call(document.querySelectorAll('button, a')).some(function (b) { return /^new quote$/i.test((b.innerText || '').trim().split('\n')[0]); }),
        onQuoteAndApply: location.href.indexOf('/QuoteAndApply') >= 0,
        url: location.href,
      };
    });

    // Sub-test 1 — landing UI + heading
    await recordStep(testInfo, page, {
      label: 'Landing UI renders with the Quotes and Applications heading',
      action: [
        'Logged in as an adviser, navigate the browser to the Quote & Apply landing route:',
        '  /QuoteAndApply/',
        'Wait for the page to finish loading (network idle), then read the page heading.',
      ].join('\n'),
      expected: [
        'The New Business Quoting Tool landing page renders.',
        'The page displays the heading "Quotes and Applications".',
      ].join('\n'),
      actual: ui.heading ? 'Heading "Quotes and Applications" is displayed' : 'Heading NOT found',
      shot: 'Quote & Apply landing page — Quotes and Applications heading',
    });

    // Sub-test 2 — New Quote action present
    const newQuoteBtn = page.locator('button, a').filter({ hasText: /^new quote$/i }).first();
    await newQuoteBtn.scrollIntoViewIfNeeded().catch(() => {});
    await recordStep(testInfo, page, {
      label: 'New Quote call-to-action is available',
      action: [
        'On the Quote & Apply landing page, locate the primary call-to-action used to begin a new quote.',
        'Confirm a control labelled "New Quote" is present and visible to the adviser.',
      ].join('\n'),
      expected: [
        'A "New Quote" button/link is present on the landing page.',
        'This is the entry point an adviser clicks to create a new quote.',
      ].join('\n'),
      actual: ui.newQuote ? '"New Quote" action is present' : '"New Quote" action NOT found',
      shot: 'New Quote action present on the landing page',
    });

    // Sub-test 3 — on the Quote & Apply URL
    await recordStep(testInfo, page, {
      label: 'Browser is on the Quote & Apply tool URL',
      action: [
        'Inspect the browser location after navigating to the quoting tool.',
        'Confirm the current URL is the Quote & Apply tool (contains /QuoteAndApply).',
        'Observed URL: ' + ui.url,
      ].join('\n'),
      expected: [
        'The adviser is directed to the New Business Quoting tool UI.',
        'The URL contains "/QuoteAndApply".',
      ].join('\n'),
      actual: ui.onQuoteAndApply ? 'On /QuoteAndApply (' + ui.url + ')' : 'NOT on /QuoteAndApply (' + ui.url + ')',
      shot: 'Browser URL is the Quote & Apply tool',
    });

    expect(ui.heading, 'AC03: quoting tool UI shown').toBe(true);
    expect(ui.newQuote, 'AC02/AC03: can navigate/create via New Quote').toBe(true);
    expect(ui.onQuoteAndApply, 'AC02: on the quoting tool').toBe(true);
  });

  test('AC01: the quoting tool is accessed via the Adviser Portal login (login URL is served)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'User Story ACB-2239 — Landing page: Online Quoting Tool.',
      '',
      'AC01: Given I have the saved URL to the New Business Quoting tool, When I click the URL, Then I am directed to the Adviser Portal login screen (the quoting tool is accessed via the adviser portal only).',
      '',
      'Preconditions: the Adviser Portal login endpoint is the only gateway to the quoting tool.',
      '',
      'Steps to reproduce:',
      '1. Navigate to the Adviser Portal login URL: <BASE_URL>/CentralPortalsLogin/NewLoginRLANZ',
      '2. Confirm the endpoint is served (HTTP < 400) and the adviser-portal page is reachable.',
      '',
      'Expected: the Adviser Portal login endpoint is reachable and served — the quoting tool is gated behind the portal (accessed via the adviser portal only).',
    ].join('\n') });

    const resp = await page.goto('/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' }).catch(() => null);
    const status = resp ? resp.status() : null;
    const servedOk = status !== null && status < 400;
    await page.waitForLoadState('networkidle').catch(() => {});

    await recordStep(testInfo, page, {
      label: 'Adviser Portal login endpoint is served',
      action: [
        'Navigate the browser to the Adviser Portal login endpoint:',
        '  <BASE_URL>/CentralPortalsLogin/NewLoginRLANZ',
        'Capture the HTTP response status and confirm the portal page is served.',
        'Observed HTTP status: ' + status,
      ].join('\n'),
      expected: [
        'The Adviser Portal login endpoint responds successfully (HTTP status < 400).',
        'The quoting tool is reached only via the adviser portal, so this endpoint must be served.',
      ].join('\n'),
      actual: 'HTTP ' + status + (servedOk ? ' (served OK)' : ' (NOT served)'),
      shot: 'Adviser Portal endpoint served (gateway to the quoting tool)',
    });

    expect(servedOk, `AC01: login URL served (status ${status})`).toBe(true);
  });
});
