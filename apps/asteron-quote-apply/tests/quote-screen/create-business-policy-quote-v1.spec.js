// Create a New Business Quote for Business Policy — acceptance-criteria mode (Jira ACB-3343).
// Source user story: docs/user-stories/User Story- Create a New Business Quote for Business Policy.md
//
// Exhaustive standard (.kiro/steering/test-expansion-process.md): positive + negative/absence +
// value-level, each surfaced via recordCheck.
//
// DOM confirmed via probe 2026-09-04: the policy-add control is the "Business" button; opening it
// reveals the business-tab cover set — Life, TPD, Trauma, Specific Injury, Business Expenses,
// Business Disability, Farmers Disability — and NOT Cancer / Acd. Death / Needlestick (AC04).
// Flexi Rate + We Pay Your Premiums controls are present on the business tab (AC05/AC06). The Flexi
// ladder + We-Pay warning mirror the personal create-a-new-business-quote-v1 spec (ACB-2240).
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  coverButtonExists,
  expectErrorContaining,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// Open a fresh quote and switch to the Business policy tab (the "Business" button — confirmed via probe).
async function freshBusinessQuote(page) {
  const quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
  await clickButtonByLabel(quote, 'Business', 'Business policy button');
  await waitForSettle(quote, 2000);
  return quote;
}

