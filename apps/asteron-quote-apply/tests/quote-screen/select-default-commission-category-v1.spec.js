// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/page.md
// Source user story: docs/user-stories/User Story- Select Default Commission Category.md
// ACB-13175 is treated as already-built per .kiro/steering/test-expansion-process.md's
// acceptance-criteria mode — a mismatch here is a candidate defect, not evidence the
// feature isn't shipped.
//
// FIVE OF THESE TESTS ARE EXPECTED TO FAIL as of 2026-08-25/26 — confirmed, real
// regressions, not test bugs (each independently re-verified with a probe using
// different code from the shared helpers). Full evidence:
// test-runs/select-default-commission-category-part-1/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md
//   - AC04/AC05: the Update button starts enabled, not disabled.
//   - ADV-08: Select IC/RC no longer auto-selects the single Upfront-valid option at 2.5% Flexi Rate.
//   - ADV-09: Same at 7.5%.
//   - ADV-10: Same at 15%.
//   - AC06/AC07/AC08: Update/save/persistence not working.
// Per this project's convention, these assertions stay written to the DOCUMENTED
// (intended) behavior so the suite goes green automatically once the real defects are
// fixed — do not "fix" them to match the current broken behavior.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
  getVisibleErrors,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const {
  openAdviserUse,
  closeAdviserUse,
  setFlexiRate,
  getDefaultAgencySelectInfo,
  getDefaultAgencyLabelText,
  getIcRcSelectInfo,
  getLifeCoverCategoryInfo,
  getUpdateButtonInfo,
  setDefaultAgency,
  clickUpdate,
  bodyContainsConfirmationMessage,
  getSelectAllCategoryInfo,
  getCoverCategoryInfo,
  setIcRc,
} = require('../../helpers/adviser-use-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function freshPricedQuote(page) {
  return test.step('open a fresh priced quote (Age 35, Male, OCC AA, Life $500,000)', async () => {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    const premium = await getTotalYearlyPremium(quote);
    expect(premium, 'precondition: quote must price before testing Adviser Use').toBeGreaterThan(0);
    return quote;
  });
}

// Like freshPricedQuote but also sets Employment Status + income, so clicking Apply is not
// blocked by the earlier "complete the client's employment details" validation — used by tests
// (e.g. AC16) that need Apply to reach the IC/RC validation specifically.
async function freshPricedQuoteFullDetails(page) {
  return test.step('open a fresh priced quote with full employment details', async () => {
    const quote = await openNewQuote(page);
    // Mirror the proven VAL-08/09/10 recipe that gets Apply PAST the employment-details
    // validation: minimum personal details with employmentStatus 'Employed' + a single Life
    // cover at $200k. (Confirmed working in validation-and-navigation.spec.js VAL-08.)
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed' });
    await activateCover(quote, 'Life');
    // SI must be high enough that premium clears the $240/yr minimum EVEN at Flexi 12.5%
    // (the lowest-cost Flexi Rate). $200k was below the floor at 12.5%; $1M clears it.
    await fillCalcMask(sumInsuredInput(quote, 0), '1000000');
    await waitForSettle(quote);
    const premium = await getTotalYearlyPremium(quote);
    expect(premium, 'precondition: quote must price').toBeGreaterThan(0);
    return quote;
  });
}

const BASE_URL = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';

async function signOut(page) {
  await page.locator('button:has-text("Sign out")').click().catch(() => {});
  await page.waitForTimeout(8000);
}

