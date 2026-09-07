// Save Quote / Save As New — acceptance-criteria mode (Jira ACB-2241).
// Source: docs/user-stories/User Story- Save Quote-Save As New.md
//
// Exhaustive standard: positive + negative/absence + value-level via recordCheck.
// Probe (2026-09-08): the quote screen exposes 'Save' and 'Save as New' actions. Clicking 'Save'
// opens a reference popup with field id 'Input_Reference' ("Add Reference (Optional)", maxLength=30)
// and Save + Cancel buttons. The landing "Quotes and Applications" list is lazy/flaky (populates only
// after 'Refresh content', empty on some accounts within the wait) and opening a saved row back into
// a quote was not reliably cracked, and the post-save URL QuoteId stayed empty — so the ACs that
// require reopening the saved quote to re-read values (the "see newly created quote in the home page"
// / "redirected to landing" clauses) are deferred with that evidence. The popup structure, the 30-char
// limit, the Cancel behaviour, the Save-as-New popup, the close-confirm popup and the min-details save
// gate (AC12) are all reachable and asserted here.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput,
  getVisibleErrors, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
// Click a quote-screen action button by its exact first-line label.
async function clickAction(page, label) {
  await page.evaluate((lbl) => {
    var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && (x.innerText || '').trim().split('\n')[0] === lbl; })[0];
    if (b) b.click();
  }, label);
}
// Read the reference popup structure (Input_Reference + Save/Cancel buttons).
function readRefPopup(page) {
  return page.evaluate(() => {
    var ri = document.getElementById('Input_Reference') || [].slice.call(document.querySelectorAll('input[id*="Input_Reference"]'))[0];
    var vis = function (e) { return e && e.offsetParent !== null; };
    var btns = [].slice.call(document.querySelectorAll('button, a')).filter(function (b) { return vis(b); }).map(function (b) { return (b.innerText || '').trim().split('\n')[0]; }).filter(function (t) { return /^(save|cancel)$/i.test(t); });
    return {
      hasRef: !!(ri && vis(ri)),
      refLabel: ri ? ((function () { var n = ri, t = ''; for (var d = 0; d < 4 && n; d++) { var s = n.previousElementSibling; while (s) { t = (s.innerText || '').trim(); if (t) return t.split('\n')[0]; s = s.previousElementSibling; } n = n.parentElement; } return ''; })()) : null,
      maxLength: ri ? ri.maxLength : null,
      hasSave: btns.indexOf('Save') >= 0 || btns.indexOf('save') >= 0,
      hasCancel: btns.some(function (t) { return /cancel/i.test(t); }),
    };
  });
}
async function freshValidQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '500000');
  await waitForSettle(quote, 1200);
  return quote;
}