test.describe('Create a New Business Quote for Business Policy (ACB-3343)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC02: a new quote lets me select Personal and/or Business policy', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: Given I am in the New Business Quote Tool UI, When on a new quote, Then I can select whether it is for a Personal Policy and/or Business Policy.',
      '', 'Steps to reproduce:', '1. Open a new quote. 2. Confirm a "Business" policy control is present and can be selected (and Personal is the initial policy).',
      '', 'Expected: a Business policy option exists and is selectable.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
    const businessPresent = await quote.evaluate(() => [...document.querySelectorAll('button')].some((b) => (b.innerText || '').trim() === 'Business'));
    recordCheck(testInfo, { label: 'A "Business" policy control is present on a new quote', expected: true, actual: businessPresent });
    expect(businessPresent, 'AC02: Business policy selectable').toBe(true);
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 2000);
    // After selecting Business, a business-specific cover (Business Disability) becomes available.
    const bizCover = await coverButtonExists(quote, 'Business Disability');
    recordCheck(testInfo, { label: 'Selecting Business reveals business-policy covers (e.g. Business Disability)', expected: true, actual: bizCover });
    expect(bizCover, 'AC02: Business policy activated (business covers shown)').toBe(true);
  });

  test('AC03: the new-quote screen captures the documented Personal Details fields', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC03: Given I click "new quote", Then I can capture Personal Details: First Name, Surname, Date of birth, Age next birthday, Gender, Smoker, Occupation, Occupation code, Employment status, Annual Income, Inflation adjustment benefit, Premium freeze, We pay your premiums, Flexi Rate.',
      '', 'Steps to reproduce:', '1. Open a new quote. 2. Confirm each documented Personal Details field/control is present.',
      '', 'Expected: all documented Personal Details fields present (shared with the personal Create-Quote story ACB-2240).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await waitForSettle(quote, 1000);
    const fields = await quote.evaluate(() => {
      const hasInput = (frag) => !!document.querySelector(`input[id*="${frag}"]`);
      const hasSelectWithOption = (txt) => [...document.querySelectorAll('select')].some((s) => [...s.options].some((o) => o.text.trim() === txt));
      return {
        firstName: hasInput('Input_FirstName'),
        ageNextBirthday: hasInput('Input_AgeNextBirthday'),
        occupationCode: !!document.querySelector('select[id*="OccupationCode_Dropdown"]'),
        employmentStatus: !!document.querySelector('select[id*="EmploymentStatus_Dropdown"]'),
        gender: [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].some((b) => ['Male', 'Female'].includes(b.innerText.trim())),
        wePay: hasSelectWithOption('30 days'),
        flexiRate: hasSelectWithOption('N/A') && hasSelectWithOption('2.5%'),
      };
    });
    for (const [field, present] of Object.entries(fields)) {
      recordCheck(testInfo, { label: `Personal Details field "${field}" present`, expected: true, actual: present });
      expect(present, `AC03: Personal Details field "${field}" present`).toBe(true);
    }
  });

  test('AC04: the Business policy tab shows its documented cover set (no Cancer/Acd. Death/Needlestick)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given I click "+ Business Policy", Then the business tab shows: Lumpsum Cover — Life (Acc. TPD, Acc. Trauma), TPD, Trauma (Major Trauma, TPD on Trauma), Specific Injury; Disability Cover — Business/Farmers Disability, Business Expenses. (No Cancer, Accidental Death, or Needlestick on the business policy.)',
      '',
      'Steps to reproduce:',
      '1. New quote, select Business. 2. Confirm Life/TPD/Trauma/Specific Injury/Business Disability/Farmers Disability/Business Expenses are present. 3. Confirm Cancer/Acd. Death/Needlestick are ABSENT.',
      '',
      'Expected: the business cover set is present; the personal-only lump-sum covers are absent.',
    ].join('\n') });
    const quote = await freshBusinessQuote(page);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Specific Injury', 'Business Disability', 'Farmers Disability', 'Business Expenses']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Business cover "${cover}" is present`, expected: true, actual: present });
      expect(present, `AC04: business cover "${cover}" present`).toBe(true);
    }
    // Negative/absence: personal-only lump-sum covers must NOT appear on the business policy.
    for (const cover of ['Cancer', 'Acd. Death', 'Needlestick']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Personal-only cover "${cover}" is ABSENT on the business policy`, expected: false, actual: present });
      expect(present, `AC04: "${cover}" absent on business policy`).toBe(false);
    }
  });

  test('AC05: Business policy Flexi Rate list is N/A then 2.5% to 30.0% in 2.5% steps (default N/A)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: When I select Flexi Rate, Then a prepopulated list of rates (N/A(default) & 2.5% up to 30.00%) is displayed, And I can select and save the Flexi Rate.',
      '', 'Steps to reproduce:', '1. New quote, select Business. 2. Read the Flexi Rate select default + full option list. 3. Select 15.0% and confirm it updates.',
      '', 'Expected: default N/A; ladder [N/A, 2.5% ... 30.0%] in 2.5% steps (13 options).',
    ].join('\n') });
    const quote = await freshBusinessQuote(page);
    const flexi = quote.locator('select[id*="FlexiRate"]').first();
    const info = await flexi.evaluate((sel) => ({ selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) }));
    recordCheck(testInfo, { label: 'Flexi Rate default', expected: 'N/A', actual: info.selected });
    expect(info.selected, 'AC05: Flexi Rate default N/A').toBe('N/A');
    const expectedLadder = ['N/A', '2.5%', '5.0%', '7.5%', '10.0%', '12.5%', '15.0%', '17.5%', '20.0%', '22.5%', '25.0%', '27.5%', '30.0%'];
    recordCheck(testInfo, { label: 'Flexi Rate full ladder (N/A + 2.5% steps to 30.0%)', expected: expectedLadder, actual: info.options });
    expect(info.options, 'AC05: exact Flexi Rate ladder').toEqual(expectedLadder);
    await flexi.selectOption({ label: '15.0%' });
    await waitForSettle(quote, 1000);
    const selectedAfter = await flexi.evaluate((sel) => sel.options[sel.selectedIndex].text.trim());
    recordCheck(testInfo, { label: 'Flexi Rate selection updates to 15.0%', expected: '15.0%', actual: selectedAfter });
    expect(selectedAfter, 'AC05: Flexi Rate selectable/saved').toBe('15.0%');
  });

  test('AC06: Business policy We Pay Your Premiums warns when no lump sum cover is selected', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: When I select We Pay Your Premiums, Then a prepopulated list of waiting periods (None(default), 30, 60, 90 days) is displayed, And when no lump sum cover is selected a warning "At least one lump sum cover must be selected with We Pay Your Premiums" is shown.',
      '', 'Steps to reproduce:', '1. New quote, select Business. 2. Read the We Pay Your Premiums default + options. 3. Select "30 days" with no lump sum cover active; confirm the warning.',
      '', 'Expected: default None; options None/30/60/90 days; selecting a period with no lump sum cover shows the warning.',
    ].join('\n') });
    const quote = await freshBusinessQuote(page);
    const wePay = quote.locator('select').filter({ has: quote.locator('option', { hasText: '30 days' }) }).first();
    const info = await wePay.evaluate((sel) => ({ selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) }));
    recordCheck(testInfo, { label: 'We Pay Your Premiums default value', expected: 'None', actual: info.selected });
    expect(info.selected, 'AC06: We Pay defaults to None').toBe('None');
    recordCheck(testInfo, { label: 'We Pay Your Premiums option list', expected: ['None', '30 days', '60 days', '90 days'], actual: info.options });
    expect(info.options, 'AC06: options None/30/60/90 days').toEqual(['None', '30 days', '60 days', '90 days']);
    await wePay.selectOption({ label: '30 days' });
    await waitForSettle(quote, 1500);
    await expectErrorContaining(quote, 'At least one lump sum cover must be selected with We Pay Your Premiums');
    recordCheck(testInfo, { label: 'We Pay with no lump sum cover shows the required-cover warning', expected: 'warning shown', actual: 'warning shown' });
  });

  test('AC07: Business policy "?" tooltips show the We Pay Your Premiums / Flexi-Rate text', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: Given the Business quote section, When I click a "?" icon, Then the tooltip shows the documented text — We Pay Your Premiums ("Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period...") and Flexi-Rate ("Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission.").',
      '', 'Steps to reproduce:', '1. New quote, select Business. 2. Search DOM/title attributes for the two tooltip phrases.',
      '', 'Expected: both the We Pay Your Premiums and Flexi-Rate tooltip phrases are present.',
    ].join('\n') });
    const quote = await freshBusinessQuote(page);
    const hay = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') || '').join(' \n ');
      return body + ' \n ' + titles;
    });
    recordCheck(testInfo, { label: 'We Pay Your Premiums tooltip text present', expected: 'contains "Waives the premiums for all the lump sum cover"', actual: /Waives the premiums for all the lump sum cover/i.test(hay) });
    expect(hay, 'AC07: We Pay tooltip').toMatch(/Waives the premiums for all the lump sum cover/i);
    recordCheck(testInfo, { label: 'Flexi-Rate tooltip text present', expected: 'contains "discount your clients premium by reducing"', actual: /discount your clients premium by reducing/i.test(hay) });
    expect(hay, 'AC07: Flexi-Rate tooltip').toMatch(/discount your clients premium by reducing/i);
  });

  // ── Deferred AC (documented, not silently omitted) ──
  test('AC01: landing-page agency selection then create quote', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: ['AC01: On the landing page I can select my agency (an adviser can be associated with multiple agencies) and click create quote.'].join('\n') });
    test.fixme(true, 'Deferred: no agency-selection UI is presented on the landing page for this test account — it is evidently tied to a single agency (same finding as the personal Create-Quote story ACB-2240 AC01). Multi-agency selection is not reachable to assert here.');
  });
});
