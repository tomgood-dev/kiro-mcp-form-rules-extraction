// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/{personal-details,
// lump-sum-covers,disability-covers,kids-cover-and-multi-life,policy-structure,
// premium-and-bundling,validation-and-navigation}/page.md
// Source user story: docs/user-stories/User Story- Create a New Business Quote.md (Jira ACB-2240)
// Acceptance-criteria mode — story values are the source of truth; a mismatch is a candidate defect.
//
// Generated from the user story using accumulated app context (helpers + PD-/LSC-/DC-/KID-/
// POL-/PREM- business rules) plus a targeted recon probe for items not already confirmed
// (see generation-log-2026-09-01T09-11.md and probe-create-new-business-quote-recon.js).
// All checks are independent (each opens its own fresh quote) — no shared-state mutation,
// so everything runs in one parallel describe block, unlike select-default-commission-
// category-v1.spec.js which needed a separate serial block for its Update-button test.
//
// KNOWN ENVIRONMENT CAVEAT: this app has a documented, still-open issue where clicking Apply
// does not reliably complete even on a fully-valid config (see validation-and-navigation/
// page.md's callout). Any check below that hinges on Apply's success/failure signal notes
// this caveat inline rather than silently trusting a clean result.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setAge,
  setGender,
  setMinimumPersonalDetails,
  setOccupation,
  activateCover,
  coverButtonExists,
  removeAllCoverCards,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  isOnClientSummary,
  getCheckboxStateByLabel,
  getPremiumStructure,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { clickButtonByLabel, selectFromTypeahead } = require('../../helpers/outsystems-generic-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

/** Reads the Occupation type-ahead's current displayed text (closed-state trigger label). */
async function getOccupationTypeaheadText(page) {
  return page.getByRole('combobox', { name: 'Select an option' }).innerText();
}

/** Reads the Occupation Code native select's {value, text}. */
async function getOccupationCode(page) {
  return page.evaluate(() => {
    const sel = document.querySelector('select[id*="OccupationCode_Dropdown"]');
    if (!sel) return null;
    return { value: sel.value, text: sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text.trim() : null, disabled: sel.disabled };
  });
}

test.describe('Create a New Business Quote (ACB-2240)', () => {
  test.describe.configure({ mode: 'parallel' });

  // ── AC01: blocked — no agency-selection UI found on the landing page ──
  // NOTE: uses the inline conditional test.fixme(true, reason) form, not test.fixme(title, fn).
  // The static 2-arg form never executes its body at all, so a test.info().annotations.push()
  // call inside it is dead code — the reason was structurally unrecoverable from any test run.
  // Confirmed empirically 2026-09-02; see .kiro/steering/test-expansion-process.md's AC
  // annotation convention section for the full explanation. This form is now the only correct
  // way to write a blocked/deferred AC — the reason ends up in report.md's "Skipped / Blocked
  // Tests — Detail" section instead of being lost.
  test('AC01: Landing page — select agency, then click create quote', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC01: Given I am an Adviser/Adviser staff, When I am in the landing page, Then I should be able to select my agency (one adviser can be associated with multiple agencies) And click create quote.',
      '',
      'Steps to reproduce:',
      '1. Log in, navigate to the Quote & Apply landing page (/QuoteAndApply/).',
      '2. Look for an agency-selection control.',
      '3. Select an agency, then click "New Quote"/create quote.',
      '',
      'Expected: an agency picker is present and selectable before creating a quote.',
      'Blocked: probed live (2026-09-01) — the landing "Quotes and Applications" dashboard exposes',
      'only a Status filter and a page-size selector (10/20/50/100); no agency-selection control of',
      'any kind was found. "New Quote" proceeds directly to a blank quote with no agency-picker step.',
      'This test account is evidently tied to a single agency, or the picker only appears for a',
      'genuinely multi-agency adviser account, which this one is not — see generation-log for the',
      'full landing-page DOM dump.',
    ].join('\n') });
    test.fixme(true, 'No agency-selection UI found on the landing page — this test account is evidently tied to a single agency. See generation-log for the full landing-page DOM dump.');
  });

  test('AC02: select Personal and/or Business Policy on a new quote', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC02: Given I am an Adviser/Adviser staff, When I am in the New Business Quote Tool UI, Then I should be able to select if the new quote/application is for a Personal Policy and/or Business Policy.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Click "Personal" — confirm a Personal policy panel appears.',
      '3. Click "Business" — confirm a Business policy panel ALSO appears (both selectable, per Business Rule #5).',
      '',
      'Expected: both Personal and Business policy options are selectable, and both can coexist.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    const policiesTextBefore = await quote.evaluate(() => document.body.innerText.includes('Personal 1'));
    recordCheck(testInfo, { label: 'Personal policy exists by default on a new quote', expected: true, actual: policiesTextBefore });
    expect(policiesTextBefore, 'AC02: Personal policy exists by default on a new quote').toBe(true);
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 1000);
    const hasBoth = await quote.evaluate(() => document.body.innerText.includes('Personal 1') && document.body.innerText.includes('Business 1'));
    recordCheck(testInfo, { label: 'Both Personal and Business policies coexist', expected: true, actual: hasBoth });
    expect(hasBoth, 'AC02/BR-005: both Personal and Business policies coexist').toBe(true);
  });

  // ── AC04, split into 3 sections per the parsing note in the generation log ──
  test('AC04a: Personal Details fields are present on the new quote screen', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: Given I click on "new quote", Then I should be presented with a UI screen where I can capture Personal Details: First Name, Surname, Date of birth, Age next birthday, Gender, Smoker, Occupation, Occupation code, Employment status, Annual Income, Inflation adjustment benefit, Premium freeze, We pay your premiums, Flexi Rate.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Check each Personal Details field/control is present.',
      '',
      'Expected: all listed Personal Details fields are present on screen.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    const fields = await quote.evaluate(() => {
      const hasInput = (idPart) => !!document.querySelector(`input[id*="${idPart}"]`);
      const hasSelectWithOption = (optText) => [...document.querySelectorAll('select')].some((s) => [...s.options].some((o) => o.text.trim() === optText));
      return {
        firstName: hasInput('Input_FirstName'),
        surname: hasInput('Input_LastName') || hasInput('Input_Surname'),
        dob: !!document.querySelector('input[type="date"]'),
        ageNextBirthday: hasInput('Input_AgeNextBirthday'),
        gender: [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].some((b) => b.innerText.trim() === 'Male'),
        smoker: [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].some((b) => b.innerText.trim() === 'No'),
        occupationTypeahead: document.body.innerText.includes('Occupation'),
        occupationCode: hasSelectWithOption('AA'),
        employmentStatus: hasSelectWithOption('Employed'),
        annualIncome: hasInput('MaskedInput'),
        inflationAdjustment: !!document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]'),
        premiumFreeze: !!document.querySelector('input[id*="Checkbox_PremiumFreeze"]'),
        wePayYourPremiums: hasSelectWithOption('30 days'),
        flexiRate: hasSelectWithOption('N/A') && hasSelectWithOption('2.5%'),
      };
    });
    for (const [field, present] of Object.entries(fields)) {
      recordCheck(testInfo, { label: `Personal Details field "${field}" present`, expected: true, actual: present });
      expect(present, `AC04: Personal Details field "${field}" present`).toBe(true);
    }
  });

  test('AC04b: Lump Sum Cover types and sub-covers are present (Personal policy)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: ...Lumpsum Cover (Personal): Life (TI Support, Acc. TPD, Acc. Trauma, Acc. Cancer), TPD, Trauma (Early Trauma, Trauma Reinstatement OR Continuous trauma, Major Trauma, TPD on Trauma), Cancer, Accidental Death, Needlestick, Specific Injury.',
      '',
      'Steps to reproduce:',
      '1. Open a new Personal quote.',
      '2. Check each top-level Lump Sum cover button is present.',
      '3. Activate Life and Trauma; check their listed sub-covers are present.',
      '',
      'Expected: all 7 top-level covers present; Life exposes its 4 sub-covers; Trauma exposes its checkboxes + 2 sub-cover buttons.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    for (const cover of ['Life', 'TPD', 'Trauma', 'Cancer', 'Acd. Death', 'Needlestick', 'Specific Injury']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Top-level cover "${cover}" present`, expected: true, actual: present });
      expect(present, `AC04: top-level cover "${cover}" present`).toBe(true);
    }
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    // AC04a value-level (audit gap): the story lists Inflation Adjustment as auto-ticked. Assert it
    // is CHECKED by default once a Life cover is active (not merely present).
    const inflationTicked = await quote.evaluate(() => {
      const cb = document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]');
      return cb ? cb.checked : null;
    });
    recordCheck(testInfo, { label: 'Inflation Adjustment is auto-ticked by default (Life active)', expected: true, actual: inflationTicked });
    expect(inflationTicked, 'AC04: Inflation Adjustment auto-ticked by default').toBe(true);
    for (const subcover of ['TI Support', 'Acc. TPD', 'Acc. Trauma', 'Acc. Cancer']) {
      const present = await coverButtonExists(quote, subcover);
      recordCheck(testInfo, { label: `Life sub-cover "${subcover}" present`, expected: true, actual: present });
      expect(present, `AC04: Life sub-cover "${subcover}" present`).toBe(true);
    }
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '100000');
    expect(await getCheckboxStateByLabel(quote, 'Early Trauma'), 'AC04: "Early Trauma" checkbox present').not.toBeNull();
    expect(await getCheckboxStateByLabel(quote, 'Trauma Reinstatement'), 'AC04: "Trauma Reinstatement" checkbox present').not.toBeNull();
    expect(await getCheckboxStateByLabel(quote, 'Continuous Trauma'), 'AC04: "Continuous Trauma" checkbox present').not.toBeNull();
    const majorTraumaPresent = await coverButtonExists(quote, 'Major Trauma');
    recordCheck(testInfo, { label: 'Major Trauma sub-cover present', expected: true, actual: majorTraumaPresent });
    expect(majorTraumaPresent, 'AC04: "Major Trauma" sub-cover present').toBe(true);
    const tpdOnTraumaPresent = await coverButtonExists(quote, 'TPD on Trauma');
    recordCheck(testInfo, { label: 'TPD on Trauma sub-cover present', expected: true, actual: tpdOnTraumaPresent });
    expect(tpdOnTraumaPresent, 'AC04: "TPD on Trauma" sub-cover present').toBe(true);
  });

  test('AC04c: Disability Covers and Kids Cover are present', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC04: ...Disability Cover: Mortgage & Living, Income Protection, Workability. Kids Cover.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote with Employment Status set (Disability Covers section).',
      '2. Check each Disability cover button is present.',
      '3. Check the Kids Cover "Number of Kids" control is present.',
      '',
      'Expected: all 3 Disability covers present; Kids Cover control present.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed' });
    for (const cover of ['Mortgage & Living', 'Income Protection', 'Workability']) {
      const present = await coverButtonExists(quote, cover);
      recordCheck(testInfo, { label: `Disability cover "${cover}" present`, expected: true, actual: present });
      expect(present, `AC04: Disability cover "${cover}" present`).toBe(true);
    }
    const numKidsPresent = await quote.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => {
        const opts = [...s.options].map((o) => o.text.trim());
        return opts.length === 10 && opts[0] === '0' && opts[9] === '9';
      });
      return !!sel;
    });
    recordCheck(testInfo, { label: 'Kids Cover "Number of Kids" (0-9) control present', expected: true, actual: numKidsPresent });
    expect(numKidsPresent, 'AC04: Kids Cover "Number of Kids" (0-9) control present').toBe(true);
  });

  test('AC05: entering Date of Birth calculates and displays Age Next Birthday', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC05: When I enter the birthday date, Then the "age next birthday" must be calculated And the age next birthday must be displayed on the screen.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Set Date of birth via the native date input.',
      '3. Read the Age Next Birthday field.',
      '',
      'Expected: Age Next Birthday field is populated with a real value after DOB is set.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    const ageField = quote.locator('input[id*="Input_AgeNextBirthday"]').first();
    await quote.evaluate(() => {
      const el = document.getElementById('b15-Input_BirthDate');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '1990-06-15');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    await waitForSettle(quote);
    const ageValue = await ageField.inputValue();
    recordCheck(testInfo, { label: 'Age Next Birthday populated after DOB set (1990-06-15)', expected: 'non-blank', actual: ageValue });
    await expect(ageField, 'AC05: Age Next Birthday populated after DOB set').not.toHaveValue('');
  });

  test('AC06: selecting Occupation (type-ahead) prepopulates Occupation Code', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC06: When I select \'occupation\', Then a pre-populated list of occupation must be displayed And I must be able to search and select the occupation type, When I have selected the \'occupation\' Then the occupation code must be prepopulated based on the occupation selected.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Search and select an occupation via the type-ahead (e.g. "Civil Engineer").',
      '3. Read the Occupation Code select.',
      '',
      'Expected: Occupation Code is auto-populated (non-blank) and locked, matching the chosen occupation.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await setOccupation(quote, 'Civil Engineer', 'Civil Engineer');
    await waitForSettle(quote, 1500);
    const code = await getOccupationCode(quote);
    expect(code, 'AC06: Occupation Code select present').not.toBeNull();
    recordCheck(testInfo, { label: 'Occupation Code auto-populated after choosing "Civil Engineer"', expected: 'not blank/-1', actual: code.value });
    expect(code.value, 'AC06: Occupation Code auto-populated (not blank/-1)').not.toBe('-1');
    recordCheck(testInfo, { label: 'Occupation Code locked once Occupation chosen via search', expected: true, actual: code.disabled });
    expect(code.disabled, 'AC06: Occupation Code locked once Occupation is chosen via search').toBe(true);
  });

  // Confirmed discrepancy via live probe (2026-09-01) — see generation log. Encoded to the
  // story's expected value; currently FAILS.
  test('AC07: selecting Occupation Code instead prepopulates the Occupation field', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC07: When I choose to select occupation code instead of occupation, Then a pre-populated list of occupation code must be displayed And I must be able to select the occupation code, Then the occupation code must prepopulate the occupation field on screen.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Select Occupation Code = AA directly (native select), without touching the Occupation type-ahead.',
      '3. Read the Occupation type-ahead\'s displayed text.',
      '',
      'Expected: the Occupation field shows a value corresponding to Occupation Code AA (prepopulated).',
      'Actual (confirmed via probe, 2026-09-01): the Occupation type-ahead still shows the placeholder',
      '"Select..." — it is NOT prepopulated. Native selectOption() used (no raw dispatchEvent), so this',
      'is not a probe-technique artifact.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1500);
    const occupationText = await getOccupationTypeaheadText(quote);
    recordCheck(testInfo, { label: 'Occupation field text after selecting Occupation Code = AA', expected: 'a value corresponding to AA (not "Select...")', actual: occupationText });
    expect(occupationText, 'AC07: Occupation field prepopulated after selecting Occupation Code').not.toContain('Select...');
  });

  test('AC08: Employment status offers exactly the 4 documented options', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC08: When I enter the employment status, Then the following list of employment status must be displayed - Employed, Self Employed, Employed by own company, Other - And I must be able to select the employment status.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Read the Employment Status select\'s option list.',
      '',
      'Expected: options include Employed, Self-Employed, Employed by own company, Other (plus a "Select one" placeholder).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    const options = await quote.getByRole('combobox', { name: 'Employment status' }).locator('option').allInnerTexts();
    for (const label of ['Employed', 'Self-Employed', 'Employed by own company', 'Other']) {
      recordCheck(testInfo, { label: `Employment status options include "${label}"`, expected: label, actual: options });
      expect(options, `AC08: Employment status includes "${label}"`).toContain(label);
    }
  });

  test('AC09a: Age/Gender/Occupation missing blocks Apply with the combined message', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: The following fields on screen must be mandatory - Age next birthday, Gender, Smoker, Occupation or Occupation Code, Employment Status.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate a cover, leave Age/Gender/Occupation unset.',
      '2. Click Apply.',
      '',
      'Expected: a combined "must complete the following fields" message listing Gender, Age Next Birthday, and Occupation/Occupation Code.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const ac09aErrors = (await getVisibleErrors(quote)).join(' | ');
    recordCheck(testInfo, { label: 'AC09a: missing Age/Gender/Occupation blocks Apply with the combined "must complete the following fields" message', expected: 'contains "must complete the following fields"', actual: ac09aErrors });
    await expectErrorContaining(quote, 'must complete the following fields');
  });

  test('AC09b: Employment Status left unset on a Life-only quote — informational (Apply-completion caveat applies)', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09 (Employment Status clause): The story states Employment Status is unconditionally mandatory.',
      'Existing business-rules docs (PD-20) establish Employment Status only blocks Apply once a',
      'DISABILITY cover is priced without it - not for a Lump-Sum-only quote. This test checks whether',
      'a Life-only quote with Employment Status left unset can reach Client Summary.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote: Age/Gender/Occupation Code set, Employment Status left unset.',
      '2. Activate Life, enter a valid Sum Insured.',
      '3. Click Apply.',
      '',
      'Expected per story (unconditional mandatory reading): Apply should be blocked.',
      'CAVEAT: this app has a documented, still-open issue where Apply does not reliably complete',
      'even on fully-valid configs (validation-and-navigation/page.md). A "did not proceed" result',
      'here is therefore NOT strong evidence either way about Employment Status specifically - this',
      'test is informational, not a strict pass/fail gate on the AC.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    const proceeded = await isOnClientSummary(quote);
    console.log(`  [info] AC09b informational result: proceeded=${proceeded} (see Apply-completion caveat in annotation)`);
    // Not asserted strictly — see caveat above. Recorded via console log for the report/log,
    // not as a hard expect(), since a false failure here would misattribute a known,
    // unrelated environment issue to this specific AC.
  });

  test('AC09c: Smoker always has a default value (no reachable "unset" state)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09 (Smoker clause): "Smoker" is listed as mandatory.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh quote, before any interaction with the Smoking status control.',
      '2. Read its button-group state.',
      '',
      'Expected/Actual: Smoking status is a button-group that always has a real, pre-selected',
      'default ("No") - there is no reachable blank/unset state to test blocking against via the UI.',
      'This satisfies "mandatory" in the sense that a value is always present, but does not test',
      '"forces an explicit user choice." Flagged as an AC-wording ambiguity (see generation log) -',
      'not encoded as pass/fail, only that a default value is confirmed present.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    const smoking = await quote.evaluate(() => {
      const btns = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].filter((b) => ['Yes', 'No'].includes(b.innerText.trim()));
      return btns.map((b) => ({ text: b.innerText.trim(), selected: b.className.includes('selected') }));
    });
    const hasASelectedOption = smoking.some((b) => b.selected);
    recordCheck(testInfo, { label: 'Smoking status always has a real default value selected', expected: true, actual: hasASelectedOption });
    expect(hasASelectedOption, 'AC09c: Smoking status always has a real default value selected').toBe(true);
  });

  test('AC10: Flexi Rate list runs N/A then 2.5% to 30.00% in 2.5% steps', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC10: When I select Flexi Rate, Then a prepopulated list of rates (2.5% up to 30.00% and default is N/A) must be displayed And I must be able to select and save the Flexi Rate.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote.',
      '2. Read the Flexi Rate select\'s default value and full option list.',
      '3. Select 15% and confirm it is retained.',
      '',
      'Expected: default N/A; options span 2.5% to 30.0% in 2.5% steps (13 total incl. N/A); selection persists.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    const flexiRate = quote.locator('select[id*="FlexiRate"]').first();
    const info = await flexiRate.evaluate((sel) => ({ selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) }));
    recordCheck(testInfo, { label: 'Flexi Rate default value', expected: 'N/A', actual: info.selected });
    expect(info.selected, 'AC10: Flexi Rate defaults to N/A').toBe('N/A');
    recordCheck(testInfo, { label: 'Flexi Rate option count (N/A + 2.5%-30.0% in 2.5% steps)', expected: 13, actual: info.options.length });
    expect(info.options, 'AC10: Flexi Rate spans N/A + 2.5%-30.0% in 2.5% steps (13 options)').toHaveLength(13);
    // Value-level (not just count): assert the EXACT option ladder so a wrong-but-same-length list
    // is caught — first non-N/A = 2.5%, last = 30.0%, and each step is 2.5% (audit gap: previously
    // only the length was checked).
    const expectedLadder = ['N/A', '2.5%', '5.0%', '7.5%', '10.0%', '12.5%', '15.0%', '17.5%', '20.0%', '22.5%', '25.0%', '27.5%', '30.0%'];
    recordCheck(testInfo, { label: 'Flexi Rate first selectable rate is 2.5%', expected: '2.5%', actual: info.options[1] });
    expect(info.options[1], 'AC10: first selectable Flexi Rate is 2.5%').toBe('2.5%');
    recordCheck(testInfo, { label: 'Flexi Rate last rate is 30.0%', expected: '30.0%', actual: info.options.at(-1) });
    expect(info.options.at(-1), 'AC10: last Flexi Rate is 30.0%').toBe('30.0%');
    recordCheck(testInfo, { label: 'Flexi Rate full ladder (N/A + 2.5% steps to 30.0%)', expected: expectedLadder, actual: info.options });
    expect(info.options, 'AC10: exact Flexi Rate ladder (2.5% steps N/A->30.0%)').toEqual(expectedLadder);
    await flexiRate.selectOption({ label: '15.0%' });
    await waitForSettle(quote, 1000);
    const selectedAfter = await flexiRate.evaluate((sel) => sel.options[sel.selectedIndex].text.trim());
    recordCheck(testInfo, { label: 'Flexi Rate selection persists after choosing 15.0%', expected: '15.0%', actual: selectedAfter });
    expect(selectedAfter, 'AC10: selection is retained after choosing 15.0%').toBe('15.0%');
  });

  test('AC11: We Pay Your Premiums warns when no lump sum cover is selected', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC11: When I select We Pay Your Premiums, Then a prepopulated list of waiting periods (None(default), 30, 60, 90 days) must be displayed And I must be able to select And a warning message "At least one lump sum cover must be selected with We Pay Your Premiums" should be displayed.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote with no lump sum cover active.',
      '2. Read the We Pay Your Premiums select\'s default + options.',
      '3. Select "30 days".',
      '',
      'Expected: default None; options None/30/60/90 days; selecting a waiting period with no lump sum',
      'cover active shows "At least one lump sum cover must be selected with We Pay Your Premiums".',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    const wePayDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '30 days' }) }).first();
    const info = await wePayDropdown.evaluate((sel) => ({ selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) }));
    recordCheck(testInfo, { label: 'We Pay Your Premiums default value', expected: 'None', actual: info.selected });
    expect(info.selected, 'AC11: We Pay Your Premiums defaults to None').toBe('None');
    recordCheck(testInfo, { label: 'We Pay Your Premiums option list', expected: ['None', '30 days', '60 days', '90 days'], actual: info.options });
    expect(info.options, 'AC11: options are None/30/60/90 days').toEqual(['None', '30 days', '60 days', '90 days']);
    await wePayDropdown.selectOption({ label: '30 days' });
    await waitForSettle(quote, 1500);
    await expectErrorContaining(quote, 'At least one lump sum cover must be selected with We Pay Your Premiums');
  });

  test('AC12: selecting a cover type exposes Sum Insured + Premium Structure (default Stepped)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: When I select the Cover type, Then I must be provided the ability to enter the Sum Insured amount And based on the cover type selected the premium structure must have a pre-populated list with default Stepped.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, activate Life (representative cover).',
      '2. Check Sum Insured field is present.',
      '3. Read Premium Structure default.',
      '',
      'Expected: Sum Insured field present; Premium Structure default is Stepped.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    expect(await sumInsuredInput(quote, 0).isVisible(), 'AC12: Sum Insured field present after activating a cover').toBe(true);
    const premiumStructure = await getPremiumStructure(quote);
    recordCheck(testInfo, { label: 'Premium Structure default value', expected: 'Stepped', actual: premiumStructure });
    expect(premiumStructure, 'AC12: Premium Structure defaults to Stepped').toBe('Stepped');
  });

  test('AC13: adding/removing a cover is reflected in the premium panel', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: When I have selected the cover type, Then I must be provided the option to \'add\' or \'remove\' the cover type And I must be able to view the changes to the premiums on the "Progress Panel for application progress".',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, note the starting premium ($0).',
      '2. Activate Life with a Sum Insured — confirm premium becomes > 0.',
      '3. Remove the cover — confirm premium returns to $0.',
      '',
      'Expected: premium panel reflects both the add and the remove.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    const before = (await getTotalYearlyPremium(quote)) || 0;
    recordCheck(testInfo, { label: 'Starting premium before any cover', expected: 0, actual: before });
    expect(before, 'AC13: starting premium is 0 before any cover').toBe(0);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const afterAdd = await getTotalYearlyPremium(quote);
    recordCheck(testInfo, { label: 'Premium after adding a cover', expected: '> 0', actual: afterAdd });
    expect(afterAdd, 'AC13: premium reflects the added cover').toBeGreaterThan(0);
    await removeAllCoverCards(quote);
    await waitForSettle(quote, 1000);
    const afterRemove = (await getTotalYearlyPremium(quote)) || 0;
    recordCheck(testInfo, { label: 'Premium after removing the cover', expected: 0, actual: afterRemove });
    expect(afterRemove, 'AC13: premium reflects the removed cover').toBe(0);
  });

  test('AC14: Kids Cover — number of kids drives per-kid fields and the SI tier default', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC14: When I have chosen number of kids (0 to 9) in the kids cover, Then I must be provided ability to enter kid\'s first name, surname, date of birth, gender per kid, And I must be able to view prepopulated with 50K and list of sum insureds up to 200k (default 50k) must be displayed for each kid.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote with a priced Life cover (Kids Cover requires a Personal Insurance cover, per KID-08).',
      '2. Set Number of Kids = 1.',
      '3. Check per-kid fields (DOB at minimum - confirmed via probe) and the SI tier select\'s default + option range.',
      '',
      'Expected: SI tier defaults to "$50,000 (Free)", options run $50k-$200k in $10k steps (16 total).',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    const numKids = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numKids.selectOption('1');
    await waitForSettle(quote, 1500);
    const dateInputCount = await quote.locator('input[type="date"]').count();
    recordCheck(testInfo, { label: 'A per-kid Date of birth field appears (count of date inputs)', expected: '> 1', actual: dateInputCount });
    expect(dateInputCount, 'AC14: a per-kid Date of birth field appears').toBeGreaterThan(1); // the adult DOB + at least one kid DOB
    const tierInfo = await quote.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text.includes('$50,000')));
      return sel ? { selected: sel.options[sel.selectedIndex].text, options: [...sel.options].map((o) => o.text) } : null;
    });
    expect(tierInfo, 'AC14: Kid SI tier select present').not.toBeNull();
    recordCheck(testInfo, { label: 'Kid SI tier default value', expected: '$50,000 (Free)', actual: tierInfo.selected });
    expect(tierInfo.selected, 'AC14: default is $50,000 (Free)').toBe('$50,000 (Free)');
    recordCheck(testInfo, { label: 'Kid SI tier option count (16 tiers, $50k-$200k in $10k steps)', expected: 16, actual: tierInfo.options.length });
    expect(tierInfo.options, 'AC14: 16 tiers, $50k-$200k in $10k steps').toHaveLength(16);
    recordCheck(testInfo, { label: 'Kid SI tier max tier value', expected: '$200,000', actual: tierInfo.options.at(-1) });
    expect(tierInfo.options.at(-1), 'AC14: max tier is $200,000').toBe('$200,000');
    // Value-level boundary (audit gap: only count + max were checked). Assert the MIN tier is the
    // free $50,000, and that the numeric tiers step by exactly $10,000 (so a wrong ladder of the
    // right length is caught).
    recordCheck(testInfo, { label: 'Kid SI tier min tier value is the free $50,000', expected: 'starts "$50,000"', actual: tierInfo.options[0] });
    expect(tierInfo.options[0], 'AC14: min tier is $50,000 (Free)').toContain('$50,000');
    const tierNums = tierInfo.options.map((o) => Number((o.match(/\$([\d,]+)/) || [])[1]?.replace(/,/g, '')));
    const steps = tierNums.slice(1).map((n, i) => n - tierNums[i]);
    const allTenK = steps.every((s) => s === 10000);
    recordCheck(testInfo, { label: 'Kid SI tiers step by exactly $10,000', expected: 'all steps = 10000', actual: [...new Set(steps)] });
    expect(allTenK, 'AC14: kid SI tiers increment by $10,000').toBe(true);
    // Per-kid fields (audit gap: only DOB was checked). Confirm First Name / Surname / Gender per kid.
    const kidFields = await quote.evaluate(() => ({
      firstName: !!document.querySelector('input[id*="Kid"][id*="FirstName"], input[id*="ChildFirstName"], input[id*="Child_FirstName"]') || [...document.querySelectorAll('input[id*="FirstName"]')].length > 1,
      surname: [...document.querySelectorAll('input[id*="LastName"], input[id*="Surname"]')].length > 1,
      gender: [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].filter((b) => ['Male', 'Female'].includes(b.innerText.trim())).length > 2,
    }));
    recordCheck(testInfo, { label: 'Per-kid First Name field appears', expected: true, actual: kidFields.firstName });
    expect(kidFields.firstName, 'AC14: per-kid First Name field present').toBe(true);
    recordCheck(testInfo, { label: 'Per-kid Surname field appears', expected: true, actual: kidFields.surname });
    expect(kidFields.surname, 'AC14: per-kid Surname field present').toBe(true);
    recordCheck(testInfo, { label: 'Per-kid Gender control appears', expected: true, actual: kidFields.gender });
    expect(kidFields.gender, 'AC14: per-kid Gender control present').toBe(true);
  });

  test('AC15/BR-006: Payment Frequency defaults to Monthly, full 5-option list, independent per policy', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC15: Given I have added one or more policies, Then I must have the ability to select the premium frequency for each policy from Fortnightly/Monthly(default)/Quarterly/Half Yearly/Yearly, And this selection must update on the quote/application.',
      'Business Rule #6: Each policy can be paid on a different frequency, so they don\'t have to be the same.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, price a Personal Life cover, and also add a Business policy with a Life cover.',
      '2. Confirm 2 independent Payment Frequency selects exist, both defaulting to Monthly.',
      '3. Change ONE to Fortnightly; confirm the other is unaffected.',
      '',
      'Expected: default Monthly, 5-option list exactly [Fortnightly, Monthly, Quarterly, Half Yearly, Yearly];',
      'each policy\'s frequency is independently settable.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1500);

    const freqSelects = quote.locator('select[id*="PaymentFrequencyDropdown"]');
    const freqSelectCount = await freqSelects.count();
    recordCheck(testInfo, { label: 'Independent Payment Frequency selects (Personal + Business)', expected: 2, actual: freqSelectCount });
    expect(freqSelectCount, 'AC15/BR-006: 2 independent Payment Frequency selects (Personal + Business)').toBe(2);
    for (let i = 0; i < 2; i++) {
      const info = await freqSelects.nth(i).evaluate((sel) => ({ selected: sel.options[sel.selectedIndex].text.trim(), options: [...sel.options].map((o) => o.text.trim()) }));
      recordCheck(testInfo, { label: `Policy ${i} Payment Frequency default value`, expected: 'Monthly', actual: info.selected });
      expect(info.selected, `AC15: policy ${i} defaults to Monthly`).toBe('Monthly');
      recordCheck(testInfo, { label: `Policy ${i} Payment Frequency option list`, expected: ['Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly'], actual: info.options });
      expect(info.options, `AC15: policy ${i} has the 5 documented options`).toEqual(['Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly']);
    }
    await freqSelects.nth(0).selectOption({ label: 'Fortnightly' });
    await waitForSettle(quote, 1000);
    const firstAfter = await freqSelects.nth(0).evaluate((sel) => sel.options[sel.selectedIndex].text.trim());
    const secondAfter = await freqSelects.nth(1).evaluate((sel) => sel.options[sel.selectedIndex].text.trim());
    recordCheck(testInfo, { label: 'Changed policy reflects Fortnightly', expected: 'Fortnightly', actual: firstAfter });
    expect(firstAfter, 'AC15/BR-006: changed policy reflects Fortnightly').toBe('Fortnightly');
    recordCheck(testInfo, { label: 'Other policy remains unaffected (stays Monthly)', expected: 'Monthly', actual: secondAfter });
    expect(secondAfter, 'AC15/BR-006: other policy is unaffected, stays Monthly').toBe('Monthly');
  });

  test('BR-004: "Add life" creates an additional, independent life on the quote', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'Business Rule #4: Can create \'add life\' to the quote/application.',
      '',
      'Steps to reproduce:',
      '1. Open a new quote, price Life 1.',
      '2. Click "Add life".',
      '3. Confirm a "Life 2" tab appears.',
      '',
      'Expected: a new, independent Life 2 is created.',
    ].join('\n') });
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Add life', 'Add life button');
    await waitForSettle(quote, 1500);
    const hasLife2 = await quote.evaluate(() => document.body.innerText.includes('Life 2'));
    recordCheck(testInfo, { label: '"Add life" creates a Life 2', expected: true, actual: hasLife2 });
    expect(hasLife2, 'BR-004: "Add life" creates a Life 2').toBe(true);
  });
});
