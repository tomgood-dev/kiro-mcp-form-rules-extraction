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
    const states = await quote.evaluate(() => {
      function st(idFrag) { const e = [...document.querySelectorAll('input')].find((i) => (i.id || '').indexOf(idFrag) !== -1); return e ? e.disabled : null; }
      return {
        tpd: st('Input_PerMille_TPD'),
        trauma: st('Input_PerMille_Trauma'),
        cancer: st('Input_PerMille_Cancer'),
        disability: st('Input_PerMille_Disability'),
      };
    });
    // TPD + Disability must be greyed (disabled); Life/Trauma/Cancer must be enabled.
    await recordStep(testInfo, page, { label: 'TPD Per Mille field is greyed/disabled', expected: true, actual: states.tpd });
    await recordStep(testInfo, page, { label: 'Disability Per Mille field is greyed/disabled', expected: true, actual: states.disability });
    await recordStep(testInfo, page, { label: 'Trauma Per Mille field is enabled (per-mille allowed)', expected: false, actual: states.trauma });
    await recordStep(testInfo, page, { label: 'Cancer Per Mille field is enabled (per-mille allowed)', expected: false, actual: states.cancer });
    expect(states.tpd, 'AC06: TPD per-mille greyed/disabled').toBe(true);
    expect(states.disability, 'AC06: Disability per-mille greyed/disabled').toBe(true);
    expect(states.trauma, 'AC06: Trauma per-mille NOT disabled (per-mille allowed for lump-sum risk)').toBe(false);
    expect(states.cancer, 'AC06: Cancer per-mille NOT disabled (per-mille allowed for lump-sum risk)').toBe(false);
  });

  test('AC07: Per Mille loading > $20.00 → maximum-per-mille error (+ $20.00 boundary accept)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given the user is on the Loadings screen, When the user enters a loading value greater',
      'than 20.00 per mille, Then the system must display an error message',
      '"The maximum per mille loading is $20.00".',
      '',
      'Steps to reproduce:',
      '1. New quote, price Life $200k, open Loadings.',
      '2. Enter 25 in the Life Per Mille field (id b25-b16-Input_PerMille); blur.',
      '3. Check for the max-per-mille error.',
      '4. Enter exactly 20 (at the boundary); blur; confirm NO error (accepted).',
      '',
      'Expected: 25 → "The maximum per mille loading is $20.00"; 20 → accepted (no error).',
      'Actual (current, probe 2026-09-11): entering 25 (and 20.01) leaves the value accepted',
      '(validity.valid=true) with NO max-per-mille error shown anywhere — the cap is not enforced/',
      'displayed on QA. AC07 therefore FAILS at the over-limit assertion (expected-fail until fixed).',
      'The $20.00 at-boundary accept passes. Discrepancy Evidence Record: enter-loadings/page.md.',
    ].join('\n') });
    const quote = await openLoadings(page);
    const PM = '[id="b25-b16-Input_PerMille"]';
    // Over-limit: enter 25 → spec expects the max-per-mille error.
    await quote.locator(PM).fill('25');
    await quote.locator(PM).blur().catch(() => {});
    await waitForSettle(quote, 1500);
    const overErr = await quote.evaluate(() => /maximum per mille loading is \$20\.00/i.test(document.body.innerText || ''));
    await recordStep(testInfo, page, { label: 'Per mille 25 (> $20) shows "The maximum per mille loading is $20.00"', expected: true, actual: overErr });

    // At-boundary: exactly 20.00 → accepted, no error (this side passes).
    await quote.locator(PM).fill('20');
    await quote.locator(PM).blur().catch(() => {});
    await waitForSettle(quote, 1500);
    const atBoundaryErr = await quote.evaluate(() => /maximum per mille/i.test(document.body.innerText || ''));
    await recordStep(testInfo, page, { label: 'Per mille exactly $20.00 is accepted (no max error)', expected: false, actual: atBoundaryErr });
    // Assert the accept side first (known-good), then the over-limit side (expected-fail per spec).
    expect(atBoundaryErr, 'AC07: $20.00 at-boundary accepted (no max-per-mille error)').toBe(false);
    expect(overErr, 'AC07: >$20.00 must show "The maximum per mille loading is $20.00" (currently NOT enforced — expected-fail until app fixed)').toBe(true);
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

  // ── AC04/AC08: OK saves loadings, redirects to Quote, "Loadings have been applied" shown ──
  test('AC04/AC08: OK applies loadings → back on Quote + "Loadings have been applied" message', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given the user is on the Loadings screen, When the user clicks OK, Then the selected',
      'loading values are saved, the user is redirected to the Quote screen, the premium details',
      'reflect the updated loadings, AND "Loadings have been applied" is displayed under Total Yearly',
      'Premium.',
      'AC08: "Loadings have been applied" is displayed on the quote page for each life a loading was',
      'applied to.',
      '',
      'Steps to reproduce:',
      '1. New quote, price Life $200k, open Loadings.',
      '2. Enter a valid per mille loading (10) on Life; click OK.',
      '3. Confirm redirect back to the Quote screen and the "Loadings have been applied" message.',
      '',
      'Expected: back on Quote screen; "Loadings have been applied" message present.',
      'Note: the exact premium DELTA is a pricing-engine value (not hand-verifiable) — this test',
      'asserts the behavioural AC04/AC08 outcome (save + redirect + confirmation message), which was',
      'confirmed live 2026-09-11.',
    ].join('\n') });
    const quote = await openLoadings(page);
    const PM = '[id="b25-b16-Input_PerMille"]';
    await quote.locator(PM).fill('10');
    await quote.locator(PM).blur().catch(() => {});
    await waitForSettle(quote, 1000);
    await quote.getByRole('button', { name: 'OK', exact: true }).click({ timeout: 10000 });
    await waitForSettle(quote, 2500);
    const backOnQuote = await sumInsuredInput(quote, 0).isVisible().catch(() => false);
    await recordStep(testInfo, page, { label: 'After OK, redirected back to the Quote screen', expected: true, actual: backOnQuote });
    expect(backOnQuote, 'AC04: OK redirects back to the Quote screen').toBe(true);
    const applied = await quote.evaluate(() => /loadings have been applied/i.test(document.body.innerText || ''));
    await recordStep(testInfo, page, { label: '"Loadings have been applied" message shown on the Quote screen', expected: true, actual: applied });
    expect(applied, 'AC04/AC08: "Loadings have been applied" message displayed').toBe(true);
  });

  // ── Deferred: AC05 only (genuine external navigation) ──
  test('AC05: down-arrow opens the Underwriting Guide in a new browser window', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: When the user clicks the Down arrow icon next to Loadings, Then the system opens the',
      'Underwriting Guide document in a NEW browser window',
      '(https://asteron-advisernet.int.corp.sun/adviser/document?title=Underwriting%20Guide).',
      '',
      'Deferred (genuine external navigation): this AC opens an EXTERNAL corporate URL',
      '(asteron-advisernet.int.corp.sun) in a new window — it leaves the app and targets an intranet',
      'host that is not reachable/whitelisted from the test network. Probe 2026-09-11 mapped the',
      'Loadings modal (per-mille inputs, Cancel/OK) but the down-arrow launches an out-of-app window',
      'to an intranet doc host. Reachable only if that host is whitelisted; otherwise assert via a',
      'window.open target capture (popup event URL) rather than loading the external page.',
    ].join('\n') });
    test.fixme(true, 'Deferred (genuine external navigation): AC05 opens the Underwriting Guide at the intranet host asteron-advisernet.int.corp.sun in a NEW window — it leaves the app and targets a host not reachable/whitelisted from the test network. Probe 2026-09-11 confirmed the Loadings modal DOM (per-mille inputs + Cancel/OK) but this control launches an out-of-app window. Encode as a window.open target-URL capture (popup event) if/when that assertion approach is wired, or once the intranet host is whitelisted.');
  });
});
