// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/kids-cover-and-multi-life/page.md
const { test, expect } = require('@playwright/test');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, clickApply, expectErrorContaining, sumInsuredInput, waitForSettle, getTotalYearlyPremium } = require('../../helpers/quote-helpers');
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

// Sets the kid's Date of birth via the native value-setter + dispatch pattern (same
// convention as the adult DOB field in personal-details.spec.js's PD-15/16 test),
// disambiguated from the adult's own DOB field by excluding its known id.
async function setKidDob(page, dateStr) {
  await page.evaluate((val) => {
    const kidInput = [...document.querySelectorAll('input[type="date"]')].find((i) => i.id !== 'b15-Input_BirthDate');
    if (!kidInput) throw new Error('Kid DOB input not found');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(kidInput, val);
    kidInput.dispatchEvent(new Event('input', { bubbles: true }));
    kidInput.dispatchEvent(new Event('change', { bubbles: true }));
    kidInput.dispatchEvent(new Event('blur', { bubbles: true }));
  }, dateStr);
}

// Added 2026-09-02, closing a gap flagged in a full boundary-coverage audit: KID-10 (Kids
// Cover premium only charged once Sum Insured exceeds the free $50,000 tier) had no
// boundary test anywhere — KID-07 confirms the tier LIST shape but never checks the actual
// premium impact of crossing from the free tier into the first paid one.
test('KID-10: Kids Cover premium is only charged once Sum Insured exceeds the free $50,000 tier', async ({}, testInfo) => {
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await waitForSettle(quote);
  const premiumBeforeKids = await getTotalYearlyPremium(quote);

  await numberOfKidsSelect(quote).selectOption('1');
  await waitForSettle(quote);
  // A kid DOB is required for the cover to price at all once it's non-free (confirmed live:
  // leaving it unset at a paid tier zeroed the ENTIRE quote's premium, not just the kid's
  // own line) - set one now, safely within the ~21-year window (KID-12), well before
  // reaching the paid tier below.
  await setKidDob(quote, '2018-06-15');
  await waitForSettle(quote);
  // Default SI tier is $50,000 (Free) per KID-07 - premium should be unchanged.
  const premiumAtFreeTier = await getTotalYearlyPremium(quote);
  recordCheck(testInfo, { label: 'Total yearly premium unchanged with Kids Cover at the $50,000 (Free) tier', expected: premiumBeforeKids, actual: premiumAtFreeTier });
  expect(premiumAtFreeTier).toBe(premiumBeforeKids);

  const tierDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$50,000 (Free)' }) }).first();
  await tierDropdown.selectOption({ label: '$60,000' });
  await waitForSettle(quote);
  const premiumAtNextTier = await getTotalYearlyPremium(quote);
  recordCheck(testInfo, { label: 'Total yearly premium increases once Kid Sum Insured exceeds the $50,000 free tier (next tier: $60,000)', expected: `> ${premiumBeforeKids}`, actual: premiumAtNextTier });
  expect(premiumAtNextTier).toBeGreaterThan(premiumBeforeKids);
});
