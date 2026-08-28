// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/lump-sum-covers/page.md
//           + personal-details/page.md
// Source user story: docs/user-stories/User Story- Lump Sum Life Cover.md (Jira ACB-2242)
// Acceptance-criteria mode — the story's expected values are the source of truth; a mismatch
// is a candidate defect, not "not built".
//
// Generated for the same Quote & Apply screen we have already reverse-engineered, reusing the
// existing helpers (quote-helpers.js). Live verification = running this spec via the edge config.
//
// Independent AC checks run in parallel (each opens its own fresh quote). Deferred ACs (controls
// not yet in helpers, or special state) are listed in the test-doc matrix, not silently dropped.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  setAge,
  activateCover,
  coverButtonExists,
  removeAllCoverCards,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
  getVisibleErrors,
  clickApply,
  waitForSettle,
  getInflationAdjustmentChecked,
  getPremiumFreezeChecked,
  setPremiumFreeze,
  getPremiumStructure,
  setPremiumStructure,
} = require('../../helpers/quote-helpers');

async function freshLifeQuote(page, personal) {
  return test.step('open a fresh quote + activate Life', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, personal || { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    return quote;
  });
}

test.describe('Lump Sum Life Cover', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02: Life cover is available to apply for in a new Personal quote', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser or Adviser staff, When I am creating a new quote, Then I should be provided the ability to apply for lump sum cover in the quote.',
      'AC02: Given I am in the Lump Sum Cover section, When I am creating a new business quote for Personal insurance, Then I am able to see the Life lump sum cover.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote (Personal).',
      '2. Look for the Life cover button in the Lump Sum section.',
      '',
      'Expected: a "Life" cover button is present and can be activated.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    expect(await coverButtonExists(quote, 'Life'), 'AC02: Life cover button present').toBe(true);
    await activateCover(quote, 'Life');
    expect(await sumInsuredInput(quote, 0).isVisible(), 'AC01: activating Life exposes a Sum Insured field').toBe(true);
  });

  test('AC03: Selecting Life exposes Sum Insured, auto-ticks Inflation, defaults Premium Structure to Stepped', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given I am in the lump sum cover section, When I select Life, Then I must be able to enter the Sum Insured (digits only), And "Inflation adjustment" should be auto-ticked, And the premium structure dropdown must be pre-populated and defaulted to Stepped.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Life.',
      '2. Check the Sum Insured field is present.',
      '3. Check the Inflation Adjustment checkbox is ticked by default.',
      '4. Check the Premium Structure dropdown default value is Stepped.',
      '',
      'Expected: SI field present; Inflation auto-ticked; Premium Structure = Stepped.',
    ].join('\n') });
    const quote = await freshLifeQuote(page);
    expect(await sumInsuredInput(quote, 0).isVisible(), 'AC03: Sum Insured field present').toBe(true);
    const inflationChecked = await getInflationAdjustmentChecked(quote);
    expect(inflationChecked, 'AC03: Inflation Adjustment auto-ticked').toBe(true);
    const structureDefault = await getPremiumStructure(quote);
    expect(structureDefault, 'AC03: Premium Structure defaults to Stepped').toBe('Stepped');
  });

  test('AC05: Entering Sum Insured calculates and displays a premium', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: Given AC04, When I enter a Sum Insured amount, Then premium should be calculated and displayed, And the total premium for all lives should be displayed in the Premium section.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Life.',
      '2. Enter a Sum Insured of $500,000.',
      '3. Read the Total Yearly Premium.',
      '',
      'Expected: a premium > 0 is calculated and shown.',
    ].join('\n') });
    const quote = await freshLifeQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    const premium = await getTotalYearlyPremium(quote);
    expect(premium, 'AC05: premium calculated and > 0').toBeGreaterThan(0);
  });

  test('AC06: A cover can be added and removed, with premium reflecting the change', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: Given I am in the quote screen, When I have selected the cover type, Then I must be able to add or remove the cover type, And view the premium changes.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Life, enter SI $500,000 (premium > 0).',
      '2. Remove the cover.',
      '3. Confirm the premium is cleared/zeroed.',
      '',
      'Expected: adding produces a premium; removing clears it.',
    ].join('\n') });
    const quote = await freshLifeQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    expect(await getTotalYearlyPremium(quote), 'AC06: premium after add').toBeGreaterThan(0);
    await removeAllCoverCards(quote);
    const after = await getTotalYearlyPremium(quote);
    expect(after === null || after === 0, 'AC06: premium cleared after remove').toBe(true);
  });

  test('AC07: Stepped, Age Next Birthday outside 11-75 → age-range error on Apply', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given I enter SI and select "Stepped", When Age Next Birthday is not between 11 and 75 and I click Apply, Then error "Age Next Birthday must be between 11 and 75" is displayed.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, set Age Next Birthday = 76, activate Life, enter SI $100,000, Premium Structure = Stepped.',
      '2. Click Apply.',
      '',
      'Expected: error containing "Age Next Birthday must be between 11 and 75".',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 76, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '100000');
    await clickApply(quote);
    const errors = await getVisibleErrors(quote);
    expect(errors.some((e) => /Age Next Birthday must be between 11 and 75/i.test(e)), 'AC07: age-range error').toBe(true);
  });

  // AC08-AC14: Level-to structures each have a max Age Next Birthday. Data-driven.
  const levelCaps = [
    { ac: 'AC08', label: 'Level to 50', over: 46, msgCore: ['level to 50', 'Life Cover', 'is 45'] },
    { ac: 'AC09', label: 'Level to 60', over: 56, msgCore: ['level to 60', 'Life Cover', 'is 55'] },
    { ac: 'AC10', label: 'Level to 65', over: 61, msgCore: ['level to 65', 'Life Cover', 'is 60'] },
    { ac: 'AC11', label: 'Level to 70', over: 66, msgCore: ['level to 70', 'Life Cover', 'is 65'] },
    { ac: 'AC12', label: 'Level to 75', over: 71, msgCore: ['level to 75', 'Life Cover', 'is 70'] },
    { ac: 'AC13', label: 'Level to 80', over: 71, msgCore: ['level to 80', 'Life Cover', 'is 70'] },
    { ac: 'AC14', label: 'Level to 100', over: 76, msgCore: ['level to 100', 'Life Cover', 'is 75'] },
  ];
  for (const c of levelCaps) {
    test(`${c.ac}: ${c.label} max age → error on Apply above cap`, async ({ page }) => {
      test.info().annotations.push({ type: 'acceptance-criteria', description: [
        `${c.ac}: Given I enter SI and select "${c.label}", When age next birthday is above the maximum and I click Apply, Then an error identifying the ${c.label} maximum age is displayed.`,
        '',
        'Steps to reproduce:',
        `1. Open a new quote, set Age Next Birthday = ${c.over}, activate Life, enter SI $100,000.`,
        `2. Set Premium Structure = ${c.label}.`,
        '3. Click Apply.',
        '',
        `Expected: error containing "${c.msgCore.join(' ... ')}".`,
        '(Note: AC13 states Level to 80 max is 70 — flagged as possibly copy-paste-suspicious in the source; asserted as written.)',
      ].join('\n') });
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: c.over, gender: 'Male', occupationCode: '1' });
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), '100000');
      await setPremiumStructure(quote, c.label);
      await clickApply(quote);
      const errors = await getVisibleErrors(quote);
      const joined = errors.join(' | ');
      const matched = c.msgCore.every((frag) => new RegExp(frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(joined));
      expect(matched, `${c.ac}: expected ${c.label} max-age error. Got: ${joined.slice(0, 200)}`).toBe(true);
    });
  }

  test('AC15: Any Level + Age Next Birthday < 17 → minimum-age error', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given I enter SI and select any Level, When age next birthday is less than 17 and I click Apply, Then error "Minimum Age Next Birthday for level \'Life Cover\' is 17" is displayed.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, set Age Next Birthday = 16, activate Life, enter SI $40,000.',
      '2. Set Premium Structure = Level to 100.',
      '3. Click Apply.',
      '',
      'Expected: error containing "Minimum Age Next Birthday for level" ... "Life Cover" ... "is 17".',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 16, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '40000');
    await setPremiumStructure(quote, 'Level to 100');
    await clickApply(quote);
    const errors = await getVisibleErrors(quote).then((es) => es.join(' | '));
    const matched = /Minimum Age Next Birthday for level/i.test(errors) && /Life Cover/i.test(errors) && /is 17/i.test(errors);
    expect(matched, `AC15: expected min-age error. Got: ${errors.slice(0, 200)}`).toBe(true);
  });

  test('AC16: Stepped + SI > $50,000 + Age Next Birthday 11-16 → under-17 cap error', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16: Given I enter SI and select "Stepped", When SI is more than 50,000 and age next birthday is between 11 and 16, Then error "The Maximum \'Life Cover\' sum insurable for clients under Age Next Birthday 17 is $50,000" is displayed.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, set Age Next Birthday = 14, activate Life (Stepped default).',
      '2. Enter SI $50,001.',
      '3. Click Apply (or read the immediate cap error).',
      '',
      'Expected: error containing "Life Cover" ... "under Age Next Birthday 17 is $50,000".',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 14, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '50001');
    await clickApply(quote);
    const errors = await getVisibleErrors(quote).then((es) => es.join(' | '));
    const matched = /Life Cover/i.test(errors) && /under Age Next Birthday 17 is \$?50,?000/i.test(errors);
    expect(matched, `AC16: expected under-17 $50k cap error. Got: ${errors.slice(0, 200)}`).toBe(true);
  });

  test('AC19: Calculated yearly premium < $240 → minimum-premium error on Apply', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19: Given I enter all details for a Life cover, When calculated yearly premium is less than 240.00 and I click Apply, Then error "The minimum premium is $240.00 per year per life insured" is displayed.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote (Age 35), activate Life, enter a very low SI ($1,000) so premium < $240.',
      '2. Click Apply.',
      '',
      'Expected: error containing "minimum premium is $240.00".',
    ].join('\n') });
    const quote = await freshLifeQuote(page);
    await fillCalcMask(sumInsuredInput(quote, 0), '1000');
    await clickApply(quote);
    const errors = await getVisibleErrors(quote).then((es) => es.join(' | '));
    expect(/minimum premium is \$?240\.00/i.test(errors), `AC19: expected min-premium error. Got: ${errors.slice(0, 200)}`).toBe(true);
  });

  test('AC21: Selecting Premium Freeze auto-unticks Inflation Adjustment (mutual exclusion)', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC21: Given I want to apply lump sum Life cover, When I choose premium freeze (checkbox), Then the inflation adjustment benefit checkbox should be unchecked (only one may be selected).',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Life (Inflation auto-ticked).',
      '2. Tick the Premium Freeze checkbox.',
      '3. Check the Inflation Adjustment checkbox.',
      '',
      'Expected: Inflation Adjustment becomes unchecked when Premium Freeze is ticked.',
    ].join('\n') });
    const quote = await freshLifeQuote(page);
    // Precondition: Inflation is auto-ticked. Tick Premium Freeze, then verify Inflation flips off.
    expect(await getInflationAdjustmentChecked(quote), 'AC21 precondition: Inflation ticked on activation').toBe(true);
    await setPremiumFreeze(quote);
    const inflationChecked = await getInflationAdjustmentChecked(quote);
    expect(inflationChecked, 'AC21: Inflation auto-unticked when Premium Freeze selected').toBe(false);
  });

  test('AC23: Maximum 3 Life covers — Life button disabled after 3', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC23: Given I want to apply Life cover, When I click the Life button, Then I must be able to enter SI for Life cover and select a maximum of 3 Life covers. And: Given I am in the quote screen, When 3 Life covers are selected, Then the Life button should be disabled (maximum 3).',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Activate Life three times (filling each SI so the next can be added).',
      '3. Check whether the Life button is disabled after the 3rd.',
      '',
      'Expected: after 3 Life covers, the Life button is disabled.',
      '(Note: may conflict with existing reverse-engineered LSC-39 behaviour — asserted to the story.)',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    for (let i = 0; i < 3; i++) {
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, i), String(100000 + i * 10000)).catch(() => {});
    }
    const lifeDisabled = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Life');
      if (!btn) return null;
      return btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.className.toLowerCase().includes('disabled');
    });
    expect(lifeDisabled, 'AC23: Life button disabled after 3 covers').toBe(true);
  });

});
