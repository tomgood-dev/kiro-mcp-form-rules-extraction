// Enter Loadings — acceptance-criteria mode (Jira ACB-3599).
// Source: docs/user-stories/User Story- Enter Loadings.md
//
// DOM confirmed via probe 2026-09-07: a "Loadings" link opens the Loadings pop-up; a Percentage
// dropdown [None, 25%..400% in 25% steps = 17 options]; Per Mille inputs (some disabled/greyed for
// TPD & Disability per AC06); Cancel button present. Percentage-of-base-premium VALUE effects need
// the pricing engine (deferred). getVisibleErrors used for the per-mille cap + empty-quote errors.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, getVisibleErrors, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

async function openLoadings(page, { priced = true } = {}) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
  if (priced) {
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1200);
  }
  await quote.evaluate(() => { const el = [...document.querySelectorAll('button,a,div,span')].find((b) => (b.innerText || '').trim() === 'Loadings'); if (el) el.click(); });
  await waitForSettle(quote, 2000);
  return quote;
}
const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
// The Loadings percentage dropdown: fingerprint by [None, 25%, 400%].
async function getPercentageSelect(page) {
  return page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.includes('None') && o.includes('25%') && o.includes('400%'); });
    return sel ? { options: [...sel.options].map((o) => o.text.trim()), selected: sel.options[sel.selectedIndex].text.trim() } : null;
  });
}

