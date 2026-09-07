// Occupational Codes in the Quote Screen — acceptance-criteria mode (Jira ACB-6504).
// Source: docs/user-stories/User Story - Occupational Codes.md
//
// Exhaustive standard: positive + negative/absence + value-level via recordCheck.
// Probe 2026-09-07: the quote screen has BOTH an Occupation NAME typeahead ("Select an option")
// AND the Occupation Code dropdown [AM/AA/A1/A2/B/C/S/U/IC]. Many eligibility ACs key off the
// occupation CODE risk-class, which we CAN drive via that dropdown. ACs that require a specific
// NAMED occupation (Personal Trainer / Sharemilker / Home Duties, etc.) are deferred with evidence.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote, setMinimumPersonalDetails, setAge, setGender, activateCover, fillCalcMask, sumInsuredInput,
  getVisibleErrors, clickApply, waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

const errText = (page) => getVisibleErrors(page).then((x) => x.join(' | '));
async function setOccCode(page, label) {
  await page.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label });
  await waitForSettle(page, 1500);
}
// Fresh quote with age/gender set but occupation code chosen explicitly per test.
async function freshQuote(page, { age = 40, gender = 'Male', employmentStatus, income } = {}) {
  const quote = await openNewQuote(page);
  await setAge(quote, age);
  await setGender(quote, gender);
  if (employmentStatus || income) {
    // reuse setMinimumPersonalDetails only for employment/income wiring on disability tests
  }
  return quote;
}

