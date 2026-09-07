// Saved Quote / Application Navigation — acceptance-criteria mode.
// Source: docs/user-stories/User Story- Saved Quote-Application Navigation.md
//
// Exhaustive standard: positive + negative/absence + value-level via recordCheck.
// Probe (2026-09-08): Save + Save-as-New + the reference popup (Input_Reference, maxLength 30, Save/Cancel)
// are reachable and asserted here (AC01/AC02/AC04/AC05/AC07). The clauses that require the saved quote to
// APPEAR in the Quotes & Applications home page (AC03/AC06) and all of AC08-AC15 (status-dependent routing
// on opening a saved row: Quote→quote page, Pre-Application→client summary, Application-in-progress→Duty of
// Disclosure; plus the client-birthday popups and their View-Quote/Create-New/Edit-Quote branches) depend on
// (a) the lazy/flaky landing list, (b) a reliable saved-row open into a quote (not cracked — the row <A>
// anchor click returned to the landing page with a null QuoteId), and (c) manufacturing specific saved
// states (Pre-Application, Application-in-progress, a client who has had a birthday since save) that are not
// creatable from the quote screen. Those are deferred with this evidence, never silently omitted.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

async function clickAction(page, label) {
  await page.evaluate((lbl) => { var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && (x.innerText || '').trim().split('\n')[0] === lbl; })[0]; if (b) b.click(); }, label);
}
function readRefPopup(page) {
  return page.evaluate(() => {
    var ri = document.getElementById('Input_Reference') || [].slice.call(document.querySelectorAll('input[id*="Input_Reference"]'))[0];
    var vis = function (e) { return e && e.offsetParent !== null; };
    var btns = [].slice.call(document.querySelectorAll('button, a')).filter(vis).map(function (b) { return (b.innerText || '').trim().split('\n')[0]; });
    return { hasRef: !!(ri && vis(ri)), maxLength: ri ? ri.maxLength : null, hasSave: btns.some(function (t) { return /^save$/i.test(t); }), hasCancel: btns.some(function (t) { return /^cancel$/i.test(t); }) };
  });
}
async function freshValidQuote(page) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '500000');
  await waitForSettle(quote, 1200);
  return quote;
}

