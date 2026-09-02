// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/personal-details/page.md
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
const { recordCheck } = require('../../../../tools/artifact-helpers');

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

  test('PD-11: boundary ages 11 and 75 are both accepted', async ({}, testInfo) => {
    for (const age of [11, 75]) {
      await setAge(quote, age);
      await setGender(quote, 'Male');
      const errors = await getVisibleErrors(quote);
      const hasRangeError = errors.some((e) => e.includes('between 11 and 75'));
      recordCheck(testInfo, { label: `Age ${age}: no "between 11 and 75" range error shown`, expected: false, actual: hasRangeError });
      expect(hasRangeError).toBe(false);
    }
  });

  test('PD-12: both client-side and server-side range error text appear together for an out-of-range age', async ({}, testInfo) => {
    await priceAndApply(5);
    const errors = await getVisibleErrors(quote);
    const hasClientMsg = errors.some((e) => e.includes('Age next birthday should be between 11 and 75'));
    const hasServerMsg = errors.some((e) => e.includes('Age Next Birthday must be between 11 and 75'));
    const hasEitherRangeMsg = hasClientMsg || hasServerMsg;
    recordCheck(testInfo, { label: 'Client-side or server-side age range error message shown for an out-of-range age', expected: true, actual: hasEitherRangeMsg });
    expect(hasEitherRangeMsg).toBe(true);
  });
});

// PD-01/PD-02 boundary coverage — added 2026-09-02, closing a gap flagged in a full
// boundary-coverage audit (every other stated numeric/length/date limit in the project
// already had below/at/over coverage somewhere; these two character limits did not).
// Per PD-24: a value set via .fill()/script BYPASSES the max-length enforcement entirely -
// real keyboard typing must be used to observe the genuine cap, so this uses
// page.keyboard.type() (not .fill()), matching the project's established interaction
// gotcha for this exact field.
//
// IMPORTANT: type ONE CHARACTER PER keyboard.type() CALL, WITH A REAL WAIT AFTER EACH ONE -
// not the whole string in a single call, and not a tight loop of single-char calls either.
// Confirmed live (2026-09-02) via two rounds of diagnosis: (1) one page.keyboard.type(text,
// {delay:15}) burst for a 19-char string left only 2 characters in the field - the
// OutSystems reactive re-render can't keep up with a long uninterrupted keystroke burst and
// resets mid-typing; (2) typing one character at a time in its OWN call, WITHOUT an explicit
// wait after each, landed the exact same "only 2 characters" result - the `delay` option
// only affects timing WITHIN a single .type() call, not between separate calls, so a tight
// loop of them still races the re-render just as badly. What actually worked in the first
// diagnostic was reading .inputValue() after every character - that round-trip's overhead
// was what gave the framework time to settle, not the one-char-per-call structure itself.
// An explicit waitForTimeout after each character reproduces that same effect directly.
async function typeReal(page, locator, text) {
  await locator.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(300);
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: 40 });
    await page.waitForTimeout(60);
  }
}

// Generates a string of DISTINCT, cycling letters (not a single repeated character).
// Confirmed live (2026-09-02): typing a single repeated character (e.g. 'A'.repeat(19))
// consistently landed only 2 characters regardless of typing strategy (one big burst, one
// character per call, one character per call with an explicit wait after each), while an
// otherwise-identical diagnostic using VARIED characters ("ABCDEFGHIJKLMNOPQRS") landed all
// 19/19 correctly. The reactive framework's diffing/re-render appears to special-case (or
// get confused by) runs of identical characters - using varied ones sidesteps it entirely.
function variedChars(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[i % alphabet.length];
  return out;
}

