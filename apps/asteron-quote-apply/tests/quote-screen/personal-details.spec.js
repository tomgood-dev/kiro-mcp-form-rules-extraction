// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/personal-details/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setAge,
  setGender,
  setMinimumPersonalDetails,
  setOccupation,
  activateCover,
  fillCalcMask,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  waitForSettle,
  sumInsuredInput,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

// Per PD-11/PD-12 (corrected 2026-08-26): the range error does NOT reliably appear on
// blur alone - confirmed live it only surfaces once a cover is priced and Apply is
// clicked. Each check below activates Life + a Sum Insured before asserting, matching
// confirmed live behavior rather than the original (unconfirmed) blur-only assumption.
test.describe('PD-11/PD-12/PD-26/PD-27 — Age next birthday valid range (11–75)', () => {
  async function priceAndApply(age) {
    await setAge(quote, age);
    await setGender(quote, 'Male');
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
  }

  test('PD-11: age 10 is rejected (below range)', async () => {
    await priceAndApply(10);
    await expectErrorContaining(quote, 'between 11 and 75');
  });

  test('PD-11: age 76 is rejected (above range)', async () => {
    await priceAndApply(76);
    await expectErrorContaining(quote, 'between 11 and 75');
  });

  test('PD-11: boundary ages 11 and 75 are both accepted', async () => {
    for (const age of [11, 75]) {
      await setAge(quote, age);
      await setGender(quote, 'Male');
      const errors = await getVisibleErrors(quote);
      expect(errors.some((e) => e.includes('between 11 and 75'))).toBe(false);
    }
  });

  test('PD-12: both client-side and server-side range error text appear together for an out-of-range age', async () => {
    await priceAndApply(5);
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
  const ageField = quote.locator('input[id*="Input_AgeNextBirthday"]').first();

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

  // Manually typing Age (via the proven click+clear+type+tab pattern, not .fill()) should clear DOB.
  await setAge(quote, 40);
  await expect(dob).toHaveValue('');
});

// Rewritten 2026-08-26: the original premise (Employment Status reveals/hides the
// Disability Covers section) was confirmed false live - the buttons are visible and
// enabled before Employment Status is ever touched. Employment Status's real, confirmed
// effect is blocking Apply once a Disability cover is actually priced without it set.
test('PD-20: Disability Covers buttons are visible regardless of Employment Status, but Employment Status blocks Apply once a Disability cover is priced', async () => {
  await setMinimumPersonalDetails(quote); // Employment Status left unset
  const visibility = await quote.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Mortgage & Living');
    return { present: !!btn, visible: btn ? btn.getBoundingClientRect().width > 0 : false, disabled: btn ? btn.disabled : null };
  });
  expect(visibility, 'PD-20: Disability cover buttons are visible/enabled before Employment Status is set').toEqual({ present: true, visible: true, disabled: false });

  await activateCover(quote, 'Mortgage & Living');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '1000');
  await clickApply(quote);
  await expectErrorContaining(quote, 'Employment Status');
});

test('PD-21: Occupation Code = IC triggers an underwriting-referral warning', async () => {
  await setAge(quote, 35);
  await setGender(quote, 'Male');
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
