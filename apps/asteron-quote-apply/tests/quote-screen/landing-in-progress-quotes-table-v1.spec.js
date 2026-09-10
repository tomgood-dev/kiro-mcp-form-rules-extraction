// Landing Page: In Progress Quotes Table — acceptance-criteria mode (Jira ACB-3570).
// Source: docs/user-stories/User Story- Landing Page- In Progress Quotes Table.md
//
// Exhaustive standard: positive + negative/absence + value-level via recordCheck.
// Probe (2026-09-08): the landing page renders the In Progress Quotes table STRUCTURE — a unified
// search box (id 'Input_SearchKeyword', placeholder "Search Quotes And Applications"), a status filter
// (select 'Dropdown1': Status/Expired/Application in progress - with Teleinterview/Quote/Pre application/
// Submitted/Application in progress), a "Show items" entries selector (select 'b11-Dropdown1':
// 10/20/50/100), a "New Quote" action, a "Refresh content" control (fa-refresh icon), and a table with
// header columns Adviser No. | Adviser | Client name | Last Modified | Status | Reference. However the
// table has ZERO DATA ROWS on the QA test accounts (DOM dump: only the header row, body ~315 chars) —
// there is no persisted quote data to display. So every ROW-DEPENDENT AC is deferred with that evidence
// (delete checkbox/confirm, status-routing row-open, multi-life expand/collapse, three-dots menu, row
// ordering, return-to-landing popup) — never silently omitted. The reachable STRUCTURE ACs are asserted.
const { test, expect } = require('@playwright/test');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

