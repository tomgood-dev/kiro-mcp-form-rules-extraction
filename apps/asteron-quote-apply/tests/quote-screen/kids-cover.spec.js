// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/kids-cover-and-multi-life/page.md
const { test, expect } = require('@playwright/test');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, clickApply, expectErrorContaining, sumInsuredInput, waitForSettle } = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote);
});

// "Number of Kids" renders as a plain OutSystems-generated <select> with no accessible
// name matching its visible label text — getByRole('combobox', {name: 'Number of Kids'})
// silently matches nothing (confirmed live: it's really id="...-Dropdown1", no aria-label).
// Identify it by its distinctive option shape (exactly the digits 0-9) instead.
function numberOfKidsSelect(page) {
  return page.locator('select')
    .filter({ has: page.locator('option', { hasText: /^0$/ }) })
    .filter({ has: page.locator('option', { hasText: /^9$/ }) })
    .first();
}

test('KID-01: Number of Kids offers exactly 0–9', async ({}, testInfo) => {
  const options = await numberOfKidsSelect(quote).locator('option').allInnerTexts();
  recordCheck(testInfo, { label: 'Number of Kids dropdown offers exactly 0–9', expected: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], actual: options });
  expect(options).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
});

test('KID-05: each kid row requires a Date of birth', async () => {
  // Per KID-08, Kids Cover requires at least one Personal Insurance Cover — without
  // one, Apply blocks on "Please add at least one Personal Insurance Cover before
  // adding Kids Cover" before the per-kid Date of birth check is ever reached.
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await numberOfKidsSelect(quote).selectOption('1');
  await waitForSettle(quote);
  await clickApply(quote);
  await expectErrorContaining(quote, 'Required field');
});

test('KID-07: Kid Sum Insured tier list runs $50,000 (Free) to $200,000 in $10,000 steps', async ({}, testInfo) => {
  await numberOfKidsSelect(quote).selectOption('1');
  await waitForSettle(quote);

  const tierDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$50,000 (Free)' }) }).first();
  const options = await tierDropdown.locator('option').allInnerTexts();
  recordCheck(testInfo, { label: 'Kid Sum Insured tier list starts at $50,000 (Free)', expected: '$50,000 (Free)', actual: options[0] });
  expect(options[0]).toBe('$50,000 (Free)');
  recordCheck(testInfo, { label: 'Kid Sum Insured tier list ends at $200,000', expected: '$200,000', actual: options.at(-1) });
  expect(options.at(-1)).toBe('$200,000');
  recordCheck(testInfo, { label: 'Kid Sum Insured tier list has 16 options ($50,000 (Free) to $200,000 in $10,000 steps)', expected: 16, actual: options.length });
  expect(options).toHaveLength(16);
});