test.describe('Save Quote / Save As New (ACB-2241)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01: quote screen exposes both Save and Save as New actions', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: When I have captured the required information for a quote, Then I should be able to "save" OR "save as new" the new business quote/application.',
      '', 'Steps to reproduce:', '1. New quote with valid ANB/Gender/Occupation + Life $500k. 2. Read the available actions.',
      '', 'Expected: both "Save" and "Save as New" actions are present.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    const actions = await quote.evaluate(() => [].slice.call(document.querySelectorAll('button, a')).map(function (e) { return (e.innerText || '').trim().split('\n')[0]; }));
    const hasSave = actions.includes('Save');
    const hasSaveAsNew = actions.includes('Save as New');
    recordCheck(testInfo, { label: '"Save" action present', expected: true, actual: hasSave });
    recordCheck(testInfo, { label: '"Save as New" action present', expected: true, actual: hasSaveAsNew });
    expect(hasSave, 'AC01: Save present').toBe(true);
    expect(hasSaveAsNew, 'AC01: Save as New present').toBe(true);
  });

  test('AC02: Save opens a reference popup (30-char Add Reference (Optional)) with Save + Cancel', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: Given I selected "save", Then the reference popup should appear to enter Add Reference (30 character limit) with Cancel and Save buttons.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click Save. 3. Read the popup: reference field, its maxLength, and the buttons.',
      '', 'Expected: reference field labelled "Add Reference (Optional)", maxLength 30, with Save and Cancel buttons.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save');
    await waitForSettle(quote, 2000);
    const p = await readRefPopup(quote);
    recordCheck(testInfo, { label: 'Reference field present', expected: true, actual: p.hasRef });
    recordCheck(testInfo, { label: 'Reference field label', expected: 'Add Reference (Optional)', actual: p.refLabel });
    recordCheck(testInfo, { label: 'Reference field max length', expected: 30, actual: p.maxLength });
    recordCheck(testInfo, { label: 'Popup has Save button', expected: true, actual: p.hasSave });
    recordCheck(testInfo, { label: 'Popup has Cancel button', expected: true, actual: p.hasCancel });
    expect(p.hasRef, 'AC02: reference field').toBe(true);
    expect(p.refLabel, 'AC02: reference label').toMatch(/Add Reference \(Optional\)/i);
    expect(p.maxLength, 'AC02: 30-char limit').toBe(30);
    expect(p.hasSave, 'AC02: Save button').toBe(true);
    expect(p.hasCancel, 'AC02: Cancel button').toBe(true);
  });

  test('AC04: Cancel on the reference popup closes it and returns to the quote screen', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given AC02, When I select "cancel", Then the reference pop-up should close And I should be redirected to the quote screen.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click Save. 3. Click Cancel in the popup. 4. Confirm the popup is gone and the quote form is still shown.',
      '', 'Expected: reference field no longer present; quote form (Age Next Birthday input) still present.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save');
    await waitForSettle(quote, 1500);
    expect((await readRefPopup(quote)).hasRef, 'AC04 precondition: popup open').toBe(true);
    await quote.evaluate(() => { var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && /^cancel$/i.test((x.innerText || '').trim().split('\n')[0]); })[0]; if (b) b.click(); });
    await waitForSettle(quote, 1500);
    const stillPopup = (await readRefPopup(quote)).hasRef;
    const onQuote = await quote.evaluate(() => !!document.querySelector('input[id*="Input_AgeNextBirthday"]'));
    recordCheck(testInfo, { label: 'Reference popup closed after Cancel', expected: false, actual: stillPopup });
    recordCheck(testInfo, { label: 'Still on the quote screen after Cancel', expected: true, actual: onQuote });
    expect(stillPopup, 'AC04: popup closed').toBe(false);
    expect(onQuote, 'AC04: back on quote screen').toBe(true);
  });

  test('AC05: Save as New opens a reference popup (30-char) with Save + Cancel', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: When I click "save as new", Then the reference popup should appear to enter Add Reference (30 character limit) with Cancel and Save buttons.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click "Save as New". 3. Read the popup.',
      '', 'Expected: reference field (maxLength 30) + Save and Cancel buttons (same popup as AC02).',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Save as New');
    await waitForSettle(quote, 2000);
    const p = await readRefPopup(quote);
    recordCheck(testInfo, { label: 'Save-as-New reference field present', expected: true, actual: p.hasRef });
    recordCheck(testInfo, { label: 'Save-as-New reference max length', expected: 30, actual: p.maxLength });
    recordCheck(testInfo, { label: 'Save-as-New popup has Save + Cancel', expected: 'Save & Cancel', actual: `${p.hasSave ? 'Save' : ''} ${p.hasCancel ? 'Cancel' : ''}`.trim() });
    expect(p.hasRef, 'AC05: reference field').toBe(true);
    expect(p.maxLength, 'AC05: 30-char limit').toBe(30);
    expect(p.hasSave && p.hasCancel, 'AC05: Save + Cancel').toBe(true);
  });

  test('AC09: Close on a quote with entered data prompts a save-confirm popup (Cancel / Save / Don\'t Save)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given I have entered any data in the quote screen, When I click Close, Then a popup should appear "Would you like to save the quote before exiting?" with "Cancel", "Save" and "Don\'t Save" buttons.',
      '', 'Steps to reproduce:', '1. Valid quote (data entered). 2. Click Close. 3. Read the confirm popup text + buttons.',
      '', 'Expected: message "Would you like to save the quote before exiting?" with Cancel, Save, Don\'t Save.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Close');
    await waitForSettle(quote, 2000);
    const confirm = await quote.evaluate(() => {
      var body = (document.body.innerText || '');
      var msg = /Would you like to save the quote before exiting\?/i.test(body);
      var btns = [].slice.call(document.querySelectorAll('button, a')).filter(function (b) { return b.offsetParent !== null; }).map(function (b) { return (b.innerText || '').trim().split('\n')[0]; });
      return {
        msg: msg,
        hasCancel: btns.some(function (t) { return /^cancel$/i.test(t); }),
        hasSave: btns.some(function (t) { return /^save$/i.test(t); }),
        hasDontSave: btns.some(function (t) { return /don'?t\s*save/i.test(t); }),
      };
    });
    recordCheck(testInfo, { label: 'Close-confirm message shown', expected: 'Would you like to save the quote before exiting?', actual: confirm.msg ? 'shown' : 'absent' });
    recordCheck(testInfo, { label: 'Confirm popup buttons', expected: 'Cancel / Save / Don\'t Save', actual: `${confirm.hasCancel ? 'Cancel ' : ''}${confirm.hasSave ? 'Save ' : ''}${confirm.hasDontSave ? "Don't Save" : ''}`.trim() });
    expect(confirm.msg, 'AC09: confirm message').toBe(true);
    expect(confirm.hasCancel && confirm.hasSave && confirm.hasDontSave, 'AC09: three buttons').toBe(true);
  });

  test('AC10: Cancel on the close-confirm popup returns to the quote screen', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: Given AC09, When I select "cancel", Then I should be redirected to the quote screen.',
      '', 'Steps to reproduce:', '1. Valid quote. 2. Click Close. 3. Click Cancel on the confirm popup. 4. Confirm still on the quote screen.',
      '', 'Expected: quote form still present after Cancel.',
    ].join('\n') });
    const quote = await freshValidQuote(page);
    await clickAction(quote, 'Close');
    await waitForSettle(quote, 1800);
    await quote.evaluate(() => { var b = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && /^cancel$/i.test((x.innerText || '').trim().split('\n')[0]); })[0]; if (b) b.click(); });
    await waitForSettle(quote, 1800);
    const onQuote = await quote.evaluate(() => !!document.querySelector('input[id*="Input_AgeNextBirthday"]'));
    recordCheck(testInfo, { label: 'Still on quote screen after Cancel on close-confirm', expected: true, actual: onQuote });
    expect(onQuote, 'AC10: back on quote screen').toBe(true);
  });

  test('AC12: Close → Save with missing minimum details shows "Enter minimum details to save quote"', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given AC09, When I select "Save", Then if minimum details (ANB, Gender and Smoker) are not entered display an error message "Enter minimum details to save quote".',
      '', 'Steps to reproduce:', '1. New quote, DO NOT enter ANB/Gender/Smoker. 2. Enter a first name then Close. 3. On the confirm popup click Save. 4. Read the error.',
      '', 'Expected: "Enter minimum details to save quote".',
      'Actual (QA, confirmed 2026-09-08): no such message appears — the app instead shows inline "Required field!"',
      'markers on the empty ANB/Gender fields and does not display the specified "Enter minimum details to save',
      'quote" message. This assertion is written to the STORY\'s expected message and is EXPECTED TO FAIL until',
      'the app surfaces that message.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    // Enter a first name only (some data) but leave the minimum pricing details (ANB/Gender/Smoker) blank.
    await quote.evaluate(() => { var fn = document.querySelector('input[id*="Input_FirstName"]'); if (fn) { fn.focus(); fn.value = 'Probe'; fn.dispatchEvent(new Event('input', { bubbles: true })); fn.dispatchEvent(new Event('change', { bubbles: true })); fn.blur(); } });
    await waitForSettle(quote, 800);
    await clickAction(quote, 'Close');
    await waitForSettle(quote, 1800);
    // Click the confirm popup's Save (the LAST visible "Save" — the popup's, not the quote-screen action behind it).
    await quote.evaluate(() => { var saves = [].slice.call(document.querySelectorAll('button, a')).filter(function (x) { return x.offsetParent !== null && /^save$/i.test((x.innerText || '').trim().split('\n')[0]); }); if (saves.length) saves[saves.length - 1].click(); });
    await waitForSettle(quote, 2500);
    const e = await errText(quote);
    const bodyHasMsg = await quote.evaluate(() => /Enter minimum details to save quote/i.test(document.body.innerText || ''));
    recordCheck(testInfo, { label: 'Min-details save gate message (story: "Enter minimum details to save quote")', expected: 'Enter minimum details to save quote', actual: (bodyHasMsg ? 'shown' : 'NOT shown — app shows inline "Required field!" instead') + (e ? ` | errors: ${e.slice(0, 120)}` : '') });
    expect(bodyHasMsg || /Enter minimum details to save quote/i.test(e), `AC12. Got: ${(e || 'no message').slice(0, 200)}`).toBe(true);
  });

  // ── Deferred ACs (documented, with probe evidence) ──
  test('AC03/AC06/AC08/AC11/AC13: persisted quote number/status + appears in home page + redirect-to-landing', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC03/AC06: after Save/Save-as-New a quote number is created, status "Quote", it appears in the Quotes & Applications home page, cursor stays, and the Save button disables until further changes. AC08: re-save an opened saved quote keeps the same name + updates the home page. AC11/AC13: Don\'t Save / Save from the close-confirm redirect to the landing page (with the quote shown for AC13).'].join('\n') });
    test.fixme(true, 'Deferred (not reliably reachable): probe 2026-09-08 found (a) after clicking the reference-popup Save the URL QuoteId stayed EMPTY on 2 accounts, so a created quote number / "same quote" identity is not confirmable from the browser URL; (b) the Quotes & Applications landing list is lazy/flaky — it populates only after clicking "Refresh content" and was empty within the wait on 2 of 3 accounts, and opening a saved row back into a quote was not reliably cracked (the row <A> anchor click returned to the landing page with a null QuoteId). So the clauses that require reading the persisted quote number, its home-page row, the same-name re-save (AC08), the Save-button disabled-until-changed state after a confirmed save, and the redirect-to-landing (AC11/AC13) cannot be asserted deterministically yet. Reachable once the list row-open is cracked (needs the widget row action + a reliable list-populate wait) and a post-save QuoteId signal is found. Reference-popup structure (AC02/AC05), Cancel (AC04/AC10), close-confirm popup (AC09) and the min-details gate (AC12) ARE covered above.');
  });
});