async function loginOnce(page) {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');
  await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  if (page.url().includes('_error.html')) throw new Error('Login failed: error page');
  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false))) throw new Error('Login failed: form not rendered');
  await emailField.click();
  await page.keyboard.type(email, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(password, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed: credentials rejected or session conflict.');
}

async function login(page) {
  try {
    await loginOnce(page);
  } catch (err) {
    console.log('  [step] Login failed, waiting 15s and retrying once: ' + err.message);
    await page.waitForTimeout(15000);
    await loginOnce(page);
  }
}

async function currentDefaultAgencyValue(page) {
  const info = await getDefaultAgencySelectInfo(page);
  return info ? info.options[info.selectedIndex] : null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Select Default Commission Category', () => {
  test.describe.configure({ mode: 'parallel' });

  test('AC01/AC02/AC03/AC14: Default for Agency display + Flexi Rate N/A auto-select', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC01: Given the user accesses the Adviser Use function, When the commission structure section is displayed, Then the label "Default for Agency (xxxxx)" is visible And the correct agency number is displayed in the label.\nAC02: Given the user accesses the Adviser Use function, When the default commission category dropdown is displayed, Then the following options are available for selection: Upfront, Level 30, Spread 20.\nAC03: Given no default commission category has previously been configured for the agency, When the Adviser Use function is opened for the first time, Then the default commission category is set to Upfront.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Open Adviser Use.\n3. Read the label text, dropdown options, selected default, and IC/RC selection.\n\nExpected: Label shows "Default for Agency (<agency number>)"; options are Upfront/Level 30/Spread 20; default is Upfront; IC/RC auto-selects the single valid option at Flexi Rate N/A.' });
    const quote = await freshPricedQuote(page);

    await test.step('open Adviser Use', () => openAdviserUse(quote));

    await test.step('AC01/AC02/AC03: agency label and default category', async () => {
      const labelText = await getDefaultAgencyLabelText(quote);
      recordCheck(testInfo, { label: 'AC01: "Default for Agency (" label visible', expected: 'Default for Agency (', actual: labelText });
      expect(labelText, 'AC01: "Default for Agency (" label visible').toContain('Default for Agency (');
      recordCheck(testInfo, { label: 'AC01: a real agency number follows', expected: 'matches /Default for Agency \\(\\d/', actual: labelText });
      expect(labelText, 'AC01: a real agency number follows').toMatch(/Default for Agency \(\d/);

      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      expect(defaultAgency, 'AC02: Default-for-Agency dropdown must exist').not.toBeNull();
      recordCheck(testInfo, { label: 'AC02: available commission categories', expected: ['Upfront', 'Level 30', 'Spread 20'], actual: defaultAgency.options });
      expect(defaultAgency.options, 'AC02: available commission categories').toEqual(['Upfront', 'Level 30', 'Spread 20']);
      recordCheck(testInfo, { label: 'AC03: first-time default is Upfront', expected: 0, actual: defaultAgency.selectedIndex });
      expect(defaultAgency.selectedIndex, 'AC03: first-time default is Upfront').toBe(0);
    });

    await test.step('AC14: Flexi Rate N/A has a single real IC/RC option, auto-selected', async () => {
      const icRc = await getIcRcSelectInfo(quote);
      expect(icRc, 'AC14: Select IC/RC dropdown must exist at Flexi Rate N/A').not.toBeNull();
      recordCheck(testInfo, { label: 'AC14: IC/RC options at Flexi Rate N/A', expected: ['Please Select', 'IC-100%, RC-100%'], actual: icRc.options });
      expect(icRc.options, 'AC14').toEqual(['Please Select', 'IC-100%, RC-100%']);
      recordCheck(testInfo, { label: 'AC14: single valid option must auto-select, not stay on "Please Select"', expected: 'not 0', actual: icRc.selectedIndex });
      expect(icRc.selectedIndex, 'AC14: single valid option must auto-select, not stay on "Please Select"').not.toBe(0);
    });

    await closeAdviserUse(quote);
  });

  test('AC11: 30% Flexi Rate forces Nil Commission', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC11: Given a user has selected the 30% Flexi-Rate product option and the default commission category is Upfront, Level 30, or Spread 20, When the user navigates to the Adviser Use page, Then the commission category must be automatically set to Nil Commission and the following message must be displayed: "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected".\n\nSteps to reproduce:\n1. Open a fresh priced quote.\n2. Set Flexi Rate = 30%.\n3. Open Adviser Use.\n4. Check for the Nil Commission message and verify no per-cover IC/RC rows are shown.\n\nExpected: Message "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected" displayed; no IC/RC selection row visible.' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 30.0%', () => setFlexiRate(quote, '30.0%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    await test.step('assert exact Nil Commission message and no per-cover rows', async () => {
      const bodyText = await quote.evaluate(() => document.body.innerText);
      recordCheck(testInfo, { label: 'AC11: exact Nil Comm message', expected: 'Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected', actual: bodyText });
      expect(bodyText, 'AC11: exact Nil Comm message').toContain('Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected');

      const errors = await getVisibleErrors(quote);
      recordCheck(testInfo, { label: 'AC11: no validation should block at 30% Flexi Rate', expected: false, actual: errors.some((e) => e.includes('Please select IC/RC')) });
      expect(errors.some((e) => e.includes('Please select IC/RC')), 'AC11: no validation should block at 30% Flexi Rate').toBe(false);

      const defaultAgencyAt30 = await getDefaultAgencySelectInfo(quote);
      expect(defaultAgencyAt30, 'AC11: Default-for-Agency dropdown still visible').not.toBeNull();

      const icRcAt30 = await getIcRcSelectInfo(quote);
      expect(icRcAt30, 'AC11: no per-cover Select IC/RC row when Nil Commission applies').toBeNull();
    });

    await closeAdviserUse(quote);
  });

  test('AC04/AC05: Update button disabled until changed', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC04: Given the currently saved default commission category is displayed, When no changes have been made by the user, Then the Update button is disabled.\nAC05: Given the user changes the selected commission category, When the new selection differs from the saved value, Then the Update button becomes enabled.\n\nSteps to reproduce:\n1. Open a fresh priced quote, open Adviser Use.\n2. Immediately (zero interaction) check the Update button disabled state.\n3. Change the Default for Agency selection to a different value.\n4. Check the Update button is now enabled.\n5. Revert the selection back to the original value.\n6. Check the Update button is disabled again.\n\nExpected: disabled → enabled → disabled.\nActual (current): Starts enabled (AC04 fails at step 2).' });
    const quote = await freshPricedQuote(page);
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const updateBefore = await getUpdateButtonInfo(quote);
    expect(updateBefore, 'AC04: Update button must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC04: disabled before any change', expected: true, actual: updateBefore.disabled });
    expect(updateBefore.disabled, 'AC04: disabled before any change').toBe(true);

    await test.step('change Default for Agency selection', async () => {
      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      const otherOption = defaultAgency.options.find((o) => o !== defaultAgency.options[defaultAgency.selectedIndex]);
      await quote.locator(`#${defaultAgency.id}`).selectOption({ label: otherOption });
      await quote.waitForTimeout(500);
    });

    const updateAfter = await getUpdateButtonInfo(quote);
    recordCheck(testInfo, { label: 'AC05: enabled after a real change', expected: false, actual: updateAfter.disabled });
    expect(updateAfter.disabled, 'AC05: enabled after a real change').toBe(false);

    await test.step('revert selection (never click Update — agency-wide shared setting)', async () => {
      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      await quote.locator(`#${defaultAgency.id}`).selectOption({ label: 'Upfront' });
      await quote.waitForTimeout(500);
      const updateReverted = await getUpdateButtonInfo(quote);
      recordCheck(testInfo, { label: 'AC04/AC05: disabled again after reverting to the saved value', expected: true, actual: updateReverted.disabled });
      expect(updateReverted.disabled, 'AC04/AC05: disabled again after reverting to the saved value').toBe(true);
    });

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 2.5% — single valid IC/RC auto-selects', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 2.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-100%, RC-50% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: 2.5% Flexi Rate IC/RC pick list', expected: ['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%'], actual: icRc.options });
    expect(icRc.options, 'AC10: 2.5% Flexi Rate IC/RC pick list').toEqual(['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%']);
    recordCheck(testInfo, { label: 'AC14: default IC/RC for Upfront, single valid option', expected: 'IC-100%, RC-50%', actual: icRc.options[icRc.selectedIndex] });
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront, single valid option').toBe('IC-100%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'AC10: Life Cover commission category row must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: Life Cover default category', expected: 'Upfront', actual: lifeCover.options[lifeCover.selectedIndex] });
    expect(lifeCover.options[lifeCover.selectedIndex], 'AC10: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 7.5% — single valid IC/RC auto-selects', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 7.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-75%, RC-100% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 7.5%', () => setFlexiRate(quote, '7.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: 7.5% Flexi Rate IC/RC pick list', expected: ['Please Select', 'IC-100%, RC-50%', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-100%'], actual: icRc.options });
    expect(icRc.options, 'AC10: 7.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-100%, RC-50%', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-100%',
    ]);
    recordCheck(testInfo, { label: 'AC14: default IC/RC for Upfront (single valid option)', expected: 'IC-75%, RC-100%', actual: icRc.options[icRc.selectedIndex] });
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront (single valid option)').toBe('IC-75%, RC-100%');

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 15% — single valid IC/RC auto-selects', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 15% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-50%, RC-50% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 15.0%', () => setFlexiRate(quote, '15.0%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: 15% Flexi Rate IC/RC pick list', expected: ['Please Select', 'IC-0%, RC-100%', 'IC-100%, RC-0%', 'IC-50%, RC-50%'], actual: icRc.options });
    expect(icRc.options, 'AC10: 15% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-0%, RC-100%', 'IC-100%, RC-0%', 'IC-50%, RC-50%',
    ]);
    recordCheck(testInfo, { label: 'AC14: default IC/RC for Upfront (single valid option)', expected: 'IC-50%, RC-50%', actual: icRc.options[icRc.selectedIndex] });
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront (single valid option)').toBe('IC-50%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'AC10: Life Cover commission category row must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: Life Cover default category', expected: 'Upfront', actual: lifeCover.options[lifeCover.selectedIndex] });
    expect(lifeCover.options[lifeCover.selectedIndex], 'AC10: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });

  test('AC10/AC15: Flexi Rate 12.5% — multiple valid IC/RC, no auto-select', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC15: Given the selected commission category and Flexi-Rate combination has more than one valid IC/RC option, When the user creates or updates a quote/application, Then QA does not automatically select an IC/RC option And the user must manually choose an available IC/RC option.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 12.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Stays on "Please Select" — more than one valid Upfront option exists, adviser must choose.\nActual (current): Correctly stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 12.5%', () => setFlexiRate(quote, '12.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    recordCheck(testInfo, { label: 'AC10: 12.5% Flexi Rate IC/RC pick list', expected: ['Please Select', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-0%', 'IC-75%, RC-50%'], actual: icRc.options });
    expect(icRc.options, 'AC10: 12.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-0%', 'IC-75%, RC-50%',
    ]);
    recordCheck(testInfo, { label: 'AC15: must stay on "Please Select" — more than one valid option exists, adviser must choose', expected: 0, actual: icRc.selectedIndex });
    expect(icRc.selectedIndex, 'AC15: must stay on "Please Select" — more than one valid option exists, adviser must choose').toBe(0);

    await closeAdviserUse(quote);
  });

  test('AC09: Update button stays disabled when no change is made', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC09: Given the user has not changed the current commission category selection, When the user views the Adviser Use function, Then the Update button remains disabled And no update action can be performed.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh priced quote, open Adviser Use.',
      '2. Make NO change to the Default for Agency selection.',
      '3. Read the Update button disabled state.',
      '',
      'Expected: Update button disabled (no change made).',
      'Actual (current): Update button starts enabled — same known regression as AC04.',
    ].join('\n') });
    const quote = await freshPricedQuote(page);
    await test.step('open Adviser Use', () => openAdviserUse(quote));
    const info = await getUpdateButtonInfo(quote);
    expect(info, 'AC09: Update button present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC09: Update disabled with no change', expected: true, actual: info.disabled });
    expect(info.disabled, 'AC09: Update disabled with no change').toBe(true);
    await closeAdviserUse(quote);
  });

  // AC16 is currently UNREACHABLE from the Quote screen, confirmed by probing (not deferred out
  // of caution — see .kiro steering Rule #7). The IC/RC-at-Apply validation sits BEHIND the
  // "Please complete the client's employment details before applying" Apply gate, and that gate
  // now blocks Apply even when Employment Status = Employed is set (verified twice by
  // probes/probe-ac16-apply.js: the dropdown reads "Employed" immediately before Apply, yet the
  // employment-details error still fires). The previously-passing VAL-08 test
  // (validation-and-navigation.spec.js), which relied on the same "employmentStatus:'Employed'
  // is enough to proceed" recipe, ALSO now fails ("Apply result: no visible errors" but no
  // navigation) — i.e. the app's Apply/employment-details gate changed server-side. Reaching the
  // IC/RC validation requires completing the fuller employment-detail sub-fields that gate now
  // demands, which are not mapped. Encoded against the spec's expected message; enable once the
  // Apply employment gate is reachable again (and re-check the VAL-08 regression).
  // NOTE: uses the inline conditional test.fixme(true, reason) form, not test.fixme(title, fn).
  // The static 2-arg form never executes its body at all, so the annotation push AND the real
  // interaction code below it have never actually run since this test was written — confirmed
  // empirically 2026-09-02, see .kiro/steering/test-expansion-process.md's AC annotation
  // convention section. This fix preserves the current still-blocked behavior exactly (the body
  // remains unreachable while blocked) while making the reason visible in report.md instead of lost.
  test('AC16: Multiple valid IC/RC + Apply without selecting → validation blocks', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC16: Given multiple valid IC/RC options exist for the selected commission category and Flexi-Rate, When the user attempts to proceed without selecting an IC/RC option, Then "Please select IC/RC in Adviser Use for all policies." is displayed And the user cannot proceed.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh priced quote, set Flexi Rate = 12.5% (multiple valid Upfront IC/RC → defaults to "Please Select").',
      '2. Do NOT select an IC/RC option.',
      '3. Click Apply.',
      '',
      'Expected: error "Please select IC/RC in Adviser Use for all policies." and cannot proceed.',
      'Blocked: this validation sits behind the "complete the client\'s employment details" Apply',
      'gate, which now blocks Apply even with Employment Status set (see the comment above this',
      'test). Reaching IC/RC validation requires fuller employment-detail sub-fields not yet mapped.',
    ].join('\n') });
    test.fixme(true, 'Unreachable — sits behind the "complete employment details" Apply gate, which now blocks Apply even with Employment Status set. See generation notes above this test.');
    const quote = await freshPricedQuoteFullDetails(page);
    await test.step('set Flexi Rate = 12.5%', () => setFlexiRate(quote, '12.5%'));
    // Do NOT open Adviser Use / pick IC/RC — click Apply directly.
    await quote.getByRole('button', { name: 'Apply', exact: true }).click();
    await quote.waitForTimeout(4000);
    const errors = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'AC16: IC/RC validation blocks Apply without a selection', expected: 'Please select IC/RC in Adviser Use for all policies.', actual: errors });
    expect(/Please select IC\/RC in Adviser Use for all policies/i.test(errors), `AC16: expected IC/RC validation. Got: ${errors.slice(0, 200)}`).toBe(true);
  });

  test('AC19: Changing Flexi Rate refreshes IC/RC options / clears now-invalid selection', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC19: Given the user changes the Flexi-Rate or commission category, When the selection changes, Then the available IC/RC options are refreshed immediately And any previously selected IC/RC value that is no longer valid is cleared.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh priced quote, set Flexi Rate = 2.5%, open Adviser Use, note the IC/RC option list.',
      '2. Close Adviser Use, change Flexi Rate to 15%, reopen Adviser Use.',
      '3. Compare the IC/RC option lists.',
      '',
      'Expected: the IC/RC option set at 15% differs from 2.5% (options refreshed to match the new Flexi Rate).',
    ].join('\n') });
    const quote = await freshPricedQuote(page);
    await test.step('Flexi Rate 2.5% → read IC/RC options', () => setFlexiRate(quote, '2.5%'));
    await openAdviserUse(quote);
    const at25 = await getIcRcSelectInfo(quote);
    await closeAdviserUse(quote);
    await test.step('Flexi Rate 15% → read IC/RC options', () => setFlexiRate(quote, '15.0%'));
    await openAdviserUse(quote);
    const at15 = await getIcRcSelectInfo(quote);
    expect(at25, 'AC19: IC/RC list present at 2.5%').not.toBeNull();
    expect(at15, 'AC19: IC/RC list present at 15%').not.toBeNull();
    recordCheck(testInfo, { label: 'AC19: IC/RC options refreshed when Flexi Rate changed', expected: 'options at 15% differ from options at 2.5%', actual: { at25: at25.options, at15: at15.options } });
    expect(JSON.stringify(at25.options) !== JSON.stringify(at15.options), 'AC19: IC/RC options refreshed when Flexi Rate changed').toBe(true);
    await closeAdviserUse(quote);
  });

  test('AC13: Adviser Use defaults for an invalid default+Flexi combo (Spread 20 @ 2.5%)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC13: Given an adviser has selected a Flexi-Rate for which their default commission category is not valid,',
      'When the adviser opens the Adviser Use page, Then the Select IC/RC pick list must be enabled and display "Please Select"',
      'and only the IC/RC options available for the selected Flexi-Rate, while all commission category pick lists',
      '(including Select All) remain disabled until an IC/RC option is selected; and upon selecting an IC/RC option,',
      'the commission category pick lists must be enabled and display only the commission category associated with',
      'that selected IC/RC option.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh priced quote, set Flexi Rate = 2.5% (Spread 20 is NOT valid for 2.5%).',
      '2. Open Adviser Use, set Default for Agency = Spread 20 (in-quote; do NOT click Update).',
      '3. BEFORE picking an IC/RC: read Select IC/RC (enabled, "Please Select", only valid IC/RC),',
      '   Select All (disabled) and Life Cover (disabled).',
      '4. Pick IC/RC = IC-100%, RC-50%.',
      '5. AFTER picking: read Select All and Life Cover (enabled, options = only the associated category = Upfront).',
      '',
      'Expected: before → IC/RC enabled "Please Select" with only [IC-100% RC-50%, IC-75% RC-100%], categories disabled;',
      'after → categories enabled showing [Please Select, Upfront].',
      '',
      'Actual (current — CONFIRMED DISCREPANCY): with Default = Spread 20 at FR 2.5% the app AUTO-SELECTS',
      'IC-75%, RC-100% (instead of "Please Select") and immediately ENABLES the per-cover category showing',
      'Level 30 — i.e. it does not gate the category pick lists behind a manual IC/RC choice as AC13 requires.',
      'Reconciled via native-selectOption probe (probe-ac13-ac17-categories.js, evidence 15) which agrees with',
      'this test; the earlier "Please Select / disabled" reading was a raw-dispatchEvent probe artifact.',
      'This test is EXPECTED TO FAIL until the AC13 gating behavior is implemented.',
    ].join('\n') });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await openAdviserUse(quote);
    await test.step('set Default for Agency = Spread 20 (in-quote, no Update)', () => setDefaultAgency(quote, 'Spread 20'));

    // BEFORE picking IC/RC
    const icrcBefore = await getIcRcSelectInfo(quote);
    expect(icrcBefore, 'AC13: Select IC/RC present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC13: IC/RC defaults to Please Select', expected: 'Please Select', actual: icrcBefore.options[icrcBefore.selectedIndex] });
    expect(icrcBefore.options[icrcBefore.selectedIndex], 'AC13: IC/RC defaults to Please Select').toBe('Please Select');
    recordCheck(testInfo, { label: 'AC13: only Flexi-2.5%-valid IC/RC options shown', expected: ['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%'], actual: icrcBefore.options });
    expect(icrcBefore.options, 'AC13: only Flexi-2.5%-valid IC/RC options shown').toEqual(['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%']);
    const selectAllBefore = await getSelectAllCategoryInfo(quote);
    const lifeBefore = await getCoverCategoryInfo(quote, 'Life Cover');
    expect(selectAllBefore, 'AC13: Select All present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC13: Select All disabled before IC/RC picked', expected: true, actual: selectAllBefore.disabled });
    expect(selectAllBefore.disabled, 'AC13: Select All disabled before IC/RC picked').toBe(true);
    expect(lifeBefore, 'AC13: Life Cover category present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC13: Life Cover category disabled before IC/RC picked', expected: true, actual: lifeBefore.disabled });
    expect(lifeBefore.disabled, 'AC13: Life Cover category disabled before IC/RC picked').toBe(true);

    // AFTER picking IC-100%, RC-50% → only Upfront becomes available
    await test.step('pick IC-100%, RC-50%', () => setIcRc(quote, 'IC-100%, RC-50%'));
    const selectAllAfter = await getSelectAllCategoryInfo(quote);
    const lifeAfter = await getCoverCategoryInfo(quote, 'Life Cover');
    recordCheck(testInfo, { label: 'AC13: Select All enabled after IC/RC picked', expected: false, actual: selectAllAfter.disabled });
    expect(selectAllAfter.disabled, 'AC13: Select All enabled after IC/RC picked').toBe(false);
    recordCheck(testInfo, { label: 'AC13: Life Cover category enabled after IC/RC picked', expected: false, actual: lifeAfter.disabled });
    expect(lifeAfter.disabled, 'AC13: Life Cover category enabled after IC/RC picked').toBe(false);
    recordCheck(testInfo, { label: 'AC13: only the IC/RC-associated category (Upfront) available', expected: ['Please Select', 'Upfront'], actual: lifeAfter.options });
    expect(lifeAfter.options, 'AC13: only the IC/RC-associated category (Upfront) available').toEqual(['Please Select', 'Upfront']);
    await closeAdviserUse(quote);
  });

  test('AC17: Multiple categories selectable per benefit when the Flexi Rate supports them (15%)', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC17: Given a Flexi-Rate supports more than one commission category, When the user edits commission details',
      'for a benefit, Then the user may select from any valid commission category available for that Flexi-Rate.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh priced quote, set Flexi Rate = 15% (supports Upfront, Level 30, Spread 20 via IC-50%, RC-50%).',
      '2. Open Adviser Use.',
      '3. Pick IC/RC = IC-50%, RC-50% (the split that permits all three categories per the story Example 3).',
      '4. Read the Life Cover per-benefit commission category pick list options.',
      '',
      'Expected: the per-benefit category pick list offers all three valid categories: Upfront, Level 30, Spread 20.',
    ].join('\n') });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 15%', () => setFlexiRate(quote, '15.0%'));
    await openAdviserUse(quote);
    await test.step('pick IC-50%, RC-50% (multi-category split)', () => setIcRc(quote, 'IC-50%, RC-50%'));
    const life = await getCoverCategoryInfo(quote, 'Life Cover');
    expect(life, 'AC17: Life Cover category present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC17: per-benefit category enabled at 15% with IC-50% RC-50%', expected: false, actual: life.disabled });
    expect(life.disabled, 'AC17: per-benefit category enabled at 15% with IC-50% RC-50%').toBe(false);
    // All three categories must be selectable (order-independent).
    const cats = life.options.filter((o) => o !== 'Please Select').sort();
    recordCheck(testInfo, { label: 'AC17: all three valid categories selectable per benefit', expected: ['Level 30', 'Spread 20', 'Upfront'], actual: cats });
    expect(cats, 'AC17: all three valid categories selectable per benefit').toEqual(['Level 30', 'Spread 20', 'Upfront']);
    await closeAdviserUse(quote);
  });

  // AC12 is blocked for the SAME reason as AC16 (confirmed by probing, not deferred out of caution):
  // it asserts the "Please select IC/RC in Adviser Use for all policies." validation that fires on
  // clicking Apply — and Apply is currently blocked earlier by the "complete the client's employment
  // details" gate, which no longer passes with just Employment Status = Employed (see
  // evidence/14-probe-ac16-apply-employment-gate/, and the VAL-08 regression). AC12 additionally
  // requires Spread 20 to be the SAVED agency default, which needs a genuine Update-click that
  // mutates an agency-wide shared setting on the dev environment. Encoded against the spec's expected
  // message; enable once the Apply employment gate is reachable and a dedicated agency/account is
  // available to set Spread 20 as the saved default.
  // NOTE: uses the inline conditional test.fixme(true, reason) form, not test.fixme(title, fn).
  // The static 2-arg form never executes its body at all, so the annotation push AND the real
  // interaction code below it have never actually run since this test was written — confirmed
  // empirically 2026-09-02, see .kiro/steering/test-expansion-process.md's AC annotation
  // convention section. This fix preserves the current still-blocked behavior exactly (the body
  // remains unreachable while blocked) while making the reason visible in report.md instead of lost.
  test('AC12: Spread 20 default + invalid Flexi (2.5%) → Apply blocked with IC/RC validation', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC12: Given an adviser has Spread 20 configured as their default commission category and selects a policy',
      'with a Flexi-Rate of 2.5%, 10%, 17.50%, or 25%, When the adviser clicks Apply without visiting the Adviser',
      'Use screen to select a valid commission category and commission percentages, Then the application must',
      'prevent processing and display the message: "Please select IC/RC in Adviser Use for all policies."',
      '',
      'Steps to reproduce:',
      '1. With Spread 20 saved as the agency default, open a fresh priced quote and set Flexi Rate = 2.5%.',
      '2. Do NOT open Adviser Use / select an IC/RC.',
      '3. Click Apply.',
      '',
      'Expected: error "Please select IC/RC in Adviser Use for all policies." and cannot proceed.',
      'Blocked: Apply is gated earlier by "complete the client\'s employment details" (see AC16 / evidence 14);',
      'also needs Spread 20 as the SAVED agency default (Update mutates agency-wide shared state).',
    ].join('\n') });
    test.fixme(true, 'Apply is gated earlier by the "complete employment details" block (see AC16), and this also needs Spread 20 saved as the agency default first — not yet set up.');
    const quote = await freshPricedQuoteFullDetails(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await quote.getByRole('button', { name: 'Apply', exact: true }).click();
    await quote.waitForTimeout(4000);
    const errors = await getVisibleErrors(quote).then((x) => x.join(' | '));
    recordCheck(testInfo, { label: 'AC12: IC/RC validation blocks Apply without a selection', expected: 'Please select IC/RC in Adviser Use for all policies.', actual: errors });
    expect(/Please select IC\/RC in Adviser Use for all policies/i.test(errors), `AC12: expected IC/RC validation. Got: ${errors.slice(0, 200)}`).toBe(true);
  });

  test('AC22: A new quote automatically has the agency default commission category applied', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: [
      'AC22: Given an agency default commission category has been configured, When a new quote is created,',
      'Then the default commission category must be automatically applied to the quote.',
      '',
      'Steps to reproduce:',
      '1. Open a fresh new quote (agency default is Upfront per AC03).',
      '2. Set Flexi Rate = 2.5% (single valid IC/RC for Upfront → auto-selects IC-100%, RC-50%).',
      '3. Open Adviser Use.',
      '4. Read the per-cover Life Cover commission category.',
      '',
      'Expected: the Life Cover category on the new quote is the agency default = Upfront.',
    ].join('\n') });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await openAdviserUse(quote);
    // At 2.5% for the Upfront default the single valid IC/RC auto-selects and the cover category
    // then resolves to the default (Upfront). The category resolves a beat AFTER the IC/RC
    // auto-selects, so poll until it settles (a too-early read sees a transient "Please Select").
    let life = await getCoverCategoryInfo(quote, 'Life Cover');
    for (let i = 0; i < 10 && (!life || life.selected === 'Please Select'); i++) {
      await quote.waitForTimeout(1000);
      life = await getCoverCategoryInfo(quote, 'Life Cover');
    }
    expect(life, 'AC22: Life Cover category present').not.toBeNull();
    recordCheck(testInfo, { label: 'AC22: new quote shows the agency default (Upfront) on the cover', expected: 'Upfront', actual: life.selected });
    expect(life.selected, 'AC22: new quote shows the agency default (Upfront) on the cover').toBe('Upfront');
    await closeAdviserUse(quote);
  });

});
test.describe('Select Default Commission Category — Save & Persistence', () => {

  test('AC06/AC07/AC08: Update button save, confirmation message, persistence', async ({ page }, testInfo) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC06: Given the user has selected a different commission category, When the user clicks the Update button, Then the selected commission category is saved as the agency default And the updated value is available for future quotes and applications.\nAC07: Given the default commission category has been successfully saved, When the save operation completes, Then the following confirmation message is displayed: "Your default commission structure setting has been updated."\nAC08: Given a default commission category has been saved, When the user exits and later reopens the Adviser Use function, Then the previously saved default commission category is displayed.\n\nSteps to reproduce:\n1. Open a fresh priced quote, open Adviser Use.\n2. Confirm current default is Upfront.\n3. Change Default for Agency to Level 30.\n4. Click the Update button.\n5. Check for the confirmation message.\n6. Sign out completely.\n7. Sign back in with the same account.\n8. Open a new fresh priced quote, open Adviser Use.\n9. Check whether the value persisted as Level 30.\n\nExpected: Confirmation message appears (AC07); fresh session shows Level 30 (AC06/AC08).\nActual (current): No confirmation message. Fresh session still shows Upfront — value did not persist.' });
    test.setTimeout(900000);
    try {
      await test.step('AC03/ADV-03 baseline: agency default should be Upfront before this test changes it', async () => {
        const quote = await freshPricedQuote(page);
        await openAdviserUse(quote);
        const before = await currentDefaultAgencyValue(quote);
        recordCheck(testInfo, { label: 'AC03/ADV-03 baseline: agency default is Upfront', expected: 'Upfront', actual: before });
        expect(before, 'AC03/ADV-03 baseline').toBe('Upfront');
      });

      let sawConfirmation = false;
      await test.step('AC06/AC07: change the agency default, click Update, expect confirmation', async () => {
        await setDefaultAgency(page, 'Level 30');
        await clickUpdate(page);

        for (let i = 0; i < 8; i++) {
          if (await bodyContainsConfirmationMessage(page)) { sawConfirmation = true; break; }
          await page.waitForTimeout(500);
        }
      });
      recordCheck(testInfo, { label: 'AC07: confirmation message appears after clicking Update', expected: 'Your default commission structure setting has been updated.', actual: sawConfirmation });
      expect(sawConfirmation, 'AC07: expected the confirmation message "Your default commission structure setting has been updated." to appear after clicking Update').toBe(true);

      await test.step('AC06/AC08: a brand-new quote in a brand-new login session should see the new default', async () => {
        await signOut(page);
        await login(page);
        const quote = await freshPricedQuote(page);
        await openAdviserUse(quote);
        const afterFreshLogin = await currentDefaultAgencyValue(quote);
        recordCheck(testInfo, { label: 'AC06/AC08: updated agency default visible from a brand-new login session', expected: 'Level 30', actual: afterFreshLogin });
        expect(afterFreshLogin, 'AC06/AC08: the updated agency default should be visible from a brand-new login session').toBe('Level 30');
      });

    } finally {
      await test.step('cleanup: revert Default for Agency to Upfront', async () => {
        try {
          const quote = await freshPricedQuote(page);
          await openAdviserUse(quote);
          const current = await currentDefaultAgencyValue(quote);
          if (current !== 'Upfront') {
            await setDefaultAgency(quote, 'Upfront');
            await clickUpdate(quote);
          }
        } catch (revertErr) {
          console.error('WARNING: revert-to-Upfront cleanup failed: ' + revertErr.message);
        }
        await signOut(page);
      });
    }
  });

});
