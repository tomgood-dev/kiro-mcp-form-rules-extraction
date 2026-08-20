// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/personal-details/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  setOccupation,
  activateCover,
  fillCalcMask,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  waitForSettle,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

test.describe('PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75)', () => {
  test('PD-11: age 10 is rejected (below range)', async () => {
    await quote.getByRole('spinbutton', { name: /Age next birthday/ }).fill('10');
    await quote.getByRole('radio', { name: 'Male', exact: true }).click(); // blur trigger
    await waitForSettle(quote);
    await expectErrorContaining(quote, 'between 11 and 75');
  });

  test('PD-11: age 76 is rejected (above range)', async () => {
    await quote.getByRole('spinbutton', { name: /Age next birthday/ }).fill('76');
    await quote.getByRole('radio', { name: 'Male', exact: true }).click();
    await waitForSettle(quote);
    await expectErrorContaining(quote, 'between 11 and 75');
  });

  test('PD-11: boundary ages 11 and 75 are both accepted', async () => {
    for (const age of [11, 75]) {
      await quote.getByRole('spinbutton', { name: /Age next birthday/ }).fill(String(age));
      await quote.getByRole('radio', { name: 'Male', exact: true }).click();
      await waitForSettle(quote);
      const errors = await getVisibleErrors(quote);
      expect(errors.some((e) => e.includes('between 11 and 75'))).toBe(false);
    }
  });

  test('PD-12: both client-side and server-side range error text can appear for an out-of-range age', async () => {
    await quote.getByRole('spinbutton', { name: /Age next birthday/ }).fill('5');
    await quote.getByRole('radio', { name: 'Male', exact: true }).click();
    await waitForSettle(quote);
    const errors = await getVisibleErrors(quote);
    const hasClientMsg = errors.some((e) => e.includes('Age next birthday should be between 11 and 75'));
    const hasServerMsg = errors.some((e) => e.includes('Age Next Birthday must be between 11 and 75'));
    expect(hasClientMsg || hasServerMsg).toBe(true);
  });
});

test('PD-14: TPD requires a minimum Age Next Birthday of 17', async () => {
  await setMinimumPersonalDetails(quote, { age: 16 });
  await activateCover(quote, 'TPD');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '100000');
  await clickApply(quote);
  await expectErrorContaining(quote, 'minimum Age Next Birthday');
});

test('PD-15/PD-16: DOB auto-calculates Age, and manually typing Age clears DOB', async () => {
  const dob = quote.getByLabel('Date of birth');
  const ageField = quote.getByRole('spinbutton', { name: /Age next birthday/ });

  // Setting DOB should populate Age (native value-setter + input/change/blur, per the automation appendix).
  await quote.evaluate(() => {
    const el = document.getElementById('b15-Input_BirthDate');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '1990-06-15');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await waitForSettle(quote);
  await expect(ageField).not.toHaveValue('');

  // Manually typing Age should clear DOB.
  await ageField.fill('40');
  await waitForSettle(quote);
  await expect(dob).toHaveValue('');
});

test('PD-20: Employment Status set to any real value reveals the Disability Covers section', async () => {
  await setMinimumPersonalDetails(quote);
  const before = await quote.evaluate(() =>
    document.body.innerText.includes('Mortgage & Living')
  );
  expect(before).toBe(false);

  await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
  await waitForSettle(quote);

  const after = await quote.evaluate(() => document.body.innerText.includes('Mortgage & Living'));
  expect(after).toBe(true);
});

test('PD-21: Occupation Code = IC triggers an underwriting-referral warning', async () => {
  await quote.getByRole('spinbutton', { name: /Age next birthday/ }).fill('35');
  await quote.getByRole('radio', { name: 'Male', exact: true }).click();
  await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'IC' });
  await activateCover(quote, 'Life');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '200000');
  await clickApply(quote);
  await expectErrorContaining(quote, 'Individual Consideration');
});

test('Sanity: minimum Personal Details + a $200,000 Life cover prices successfully', async () => {
  await setMinimumPersonalDetails(quote);
  await activateCover(quote, 'Life');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '200000');
  await waitForSettle(quote);
  const premium = await getTotalYearlyPremium(quote);
  expect(premium).toBeGreaterThan(0);
});