test.describe('Occupational Codes in the Quote Screen (ACB-6504)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02/AC03/AC04: Occupation dropdown + code dropdown present; code list is the documented risk classes', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01/AC02: the Occupation control offers a searchable list; AC04: selecting an occupation populates the Code (and disables it). Business Rule: valid Code values are AA/AM/A1/A2/B/C/S/U/IC.',
      '', 'Steps to reproduce:', '1. New quote. 2. Confirm the Occupation typeahead ("Select an option") is present and the Code dropdown lists the documented risk classes.',
      '', 'Expected: Occupation typeahead present; Code dropdown = [AM, AA, A1, A2, B, C, S, U, IC].',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    const controls = await quote.evaluate(() => {
      const code = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return {
        codeOptions: code ? [...code.options].map((o) => o.text.trim()).filter(Boolean) : null,
        hasTypeahead: !!document.querySelector('[placeholder="Select an option"], .vscomp-toggle-button'),
      };
    });
    recordCheck(testInfo, { label: 'Occupation typeahead present', expected: true, actual: controls.hasTypeahead });
    expect(controls.hasTypeahead, 'AC01/AC02: occupation typeahead present').toBe(true);
    recordCheck(testInfo, { label: 'Occupation Code dropdown risk-class list', expected: 'AM/AA/A1/A2/B/C/S/U/IC', actual: (controls.codeOptions || []).join('/') });
    expect(controls.codeOptions, 'BR: code values').toEqual(['AM', 'AA', 'A1', 'A2', 'B', 'C', 'S', 'U', 'IC']);
  });

  test('AC05: Life quote with ONLY an occupation code (no occupation name) succeeds', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: I can get a quote for Life/Trauma/Cancer/Acd. Death with only the code provided (no occupation name).',
      '', 'Steps to reproduce:', '1. New quote, set ANB/Gender + Occupation Code = AA (no occupation name), activate Life $200k, Apply.',
      '', 'Expected: no "must complete ... Occupation" blocking error (quote proceeds on code alone).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '2' }); // AA
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    const hasOccErr = /must complete.*Occupation|Occupation.*required|enter the value for Occupation/i.test(e);
    recordCheck(testInfo, { label: 'Life quote on code-only (AA) has no occupation-required error', expected: false, actual: hasOccErr });
    expect(hasOccErr, `AC05. Got: ${e.slice(0, 200)}`).toBe(false);
  });

  test('AC08: TPD cover with occupation code U → "This occupation is not eligible"', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: When the occupation has TPD eligibility "U" (code U) and I select TPD cover, Then error "This occupation is not eligible."',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, Occupation Code = U, activate TPD, SI $200k, Apply.',
      '', 'Expected: "This occupation is not eligible" (TPD not available for U).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await setOccCode(quote, 'U');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'TPD + occupation code U raises not-eligible error', expected: 'This occupation is not eligible', actual: e });
    expect(/This occupation is not eligible/i.test(e), `AC08. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC11: TPD cover with occupation code IC → Individual-Consideration underwriting message', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: When TPD eligibility is "IC" (code IC) and I select TPD cover, Then error "Please contact underwriting as this Occupation requires Individual Consideration".',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, Occupation Code = IC, activate TPD, SI $200k, Apply.',
      '', 'Expected: the "requires Individual Consideration" underwriting message.',
      'Actual (QA, confirmed 2026-09-07): TPD+IC returns "Please contact underwriting as this Occupation REQUIRED',
      'Individual Consideration" — past-tense typo "required" instead of "requires". Note the Life+IC message (AC12)',
      'correctly says "requires", so the two messages are inconsistent. This assertion is written to the STORY\'s',
      'expected wording ("requires") and is therefore EXPECTED TO FAIL until the TPD message typo is corrected.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await setOccCode(quote, 'IC');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'TPD + code IC raises the Individual-Consideration message', expected: 'requires Individual Consideration', actual: e });
    expect(/requires Individual Consideration/i.test(e), `AC11. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  test('AC31: TPD cover missing Gender/ANB/Occupation → combined "must complete" error', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC31: When I select TPD and enter SI without Gender/ANB/Occupation, Then error "You must complete the following fields - Gender, Age Next Birthday & Occupation/Occupation Code".',
      '', 'Steps to reproduce:', '1. New quote (do NOT set Gender/ANB/Occupation). 2. Activate TPD, SI $200k, Apply.',
      '', 'Expected: the combined missing-fields error naming Gender, Age Next Birthday & Occupation.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    // Deliberately no personal details.
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'TPD missing Gender/ANB/Occupation combined error', expected: 'must complete ... Gender, Age Next Birthday & Occupation', actual: e });
    expect(/complete the following fields.*Gender.*Age Next Birthday.*Occupation/i.test(e), `AC31. Got: ${e.slice(0, 250)}`).toBe(true);
  });

  test('AC12: Life cover with occupation code IC → Individual-Consideration underwriting message', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: When Life code is "IC" and I select Life cover, Then "Please contact underwriting as this Occupation requires Individual Consideration".',
      '', 'Steps to reproduce:', '1. New quote, ANB 40, Occupation Code = IC, activate Life $200k, Apply.',
      '', 'Expected: the Individual-Consideration message.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await setOccCode(quote, 'IC');
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const e = await errText(quote);
    recordCheck(testInfo, { label: 'Life + code IC raises the Individual-Consideration message', expected: 'requires Individual Consideration', actual: e });
    expect(/requires Individual Consideration/i.test(e), `AC12. Got: ${e.slice(0, 200)}`).toBe(true);
  });

  // ── Deferred ACs (documented, not silently omitted) ──
  test('AC06/AC07/AC33/AC34/AC35/AC36/AC37/AC38 + AC09/AC010/AC13-AC26: named-occupation & backend-mapping eligibility rules', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['Occupation-loading premium effects (AC06), L400 code submission (AC07), and the many named-occupation-specific rules (Personal Trainer 5yr benefit period AC33/34, Home Duties employment-status AC17, Sharemilker, occupation-loading value AC06) plus the M/A/S/IP-code eligibility variants that require SELECTING A NAMED OCCUPATION rather than a bare risk-class code.'].join('\n') });
    test.fixme(true, 'Deferred: these require selecting a SPECIFIC NAMED occupation from the typeahead (e.g. "Personal Trainer/Fitness Instructor - Established", "Sharemilker", "Home Duties") to trigger the M/A/S/IP-specific eligibility + loading rules, OR assert a pricing-engine loading VALUE (AC06) / L400 backend submission (AC07). The single-letter Occupation Code dropdown (AA/AM/.../IC) drives the U and IC eligibility branches (encoded above as AC08/AC11/AC12), but not the name-specific M/A/S branches or the loading %/backend. Encode in a focused follow-up that selects named occupations via the typeahead and confirms each name maps to its documented code/eligibility, once a reference list of names->codes is available to derive expected values.');
  });
  test('AC27/AC28/AC29: occupation-code-change premium-change warning popup (Yes/No)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC27: changing the occupation to one with a different code that changes the premium shows a warning popup "The occupation description that you have selected will result in premium change(s). Do you wish to continue?" with Yes/No. AC28 Yes recalculates; AC29 No reverts.'].join('\n') });
    test.fixme(true, 'Deferred: the premium-change warning popup is triggered by selecting an occupation NAME whose code differs from a previously-code-only-priced cover (AC27 explicitly: "selected an occupation code ... then select an occupation with a different code that triggers a premium change"). Reliably triggering it needs two named occupations with a known premium-affecting code delta; encode in the same named-occupation follow-up.');
  });
});