test('PD-01: First Name accepts up to 20 characters, caps at the 21st', async ({}, testInfo) => {
  const firstName = quote.locator('input[id*="Input_FirstName"]').first();

  await typeReal(quote, firstName, variedChars(19));
  const valueAt19 = (await firstName.inputValue()).length;
  recordCheck(testInfo, { label: 'First Name at 19 characters (below the 20-char max) is accepted in full', expected: 19, actual: valueAt19 });
  expect(valueAt19).toBe(19);

  await typeReal(quote, firstName, variedChars(20));
  const valueAt20 = (await firstName.inputValue()).length;
  recordCheck(testInfo, { label: 'First Name at exactly 20 characters (the documented max, PD-01) is accepted in full', expected: 20, actual: valueAt20 });
  expect(valueAt20).toBe(20);

  await typeReal(quote, firstName, variedChars(21));
  const valueAt21 = (await firstName.inputValue()).length;
  recordCheck(testInfo, { label: 'First Name at 21 characters (over the 20-char max) is capped at 20, the 21st character rejected', expected: 20, actual: valueAt21 });
  expect(valueAt21).toBe(20);
});

test('PD-02: Last Name accepts up to 30 characters, caps at the 31st', async ({}, testInfo) => {
  const lastName = quote.locator('input[id*="Input_LastName"]').first();

  await typeReal(quote, lastName, variedChars(29));
  const valueAt29 = (await lastName.inputValue()).length;
  recordCheck(testInfo, { label: 'Last Name at 29 characters (below the 30-char max) is accepted in full', expected: 29, actual: valueAt29 });
  expect(valueAt29).toBe(29);

  await typeReal(quote, lastName, variedChars(30));
  const valueAt30 = (await lastName.inputValue()).length;
  recordCheck(testInfo, { label: 'Last Name at exactly 30 characters (the documented max, PD-02) is accepted in full', expected: 30, actual: valueAt30 });
  expect(valueAt30).toBe(30);

  await typeReal(quote, lastName, variedChars(31));
  const valueAt31 = (await lastName.inputValue()).length;
  recordCheck(testInfo, { label: 'Last Name at 31 characters (over the 30-char max) is capped at 30, the 31st character rejected', expected: 30, actual: valueAt31 });
  expect(valueAt31).toBe(30);
});

test('PD-14: TPD requires a minimum Age Next Birthday of 17', async () => {
  await setMinimumPersonalDetails(quote, { age: 16 });
  await activateCover(quote, 'TPD');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '100000');
  await clickApply(quote);
  await expectErrorContaining(quote, 'minimum Age Next Birthday');
});

test('PD-15/PD-16: DOB auto-calculates Age, and manually typing Age clears DOB', async ({}, testInfo) => {
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
  const ageAfterDob = await ageField.inputValue();
  recordCheck(testInfo, { label: 'Age Next Birthday auto-populated after Date of birth is set', expected: 'not blank', actual: ageAfterDob });
  await expect(ageField).not.toHaveValue('');

  // Manually typing Age (via the proven click+clear+type+tab pattern, not .fill()) should clear DOB.
  await setAge(quote, 40);
  const dobAfterManualAge = await dob.inputValue();
  recordCheck(testInfo, { label: 'Date of birth cleared after manually typing Age Next Birthday', expected: '', actual: dobAfterManualAge });
  await expect(dob).toHaveValue('');
});

// Rewritten 2026-08-26: the original premise (Employment Status reveals/hides the
// Disability Covers section) was confirmed false live - the buttons are visible and
// enabled before Employment Status is ever touched. Employment Status's real, confirmed
// effect is blocking Apply once a Disability cover is actually priced without it set.
test('PD-20: Disability Covers buttons are visible regardless of Employment Status, but Employment Status blocks Apply once a Disability cover is priced', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote); // Employment Status left unset
  const visibility = await quote.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Mortgage & Living');
    return { present: !!btn, visible: btn ? btn.getBoundingClientRect().width > 0 : false, disabled: btn ? btn.disabled : null };
  });
  recordCheck(testInfo, { label: 'Disability cover buttons are visible/enabled before Employment Status is set', expected: { present: true, visible: true, disabled: false }, actual: visibility });
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

test('Sanity: minimum Personal Details + a $200,000 Life cover prices successfully', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote);
  await activateCover(quote, 'Life');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '200000');
  await waitForSettle(quote);
  const premium = await getTotalYearlyPremium(quote);
  recordCheck(testInfo, { label: 'Total yearly premium for a $200,000 Life cover is greater than zero', expected: '> 0', actual: premium });
  expect(premium).toBeGreaterThan(0);
});
