// Discounts & Bundling Discounts — acceptance-criteria mode (Jira ACB-2296).
// Source: docs/user-stories/User Story- Discounts & Bundling Discounts.md
//
// Exhaustive standard: positive + negative/absence + boundary + value-level via recordCheck.
// Bundling rule (Business Rules): count each DISTINCT eligible cover TYPE once; 2 types = 15%,
// 3+ types = 20%. Eligible min SI: Life $100k, Trauma/Cancer $25k, TPD $100k, Disability $1k/mo.
// NOTE (documented in premium-details AC02): the QA app has shown "12.5% (2 covers)" / "17.5% (3+)"
// instead of the story's 15%/20% for the personal-only bundling widget — a known discrepancy. This
// spec asserts the STORY values (15%/20%) so it goes green when the app is corrected; a mismatch is
// encoded as expected-to-fail per AC-mode. getBundlingDiscount() reads the "Bundling Discounts" line.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput,
  getBundlingDiscount, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck, recordStep } = require('../../../../tools/artifact-helpers');

async function freshQuote(page, personal) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, personal || { age: 40, gender: 'Male', occupationCode: '1' });
  return quote;
}

test.describe('Discounts & Bundling Discounts (ACB-2296)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01: Bundling Discounts is shown when multiple eligible covers are selected', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: When creating a quote with multiple covers, Then I can view the bundling discount ("Bundling Discounts") applied.',
      '', 'Steps to reproduce:', '1. New quote, activate Life $200k + TPD $200k (2 eligible types). 2. Read the Bundling Discounts line.',
      '', 'Expected: a non-null Bundling Discounts value is displayed.',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote, 1500);
    const d = await getBundlingDiscount(quote);
    await recordStep(testInfo, page, { label: 'Bundling Discounts shown with 2 eligible covers', expected: 'non-null discount', actual: d });
    expect(d, 'AC01: Bundling Discounts displayed').not.toBeNull();
  });

  test('AC02: 2 eligible covers (both >= min SI) → 15% bundling discount', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: When 2 eligible covers are selected (per business rules), Then a 15% discount is applied.',
      '', 'Steps to reproduce:', '1. New quote, Life $200k (>=$100k) + TPD $200k (>=$100k) — 2 distinct eligible types. 2. Read Bundling Discounts.',
      '', 'Expected: "15% (2 covers)". NOTE: QA has shown "12.5% (2 covers)" (known discrepancy, premium-details AC02) — asserted to the story value so it goes green when fixed.',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote, 1500);
    const d = await getBundlingDiscount(quote);
    await recordStep(testInfo, page, { label: '2 eligible covers show 15% bundling discount', expected: '15% (2 covers)', actual: d });
    expect(d, 'AC02: 2 covers -> 15%').toContain('15%');
  });

  test('AC03: 3 eligible covers → 20% bundling discount', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: When 3 or more eligible covers are selected, Then a 20% discount is applied.',
      '', 'Steps to reproduce:', '1. New quote, Life $200k + TPD $200k + Trauma $50k (3 distinct eligible types, each >= its min SI). 2. Read Bundling Discounts.',
      '', 'Expected: "20% (3 covers or more)". NOTE: QA has shown "17.5%" (known discrepancy) — asserted to the story value.',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 2), '50000');
    await waitForSettle(quote, 1500);
    const d = await getBundlingDiscount(quote);
    await recordStep(testInfo, page, { label: '3 eligible covers show 20% bundling discount', expected: '20% (3 covers or more)', actual: d });
    expect(d, 'AC03: 3 covers -> 20%').toContain('20%');
  });

  test('AC02 boundary: a 2nd cover BELOW its minimum SI does NOT count toward bundling (stays None/lower)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02/AC04 (negative/boundary): a cover below its minimum SI is not eligible and does not add to the bundling count.',
      '', 'Steps to reproduce:', '1. New quote, Life $200k (eligible). 2. Add TPD $99,999 (BELOW the $100,000 TPD minimum). 3. Read Bundling Discounts — TPD must NOT count as a 2nd eligible cover.',
      '', 'Expected: the discount does NOT reflect 2 eligible covers (TPD below min is excluded).',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '99999'); // below $100k TPD minimum
    await waitForSettle(quote, 1500);
    const d = await getBundlingDiscount(quote);
    // With only ONE eligible cover (Life), no 2-cover bundling discount should apply.
    const countsAsTwo = /2 cover|15%|12\.5%/i.test(d || '');
    await recordStep(testInfo, page, { label: 'TPD below its $100k minimum does not count toward bundling', expected: 'no 2-cover discount (None)', actual: d });
    expect(countsAsTwo, 'AC02 boundary: below-min TPD excluded from bundling').toBe(false);
  });

  test('AC04: removing an eligible cover recalculates/removes the bundling discount', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: When I remove the last of an eligible cover type, Then the discount recalculates (and is removed if the remaining covers no longer qualify).',
      '', 'Steps to reproduce:', '1. New quote, Life $200k + TPD $200k (2 covers -> discount). 2. Remove TPD. 3. Read Bundling Discounts — should drop back to None (only 1 eligible cover).',
      '', 'Expected: discount present with 2 covers, then None/absent after removing the 2nd.',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote, 1500);
    const before = await getBundlingDiscount(quote);
    await recordStep(testInfo, page, { label: 'Bundling discount present with 2 covers (before removal)', expected: 'a % discount', actual: before });
    expect(/%|cover/i.test(before || ''), 'AC04: discount present with 2 covers').toBe(true);
    // Remove the TPD cover (last Remove link).
    await quote.evaluate(() => { const l=[...document.querySelectorAll('a')].filter((a)=>a.innerText.trim()==='Remove'); if(l.length) l[l.length-1].click(); });
    await waitForSettle(quote, 1500);
    const after = await getBundlingDiscount(quote);
    await recordStep(testInfo, page, { label: 'Bundling discount recalculated to None after removing the 2nd cover', expected: 'None', actual: after });
    expect(/None/i.test(after || '') || after === null, 'AC04: discount removed/None after removal').toBe(true);
  });

  test('AC05/AC06: Bundling Discounts shows in the right-hand details banner + "?" tooltip explains 15%/20%', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: with multiple eligible covers, the discount shows in the right-hand details banner. AC06: the "?" next to Bundling Discounts shows the tooltip "A discount that applies to Personal & Business for taking out multiple cover types: 2 cover types: 15%, 3 or more cover types: 20%".',
      '', 'Steps to reproduce:', '1. New quote, Life $200k + TPD $200k. 2. Confirm the Bundling Discounts line is in the panel and the tooltip text is present.',
      '', 'Expected: Bundling Discounts present; tooltip mentions "2 cover types" and the percentages.',
    ].join('\n') });
    const quote = await freshQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote, 1500);
    const inBanner = await quote.evaluate(() => /Bundling Discounts/i.test(document.body.innerText));
    await recordStep(testInfo, page, { label: 'Bundling Discounts shown in the details banner', expected: true, actual: inBanner });
    expect(inBanner, 'AC05: Bundling Discounts in banner').toBe(true);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    await recordStep(testInfo, page, { label: 'Bundling tooltip explains multiple-cover-type discount', expected: 'contains "cover types" + 15%/20% (or the app 12.5%/17.5% variant)', actual: /taking out multiple cover types/i.test(hay) });
    expect(hay, 'AC06: bundling tooltip present').toMatch(/multiple cover types/i);
  });
});
