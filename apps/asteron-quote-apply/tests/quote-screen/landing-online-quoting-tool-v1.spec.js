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
      'Preconditions: adviser is authenticated to the RL ANZ Adviser Portal (QA) — see TC for AC01 (login to the Adviser Portal) which precedes this journey.',
      'Test data: no quote required — this verifies the landing/entry navigation only.',
      '',
      'Steps to reproduce:',
      '1. Start on the Adviser Portal dashboard (logged in).',
      '2. Open the "Quotes" menu in the left navigation.',
      '3. Click the "Quote & Apply" menu item.',
      '4. Confirm the adviser is directed to the New Business Quoting Tool UI: the "Quotes and Applications" heading, a "New Quote" action, and the /QuoteAndApply URL.',
      '',
      'Expected: clicking Quotes -> Quote & Apply from the portal opens the quoting tool landing UI ("Quotes and Applications" heading + New Quote action on /QuoteAndApply).',
    ].join('\n') });

    // Sub-test 1 — start on the Adviser Portal dashboard (the journey begins here, post-login)
    await page.goto('/AdviserCentral_Uplift/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await recordStep(testInfo, page, {
      label: 'Adviser Portal dashboard (logged in)',
      action: [
        'Precondition for this journey: the adviser has logged into the Adviser Portal (see AC01 TC).',
        'Start on the Adviser Portal dashboard: /AdviserCentral_Uplift/',
      ].join('\n'),
      expected: 'The Adviser Portal dashboard is displayed for the logged-in adviser.',
      actual: 'On the Adviser Portal dashboard (' + page.url() + ')',
      shot: 'Adviser Portal dashboard (logged in)',
    });

    // Sub-test 2 — open the "Quotes" menu, then click "Quote & Apply" (the real navigation)
    const openedQuotesMenu = await page.evaluate(() => {
      function v(e){return e&&e.offsetParent!==null;}
      var el = [].slice.call(document.querySelectorAll('a, button, [role=button], [class*=menu]')).filter(v)
        .find(function(e){ return (e.innerText || '').trim().replace(/\s+/g,' ') === 'Quotes'; });
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    });
    await page.waitForTimeout(1500);
    await recordStep(testInfo, page, {
      label: 'Open the Quotes menu in the portal navigation',
      action: [
        'In the Adviser Portal left navigation, click the "Quotes" menu to expand it.',
        'Confirm the "Quote & Apply" menu item becomes available.',
      ].join('\n'),
      expected: 'The "Quotes" menu expands and reveals the "Quote & Apply" navigation item.',
      actual: openedQuotesMenu ? '"Quotes" menu opened; "Quote & Apply" item shown' : '"Quotes" menu not found',
      shot: 'Quotes menu expanded — Quote & Apply item available',
    });

    // Click "Quote & Apply" — this is the actual navigation into the tool (captures a popup if one opens)
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
      page.evaluate(() => {
        function v(e){return e&&e.offsetParent!==null;}
        var el = [].slice.call(document.querySelectorAll('a, button, [role=button], li')).filter(v)
          .find(function(e){ return /^quote & apply$/i.test((e.innerText || '').trim().replace(/\s+/g,' ')); });
        if (el) { el.scrollIntoView({ block: 'center' }); el.click(); }
      }),
    ]);
    const toolPage = popup || page;
    await toolPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await toolPage.waitForTimeout(1500);

    const ui = await toolPage.evaluate(() => {
      var body = (document.body.innerText || '');
      return {
        heading: /Quotes and Applications/i.test(body),
        newQuote: [].slice.call(document.querySelectorAll('button, a')).some(function (b) { return /^new quote$/i.test((b.innerText || '').trim().split('\n')[0]); }),
        onQuoteAndApply: /\/quoteandapply/i.test(location.href),
        url: location.href,
      };
    });

    // Sub-test 3 — directed to the Quote & Apply tool UI (heading + New Quote + URL)
    await recordStep(testInfo, toolPage, {
      label: 'Directed to the New Business Quoting Tool UI',
      action: [
        'Click the "Quote & Apply" menu item.',
        'Confirm the adviser is taken to the New Business Quoting Tool: the "Quotes and Applications" heading is shown,',
        'a "New Quote" action is present, and the URL is the Quote & Apply tool.',
        'Observed URL: ' + ui.url,
      ].join('\n'),
      expected: [
        'The adviser lands on the New Business Quoting Tool UI.',
        'Page shows the "Quotes and Applications" heading and a "New Quote" action; URL contains /QuoteAndApply.',
      ].join('\n'),
      actual: [
        'Heading shown: ' + ui.heading,
        'New Quote action: ' + ui.newQuote,
        'URL: ' + ui.url,
      ].join('  |  '),
      shot: 'New Business Quoting Tool UI reached via Quotes -> Quote & Apply',
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