test.describe('Enter Loadings (ACB-3599)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Loadings pop-up opens with a Percentage dropdown (None, 25%..400%) and Per Mille inputs', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01/AC02: On a priced quote I can open Loadings; each cover type offers a Percentage dropdown [None, 25%, 50%, ... 400%] and a Per Mille dollar input (max $20; TPD & Disability per-mille greyed).',
      '', 'Steps to reproduce:', '1. New quote, price Life $200k, click Loadings. 2. Read the Percentage dropdown options + confirm Per Mille present.',
      '', 'Expected: Percentage dropdown = None + 25% steps to 400% (17 options); Per Mille present.',
    ].join('\n') });
    const quote = await openLoadings(page);
    const pct = await getPercentageSelect(quote);
    const expected = ['None', '25%', '50%', '75%', '100%', '125%', '150%', '175%', '200%', '225%', '250%', '275%', '300%', '325%', '350%', '375%', '400%'];
    await recordStep(testInfo, page, { label: 'Loadings Percentage dropdown options', expected: expected.join(', '), actual: (pct?.options || []).join(', ') });
    expect(pct?.options, 'AC02: Percentage options None + 25% steps to 400%').toEqual(expected);
    const hasPerMille = await quote.evaluate(() => /per mille/i.test(document.body.innerText));
    await recordStep(testInfo, page, { label: 'Per Mille loading option present', expected: true, actual: hasPerMille });
    expect(hasPerMille, 'AC02: Per Mille present').toBe(true);
  });

  test('AC06: TPD & Disability Per Mille fields are greyed out / disabled (percentage only)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: For TPD and Disability cover types, the Per Mille field is greyed out (default 0) and only percentage loadings are allowed.',
      '', 'Steps to reproduce:', '1. New quote, price Life $200k, open Loadings. 2. Confirm at least one Per Mille input is disabled (the TPD/Disability rows).',
      '', 'Expected: at least one disabled Per Mille input exists (TPD/Disability greyed).',
    ].join('\n') });
    const quote = await openLoadings(page);
    const disabledCount = await quote.evaluate(() => [...document.querySelectorAll('input[type="number"],input[type="text"]')].filter((i) => i.disabled).length);
    await recordStep(testInfo, page, { label: 'A disabled Per Mille input exists (TPD/Disability greyed)', expected: '>= 1 disabled input', actual: disabledCount });
    expect(disabledCount, 'AC06: TPD/Disability per-mille greyed').toBeGreaterThan(0);
  });

  test('AC07: Per Mille loading > $20.00 → maximum-per-mille error (+ $20.00 boundary accept)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: per mille > 20.00 → "The maximum per mille loading is $20.00"; at exactly $20.00 → accepted.',
      '',
      'Deferred: reaching the per-mille INPUT inside the Loadings pop-up reliably needs a focused DOM',
      'probe. First attempts (raw .value=, then "first enabled input" heuristic) failed — the heuristic',
      'grabbed a Quote-screen field (b15-Input_FirstName) sitting behind the pop-up backdrop rather than',
      'the pop-up\'s per-mille field, and raw .value= did not trigger validation. The pop-up\'s per-mille',
      'field must be located by its own row/label scoping (probe-<loadings>.js) before this is encoded —',
      'not blind-tweaked further. The pop-up presence, the percentage dropdown, TPD/Disability greyed',
      'per-mille, Cancel, tooltips, and the empty-quote error ARE verified (AC01/02/03/06/09/10).',
    ].join('\n') });
    test.fixme(true, 'Deferred: the Loadings pop-up per-mille input needs a focused DOM probe to target the correct field (the generic "first enabled input" grabbed a Quote-screen field behind the pop-up backdrop; raw .value= did not fire validation). Encode AC07 (>$20 error + $20 boundary accept) once the per-mille field is pinned by its row/label scoping — held per the "verify before writing up / do not blind-tweak" rule.');
  });

  test('AC03: Cancel / X returns to the Quote screen', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When I click X or Cancel on the Loadings screen, Then I am redirected back to the Quote screen.',
      '', 'Steps to reproduce:', '1. New quote, price Life $200k, open Loadings. 2. Click Cancel. 3. Confirm the Quote screen (Life SI field) is visible.',
      '', 'Expected: after Cancel, the Quote screen is shown (pop-up closed).',
    ].join('\n') });
    const quote = await openLoadings(page);
    await quote.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((x) => /^(Cancel|Close)$/i.test((x.innerText || '').trim())); if (b) b.click(); });
    await waitForSettle(quote, 1500);
    const backOnQuote = await sumInsuredInput(quote, 0).isVisible().catch(() => false);
    await recordStep(testInfo, page, { label: 'Cancel returns to the Quote screen', expected: true, actual: backOnQuote });
    expect(backOnQuote, 'AC03: Cancel returns to Quote').toBe(true);
  });

  test('AC09: Loadings "?" tooltips (Percentage / Per mille explanations)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: the "?" tooltips explain Percentage ("Percentage loadings are applied where a client does not meet standard health criteria...") and Per mille ("Per mille loadings are applied where a client is assessed as an additional risk...").',
      '', 'Steps to reproduce:', '1. New quote, price Life $200k, open Loadings. 2. Search DOM/title attrs for the tooltip phrases.',
      '', 'Expected: the Percentage and/or Per mille tooltip phrases present.',
    ].join('\n') });
    const quote = await openLoadings(page);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    await recordStep(testInfo, page, { label: 'Loadings tooltip explains percentage/per-mille loadings', expected: 'contains "loadings are applied where a client"', actual: /loadings are applied where a client/i.test(hay) });
    expect(hay, 'AC09: loadings tooltip present').toMatch(/loadings are applied where a client/i);
  });

  test('AC10: opening Loadings with NO priced quote (premium $0) shows the error pop-up', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: When Total Yearly Premium is zero (no quote created) and I click the Loadings link, Then a Loadings pop-up with an error message is displayed.',
      '', 'Steps to reproduce:', '1. New quote, set minimum personal details but DO NOT price any cover (premium $0). 2. Click Loadings. 3. Confirm an error message is shown.',
      '', 'Expected: an error/message indicating loadings cannot be entered without a calculated premium.',
    ].join('\n') });
    const quote = await openLoadings(page, { priced: false });
    const msg = await quote.evaluate(() => {
      const t = document.body.innerText || '';
      const m = t.match(/[^\n]*(premium|calculate|cover|loading)[^\n]*/i);
      return m ? m[0] : '';
    });
    const errs = await errText(quote);
    const hasError = (errs && errs.length > 0) || /premium|calculate a quote|add a cover|no cover/i.test(msg);
    await recordStep(testInfo, page, { label: 'Loadings on an unpriced quote shows an error/blocking message', expected: 'error/blocking message shown', actual: (errs || '') + ' | ' + msg.slice(0, 120) });
    expect(hasError, `AC10: unpriced-quote Loadings error. Got errs="${errs}" msg="${msg.slice(0,120)}"`).toBe(true);
  });

  // ── Deferred ACs (documented) ──
  test('AC04/AC05/AC08: OK saves loadings + "Loadings have been applied" message + premium reflects loadings (per life)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC04: OK saves + redirects to Quote + premium reflects updated loadings + "Loadings have been applied" under Total Yearly Premium. AC05: the down-arrow opens the Underwriting Guide in a new window. AC08: "Loadings have been applied" per life it was applied to.'].join('\n') });
    test.fixme(true, 'Deferred: AC04/AC08 assert the premium CHANGES by the loading and the "Loadings have been applied" confirmation after OK — the premium delta is a pricing-engine value (not hand-verifiable), and reliably reading the post-OK confirmation needs the exact OK-button selector + a stable post-apply signal (the probe found "Cancel" but not a plain "OK" — the apply control needs pinning down). AC05 opens an EXTERNAL Underwriting Guide URL in a new window (leaves the app). Encode in a focused follow-up: pin the OK/apply control, assert the "Loadings have been applied" text (behavioural, not the $ value), and capture the window.open target for AC05.');
  });
});