async function gotoLanding(page) {
  await page.goto('/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
}
function readLanding(page) {
  return page.evaluate(() => {
    function vis(e){return e && e.offsetParent!==null;}
    var search = document.getElementById('Input_SearchKeyword');
    var status = document.getElementById('Dropdown1');
    var entries = [].slice.call(document.querySelectorAll('select')).filter(function(s){var o=[].slice.call(s.options).map(function(o){return o.text.trim();});return o.indexOf('10')>=0&&o.indexOf('100')>=0;})[0];
    var tableHeader = [].slice.call(document.querySelectorAll('table tr, thead tr')).map(function(r){return (r.innerText||'').replace(/\s+/g,' ').trim();})[0] || '';
    return {
      hasSearch: vis(search), searchPh: search ? search.placeholder : null,
      hasStatusFilter: vis(status), statusOpts: status ? [].slice.call(status.options).map(function(o){return o.text.trim();}) : [],
      hasEntries: !!entries, entriesOpts: entries ? [].slice.call(entries.options).map(function(o){return o.text.trim();}) : [],
      hasNewQuote: [].slice.call(document.querySelectorAll('button, a')).some(function(b){return /^new quote$/i.test((b.innerText||'').trim().split('\n')[0]);}),
      hasRefresh: [].slice.call(document.querySelectorAll('[class*="fa-refresh"], button, a')).some(function(e){return /fa-refresh/.test((e.className||'')+'') || /refresh content/i.test((e.innerText||''));}),
      tableHeader: tableHeader,
      hasAgencySelect: [].slice.call(document.querySelectorAll('select')).some(function(s){var l=(s.previousElementSibling&&s.previousElementSibling.innerText||'')+''; return /agency/i.test(l) || [].slice.call(s.options).some(function(o){return /agency/i.test(o.text);});}),
    };
  });
}

test.describe('Landing Page: In Progress Quotes Table (ACB-3570)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01: In Progress Quotes UI — search box, status filter, New Quote, entries selector (10/20/50/100), table columns', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: I should be presented with an In Progress Quotes table where I can search (customer name / last modified / status / adviser / reference), search & view an existing quote, create a new quote, select number of entries (10/20/50/100), and download submitted pdfs.',
      '', 'Steps to reproduce:', '1. Land on /QuoteAndApply/. 2. Confirm the search box, status filter, New Quote action, entries selector (10/20/50/100), and table header columns.',
      '', 'Expected: unified search ("Search Quotes And Applications"), status filter, New Quote, Show items 10/20/50/100, columns Adviser No./Adviser/Client name/Last Modified/Status/Reference.',
    ].join('\n') });
    await gotoLanding(page);
    const l = await readLanding(page);
    await recordStep(testInfo, page, { label: 'Search box present', expected: true, actual: l.hasSearch });
    await recordStep(testInfo, page, { label: 'Search box placeholder', expected: 'Search Quotes And Applications', actual: l.searchPh });
    await recordStep(testInfo, page, { label: 'Status filter present', expected: true, actual: l.hasStatusFilter });
    await recordStep(testInfo, page, { label: 'New Quote action present', expected: true, actual: l.hasNewQuote });
    await recordStep(testInfo, page, { label: 'Entries selector options', expected: '10/20/50/100', actual: (l.entriesOpts || []).join('/') });
    await recordStep(testInfo, page, { label: 'Table header columns', expected: 'Adviser No. / Adviser / Client name / Last Modified / Status / Reference', actual: l.tableHeader });
    expect(l.hasSearch, 'AC01: search box').toBe(true);
    expect(l.searchPh, 'AC01: search placeholder').toMatch(/Search Quotes And Applications/i);
    expect(l.hasStatusFilter, 'AC01: status filter').toBe(true);
    expect(l.hasNewQuote, 'AC01: New Quote').toBe(true);
    expect(l.entriesOpts, 'AC01: entries 10/20/50/100').toEqual(['10', '20', '50', '100']);
    expect(l.tableHeader, 'AC01: table columns').toMatch(/Adviser No\..*Adviser.*Client name.*Last Modified.*Status.*Reference/i);
  });

  test('AC01/AC02 (statuses): the status filter offers all documented quote/application statuses', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: I should be able to view quotes that are "quotes" and applications that are "pre application", "submitted", "application in progress with TIV", "application in progress", and expired records. (Reachable part: the status filter exposes each of these statuses.)',
      '', 'Steps to reproduce:', '1. Land on /QuoteAndApply/. 2. Read the status filter options.',
      '', 'Expected: filter includes Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired.',
    ].join('\n') });
    await gotoLanding(page);
    const l = await readLanding(page);
    const opts = l.statusOpts.join(' | ');
    await recordStep(testInfo, page, { label: 'Status filter options', expected: 'Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired', actual: opts });
    for (const s of ['Quote', 'Pre application', 'Submitted', 'Application in progress', 'Application in progress - with Teleinterview', 'Expired']) {
      expect(l.statusOpts.some((o) => o.toLowerCase() === s.toLowerCase()), `AC02: status "${s}" available`).toBe(true);
    }
  });

  test('AC04: a "Refresh content" control is present to reload the table', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: When I click refresh content, Then I should see the latest table with all quotes (most recently modified at the top). (Reachable part: the Refresh content control is present and clickable.)',
      '', 'Steps to reproduce:', '1. Land on /QuoteAndApply/. 2. Confirm a Refresh content control (fa-refresh) exists.',
      '', 'Expected: a Refresh content control is present.',
    ].join('\n') });
    await gotoLanding(page);
    const l = await readLanding(page);
    await recordStep(testInfo, page, { label: 'Refresh content control present', expected: true, actual: l.hasRefresh });
    expect(l.hasRefresh, 'AC04: Refresh content control').toBe(true);
  });

  test('AC09: the entries-per-page selector offers 10/20/50/100 and is settable', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: When I select number of entries to display, Then I see that number of entries And can navigate the remaining pages. (Reachable part: the Show-items selector offers 10/20/50/100 and accepts a selection; the multi-page navigation across real data is deferred — see deferrals — as the table has no rows on the test accounts.)',
      '', 'Steps to reproduce:', '1. Land on /QuoteAndApply/. 2. Read + set the Show-items selector to 100.',
      '', 'Expected: options 10/20/50/100; selecting 100 is accepted.',
    ].join('\n') });
    await gotoLanding(page);
    const l = await readLanding(page);
    await recordStep(testInfo, page, { label: 'Entries selector options', expected: '10/20/50/100', actual: (l.entriesOpts || []).join('/') });
    expect(l.entriesOpts, 'AC09: entries options').toEqual(['10', '20', '50', '100']);
    const set = await page.evaluate(() => {
      var s = [].slice.call(document.querySelectorAll('select')).filter(function (x) { var o = [].slice.call(x.options).map(function (o) { return o.text.trim(); }); return o.indexOf('100') >= 0 && o.indexOf('10') >= 0; })[0];
      if (!s) return null; var opt = [].slice.call(s.options).filter(function (o) { return o.text.trim() === '100'; })[0]; s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true }));
      return s.options[s.selectedIndex].text.trim();
    });
    await recordStep(testInfo, page, { label: 'Entries selector accepts 100', expected: '100', actual: set });
    expect(set, 'AC09: set to 100').toBe('100');
  });

  // ── Deferred ACs (documented, with probe evidence) ──
  test('AC03: select agency then click create quote', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC03: on the landing page I should be able to select my agency (one adviser can be associated with multiple agencies) and click create quote.'].join('\n') });
    test.fixme(true, 'Deferred (control not present for this account): probe 2026-09-08 found only the status filter and the "Show items" selector on the landing page — no agency <select> was present. This test account appears tied to a single agency, so the multi-agency selection UI does not render. Reachable only on a multi-agency account. (The "create quote" half is covered by the New Quote action in AC01.)');
  });
  test('AC02/AC10/AC11/AC12/AC13: row ordering + open a row by status (Quote→quote page, Pre-App→client summary, App-in-progress[/TIV]→Duty of Disclosure)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC02: rows show most-recent-first with each status; AC10-13: clicking a row opens it by status — "Quote"→Quote page prepopulated, "Pre Application"→client summary, "Application In Progress" / "…with Teleinterview"→Duty of Disclosure.'].join('\n') });
    test.fixme(true, 'Deferred (no data rows): probe 2026-09-08 DOM dump found the In Progress table has ZERO data rows on the QA test accounts (only the header row; body ~315 chars) — clicking the fa-refresh anchor, setting 100 entries, and polling 45s did not populate any rows. Row ordering (AC02) and status-dependent row-open routing (AC10-13) cannot be exercised without persisted quote/application rows in each status. Reachable once the test accounts have seeded quotes/applications across the statuses.');
  });
  test('AC05/AC06/AC07/AC08: delete "Quote"-status rows via checkbox + confirm popup ("Are you sure you want to delete X lives?")', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC05: tick checkbox for "Quote"-status rows to delete; AC06: clicking delete shows "Are you sure you want to delete X lives? Deleted lives cannot be recovered" (X dynamic by lives) with Cancel/Delete; AC07: Delete removes the row + refreshes; AC08: Cancel returns with the checkbox ticked.'].join('\n') });
    test.fixme(true, 'Deferred (no data rows): the delete checkbox + confirm popup require at least one "Quote"-status data row. Probe 2026-09-08 confirmed the table is empty on the QA test accounts (only a header checkbox present, no per-row checkboxes; zero data rows). The dynamic "X lives" count in the confirm message also needs real multi-life rows. Reachable once seeded "Quote"-status rows exist.');
  });
  test('AC14/AC15/AC16: multi-life records expand/collapse (highest-progressed status; per-life records; per-life delete/reference)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC14-16: a multi-life record can be expanded to show individual per-life records (each with its own status, a delete checkbox only if "Quote", and an add/update reference), and collapsed to show the main record with the highest-progressed status and all life names, searchable by any life name, with no Reference on the collapsed main record.'].join('\n') });
    test.fixme(true, 'Deferred (no data rows): requires a persisted MULTI-LIFE quote/application row to expand/collapse. Probe 2026-09-08 confirmed the table is empty on the QA test accounts. Reachable once a seeded multi-life record exists.');
  });
  test('AC17: three-dots menu options by status (Quote: Edit/Delete; Submitted: Download Application/Client Application/Confirmation/Declaration/Quote + Clone Quote; other: Edit)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC17: the per-row three-dots menu shows Edit/Delete for "Quote"; Download Application/Client Application/Confirmation/Declaration/Quote + Clone Quote for "Submitted"; Edit for other statuses.'].join('\n') });
    test.fixme(true, 'Deferred (no data rows): the three-dots menu is a per-row control; probe 2026-09-08 confirmed zero data rows on the QA test accounts (and zero Submitted rows), so the status-specific menu options cannot be read. Reachable once seeded rows exist in the "Quote" and "Submitted" statuses.');
  });
  test('AC18/AC19: return-to-landing popup (Proceed / Cancel) when opening further quotes from an active quote', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC18: when working on a quote and returning to the landing page to open/create another quote, a popup is shown; AC19: Proceed navigates to the new/saved quote, Cancel keeps the user in the current quote.'].join('\n') });
    test.fixme(true, 'Deferred (needs an active-quote + reliable saved-row context): AC18/19 trigger when navigating from an in-progress quote back to the landing and opening another — which depends on the not-reliably-cracked saved-row open and a persisted quote to return to (probe 2026-09-08: post-save QuoteId empty + empty landing list). Reachable once the saved-quote open + a reliable active-quote-return context are established.');
  });
});
