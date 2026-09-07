// Landing page: Inflight Quotes — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Landing page- Inflight Quotes.md
//
// Exhaustive standard: positive + value-level via recordCheck.
// Probe (2026-09-08): the landing page is reachable (AC01) and the status filter exposes every status
// an inflight quote can have (AC02, reachable part). AC03/AC04 concern the 45-day expiry behaviour
// (Application-in-progress/Pre-Application expiring after 45 days; a Quote >45 days old not expiring but
// showing a rate-change validation on re-entry) — both are TIME-DEPENDENT and require aged records (a
// 45-day-old last-modified date), which cannot be manufactured on demand. Deferred with that evidence.
const { test, expect } = require('@playwright/test');
const { recordCheck } = require('../../../../tools/artifact-helpers');

async function gotoLanding(page) {
  await page.goto('/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
}

test.describe('Landing page: Inflight Quotes', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01: clicking quote & apply lands on the New Business Quoting Tool UI', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I have logged onto the adviser portal, When I click the quote and apply link, Then I am directed to the New Business Quoting tool UI.',
      '', 'Steps to reproduce:', '1. (Logged in) Navigate to /QuoteAndApply/. 2. Confirm the quoting tool UI is shown.',
      '', 'Expected: "Quotes and Applications" landing UI with a New Quote action.',
    ].join('\n') });
    await gotoLanding(page);
    const ui = await page.evaluate(() => ({
      heading: /Quotes and Applications/i.test(document.body.innerText || ''),
      newQuote: [].slice.call(document.querySelectorAll('button, a')).some(function (b) { return /^new quote$/i.test((b.innerText || '').trim().split('\n')[0]); }),
    }));
    recordCheck(testInfo, { label: 'On the quoting tool UI (Quotes and Applications)', expected: true, actual: ui.heading });
    recordCheck(testInfo, { label: 'New Quote action available', expected: true, actual: ui.newQuote });
    expect(ui.heading && ui.newQuote, 'AC01: quoting tool UI').toBe(true);
  });

  test('AC02: inflight quotes with all statuses can be viewed (the status filter exposes every status)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: When I am on the landing page, Then I should be able to see inflight quotes with all the statuses from day 1. (Reachable part: the status filter exposes each inflight status the table can show.)',
      '', 'Steps to reproduce:', '1. Land on /QuoteAndApply/. 2. Read the status filter options.',
      '', 'Expected: filter includes Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired.',
    ].join('\n') });
    await gotoLanding(page);
    const opts = await page.evaluate(() => { var s = document.getElementById('Dropdown1'); return s ? [].slice.call(s.options).map(function (o) { return o.text.trim(); }) : []; });
    recordCheck(testInfo, { label: 'Inflight statuses available in filter', expected: 'Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired', actual: opts.join(' | ') });
    for (const s of ['Quote', 'Pre application', 'Submitted', 'Application in progress', 'Application in progress - with Teleinterview', 'Expired']) {
      expect(opts.some((o) => o.toLowerCase() === s.toLowerCase()), `AC02: status "${s}" available`).toBe(true);
    }
  });

  // ── Deferred ACs (documented, with evidence) ──
  test('AC03/AC04: 45-day expiry (Application-in-progress/Pre-App expire; Quote >45 days shows rate-change validation)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC03: an Application in Progress / …with TIV / Pre Application more than 45 days from last-modified expires (status "Expired"). AC04: a "Quote" more than 45 days old does not expire, but if premium rates/cover types have changed a validation message pops up on re-entry.'].join('\n') });
    test.fixme(true, 'Deferred (time-dependent, not manufacturable): AC03/AC04 depend on records whose last-modified date is more than 45 days in the past (to trigger expiry / the stale-rate validation). This elapsed-time state cannot be created on demand from the browser, and the QA test accounts have no such aged records (the In Progress table is empty — probe 2026-09-08). Reachable only with seeded records backdated >45 days, or a backend clock/date fixture.');
  });
});