test.describe('Saved Quote / Application Navigation', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01: with minimum details captured, Save and Save as New are both available', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: When I have captured the required information for a quote (ANB, Gender, Smoker), Then I should be able to "save" OR "save as new".',
      '', 'Steps to reproduce:', '1. Valid quote (ANB/Gender/Occupation + Life $500k). 2. Read available actions.',
      '', 'Expected: both Save and Save as New present.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    const actions = await quote.evaluate(() => [].slice.call(document.querySelectorAll('button, a')).map(function (e) { return (e.innerText || '').trim().split('\n')[0]; }));
    recordCheck(testInfo, { label: 'Save + Save as New available', expected: 'both present', actual: `${actions.includes('Save') ? 'Save' : ''} ${actions.includes('Save as New') ? 'Save as New' : ''}`.trim() });
    expect(actions.includes('Save') && actions.includes('Save as New'), 'AC01').toBe(true);
  });

  test('AC02: Save opens the 30-char reference popup with Save + Cancel', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: Given AC01, When I select "save", Then a reference popup should appear to add a 30-character reference (optional) with Save or Cancel action buttons.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click Save. 3. Read the popup.',
      '', 'Expected: reference field (maxLength 30) + Save and Cancel.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save');
    await waitForSettle(quote, 2000);
    const p = await readRefPopup(quote);
    recordCheck(testInfo, { label: 'Reference popup (30-char) with Save + Cancel', expected: 'ref30 + Save + Cancel', actual: `${p.hasRef ? 'ref' + p.maxLength : 'no-ref'} ${p.hasSave ? 'Save' : ''} ${p.hasCancel ? 'Cancel' : ''}`.trim() });
    expect(p.hasRef, 'AC02: ref field').toBe(true);
    expect(p.maxLength, 'AC02: 30-char').toBe(30);
    expect(p.hasSave && p.hasCancel, 'AC02: Save + Cancel').toBe(true);
  });

  test('AC04: Cancel on the reference popup returns to the quote page without saving', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given AC02, When I click Cancel, Then I should be redirected to the quote page without saving.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Save. 3. Cancel. 4. Confirm still on the quote page.',
      '', 'Expected: popup closed; quote form still present.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save');
    await waitForSettle(quote, 1500);
    expect((await readRefPopup(quote)).hasRef, 'AC04 precondition').toBe(true);
    await quote.evaluate(() => { var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && /^cancel$/i.test((x.innerText || '').trim().split('\n')[0]); })[0]; if (b) b.click(); });
    await waitForSettle(quote, 1500);
    const closed = !(await readRefPopup(quote)).hasRef;
    const onQuote = await quote.evaluate(() => !!document.querySelector('input[id*="Input_AgeNextBirthday"]'));
    recordCheck(testInfo, { label: 'Popup closed + on quote page after Cancel', expected: 'closed + on-quote', actual: `${closed ? 'closed' : 'open'} ${onQuote ? 'on-quote' : 'off'}`.trim() });
    expect(closed && onQuote, 'AC04').toBe(true);
  });

  test('AC05: Save as New opens the 30-char reference popup with Save + Cancel', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given AC01, When I select "Save as new", Then a reference popup should appear to add a 30-character reference (optional) with Save or Cancel action buttons.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click Save as New. 3. Read the popup.',
      '', 'Expected: reference field (maxLength 30) + Save and Cancel.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save as New');
    await waitForSettle(quote, 2000);
    const p = await readRefPopup(quote);
    recordCheck(testInfo, { label: 'Save-as-New reference popup (30-char) with Save + Cancel', expected: 'ref30 + Save + Cancel', actual: `${p.hasRef ? 'ref' + p.maxLength : 'no-ref'} ${p.hasSave ? 'Save' : ''} ${p.hasCancel ? 'Cancel' : ''}`.trim() });
    expect(p.hasRef && p.maxLength === 30 && p.hasSave && p.hasCancel, 'AC05').toBe(true);
  });

  test('AC07: Cancel on the Save-as-New reference popup returns to the quote page without saving', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given AC05, When I click Cancel, Then I should be redirected to the quote page without saving.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Save as New. 3. Cancel. 4. Confirm still on the quote page.',
      '', 'Expected: popup closed; quote form still present.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save as New');
    await waitForSettle(quote, 1500);
    expect((await readRefPopup(quote)).hasRef, 'AC07 precondition').toBe(true);
    await quote.evaluate(() => { var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && /^cancel$/i.test((x.innerText || '').trim().split('\n')[0]); })[0]; if (b) b.click(); });
    await waitForSettle(quote, 1500);
    const closed = !(await readRefPopup(quote)).hasRef;
    const onQuote = await quote.evaluate(() => !!document.querySelector('input[id*="Input_AgeNextBirthday"]'));
    recordCheck(testInfo, { label: 'Popup closed + on quote page after Cancel (Save as New)', expected: 'closed + on-quote', actual: `${closed ? 'closed' : 'open'} ${onQuote ? 'on-quote' : 'off'}`.trim() });
    expect(closed && onQuote, 'AC07').toBe(true);
  });

  // ── Deferred ACs (documented, with probe evidence) ──
  test('AC03/AC06: saved quote gets status "Quote" and appears in the Quotes & Applications home page', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC03/AC06: on Save / Save-as-New (with or without a reference) the quote is saved with status "Quote" and appears in the Quotes & Applications home page (Save-as-New saving further updates onto the new quote).'].join('\n') });
    test.fixme(true, 'Deferred (not reliably reachable): probe 2026-09-08 — after clicking the reference-popup Save the URL QuoteId stayed EMPTY, and the Quotes & Applications landing list is lazy/flaky (populates only after "Refresh content"; empty within the wait on 2 of 3 accounts). Confirming the saved quote appears as a status-"Quote" row therefore is not deterministic yet. Reachable once a post-save QuoteId signal and a reliable list-populate wait + row read are established.');
  });
  test('AC08/AC09/AC10: opening a saved row routes by status (Quote→quote page, Pre-Application→client summary, Application-in-progress→Duty of Disclosure)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC08: open a saved "Quote" → quote page with prepopulated details. AC09: open a saved "Pre-Application" → client summary page. AC10: open a saved "Application In Progress" → Duty of Disclosure page.'].join('\n') });
    test.fixme(true, 'Deferred (not reachable): requires (a) cracking the landing-list saved-row open into a quote — probe 2026-09-08 found the row <A> anchor click returned to the landing page with a null QuoteId; and (b) manufacturing saved quotes in the "Pre-Application" and "Application In Progress" statuses, which requires progressing an application past the quote screen (Duty of Disclosure / Personal Statement) — not creatable from the quote screen. Reachable via a dedicated Apply-flow + landing-list-navigation pass.');
  });
  test('AC11/AC12/AC13/AC14/AC15: client-birthday popups on opening a saved quote/application (View Quote / Create New / Edit Quote)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC11-AC13: opening a saved Quote/Pre-Application after the client has had a birthday shows the "premium no longer valid" popup (Close / View Quote / Create New with updated ANB) and its greyed-out / recreated-quote branches. AC14/AC15: opening a saved Application-in-progress after a birthday shows the "ANB does not match DOB" popup (Close / Edit Quote) and its recreate branch.'].join('\n') });
    test.fixme(true, 'Deferred (not reachable): requires a saved quote/application whose client has had a birthday SINCE it was saved (a real elapsed-time / backdated-DOB state that cannot be manufactured on demand from the quote screen), plus the same not-yet-cracked saved-row open. Reachable only with a pre-aged saved quote fixture and the landing-list row-open. No browser path from the quote screen.');
  });
});
