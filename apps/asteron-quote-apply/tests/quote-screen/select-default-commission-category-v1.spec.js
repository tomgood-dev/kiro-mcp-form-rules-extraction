// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
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
} = require('../../helpers/adviser-use-helpers');

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

  test('AC01/AC02/AC03/AC14: Default for Agency display + Flexi Rate N/A auto-select', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC01: Given the user accesses the Adviser Use function, When the commission structure section is displayed, Then the label "Default for Agency (xxxxx)" is visible And the correct agency number is displayed in the label.\nAC02: Given the user accesses the Adviser Use function, When the default commission category dropdown is displayed, Then the following options are available for selection: Upfront, Level 30, Spread 20.\nAC03: Given no default commission category has previously been configured for the agency, When the Adviser Use function is opened for the first time, Then the default commission category is set to Upfront.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Open Adviser Use.\n3. Read the label text, dropdown options, selected default, and IC/RC selection.\n\nExpected: Label shows "Default for Agency (<agency number>)"; options are Upfront/Level 30/Spread 20; default is Upfront; IC/RC auto-selects the single valid option at Flexi Rate N/A.' });
    const quote = await freshPricedQuote(page);

    await test.step('open Adviser Use', () => openAdviserUse(quote));

    await test.step('AC01/AC02/AC03: agency label and default category', async () => {
      const labelText = await getDefaultAgencyLabelText(quote);
      expect(labelText, 'AC01: "Default for Agency (" label visible').toContain('Default for Agency (');
      expect(labelText, 'AC01: a real agency number follows').toMatch(/Default for Agency \(\d/);

      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      expect(defaultAgency, 'AC02: Default-for-Agency dropdown must exist').not.toBeNull();
      expect(defaultAgency.options, 'AC02: available commission categories').toEqual(['Upfront', 'Level 30', 'Spread 20']);
      expect(defaultAgency.selectedIndex, 'AC03: first-time default is Upfront').toBe(0);
    });

    await test.step('AC14: Flexi Rate N/A has a single real IC/RC option, auto-selected', async () => {
      const icRc = await getIcRcSelectInfo(quote);
      expect(icRc, 'AC14: Select IC/RC dropdown must exist at Flexi Rate N/A').not.toBeNull();
      expect(icRc.options, 'AC14').toEqual(['Please Select', 'IC-100%, RC-100%']);
      expect(icRc.selectedIndex, 'AC14: single valid option must auto-select, not stay on "Please Select"').not.toBe(0);
    });

    await closeAdviserUse(quote);
  });

  test('AC11: 30% Flexi Rate forces Nil Commission', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC11: Given a user has selected the 30% Flexi-Rate product option and the default commission category is Upfront, Level 30, or Spread 20, When the user navigates to the Adviser Use page, Then the commission category must be automatically set to Nil Commission and the following message must be displayed: "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected".\n\nSteps to reproduce:\n1. Open a fresh priced quote.\n2. Set Flexi Rate = 30%.\n3. Open Adviser Use.\n4. Check for the Nil Commission message and verify no per-cover IC/RC rows are shown.\n\nExpected: Message "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected" displayed; no IC/RC selection row visible.' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 30.0%', () => setFlexiRate(quote, '30.0%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    await test.step('assert exact Nil Commission message and no per-cover rows', async () => {
      const bodyText = await quote.evaluate(() => document.body.innerText);
      expect(bodyText, 'AC11: exact Nil Comm message').toContain('Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected');

      const errors = await getVisibleErrors(quote);
      expect(errors.some((e) => e.includes('Please select IC/RC')), 'AC11: no validation should block at 30% Flexi Rate').toBe(false);

      const defaultAgencyAt30 = await getDefaultAgencySelectInfo(quote);
      expect(defaultAgencyAt30, 'AC11: Default-for-Agency dropdown still visible').not.toBeNull();

      const icRcAt30 = await getIcRcSelectInfo(quote);
      expect(icRcAt30, 'AC11: no per-cover Select IC/RC row when Nil Commission applies').toBeNull();
    });

    await closeAdviserUse(quote);
  });

  test('AC04/AC05: Update button disabled until changed', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC04: Given the currently saved default commission category is displayed, When no changes have been made by the user, Then the Update button is disabled.\nAC05: Given the user changes the selected commission category, When the new selection differs from the saved value, Then the Update button becomes enabled.\n\nSteps to reproduce:\n1. Open a fresh priced quote, open Adviser Use.\n2. Immediately (zero interaction) check the Update button disabled state.\n3. Change the Default for Agency selection to a different value.\n4. Check the Update button is now enabled.\n5. Revert the selection back to the original value.\n6. Check the Update button is disabled again.\n\nExpected: disabled → enabled → disabled.\nActual (current): Starts enabled (AC04 fails at step 2).' });
    const quote = await freshPricedQuote(page);
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const updateBefore = await getUpdateButtonInfo(quote);
    expect(updateBefore, 'AC04: Update button must exist').not.toBeNull();
    expect(updateBefore.disabled, 'AC04: disabled before any change').toBe(true);

    await test.step('change Default for Agency selection', async () => {
      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      const otherOption = defaultAgency.options.find((o) => o !== defaultAgency.options[defaultAgency.selectedIndex]);
      await quote.locator(`#${defaultAgency.id}`).selectOption({ label: otherOption });
      await quote.waitForTimeout(500);
    });

    const updateAfter = await getUpdateButtonInfo(quote);
    expect(updateAfter.disabled, 'AC05: enabled after a real change').toBe(false);

    await test.step('revert selection (never click Update — agency-wide shared setting)', async () => {
      const defaultAgency = await getDefaultAgencySelectInfo(quote);
      await quote.locator(`#${defaultAgency.id}`).selectOption({ label: 'Upfront' });
      await quote.waitForTimeout(500);
      const updateReverted = await getUpdateButtonInfo(quote);
      expect(updateReverted.disabled, 'AC04/AC05: disabled again after reverting to the saved value').toBe(true);
    });

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 2.5% — single valid IC/RC auto-selects', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 2.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-100%, RC-50% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'AC10: 2.5% Flexi Rate IC/RC pick list').toEqual(['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%']);
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront, single valid option').toBe('IC-100%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'AC10: Life Cover commission category row must exist').not.toBeNull();
    expect(lifeCover.options[lifeCover.selectedIndex], 'AC10: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 7.5% — single valid IC/RC auto-selects', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 7.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-75%, RC-100% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 7.5%', () => setFlexiRate(quote, '7.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'AC10: 7.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-100%, RC-50%', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-100%',
    ]);
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront (single valid option)').toBe('IC-75%, RC-100%');

    await closeAdviserUse(quote);
  });

  test('AC10/AC14: Flexi Rate 15% — single valid IC/RC auto-selects', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC14: Given the selected commission category and Flexi-Rate combination has only one valid IC/RC option, When the commission details are displayed, Then QA automatically selects the available IC/RC option And no manual user selection is required.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 15% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Auto-selected to IC-50%, RC-50% (the only Upfront-valid option).\nActual (current): Stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 15.0%', () => setFlexiRate(quote, '15.0%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'AC10: 15% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-0%, RC-100%', 'IC-100%, RC-0%', 'IC-50%, RC-50%',
    ]);
    expect(icRc.options[icRc.selectedIndex], 'AC14: default IC/RC for Upfront (single valid option)').toBe('IC-50%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'AC10: Life Cover commission category row must exist').not.toBeNull();
    expect(lifeCover.options[lifeCover.selectedIndex], 'AC10: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });

  test('AC10/AC15: Flexi Rate 12.5% — multiple valid IC/RC, no auto-select', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC10: Given a commission category and Flexi-Rate have been selected, When the user views the Select IC/RC field, Then only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed And invalid IC/RC options are not available for selection.\nAC15: Given the selected commission category and Flexi-Rate combination has more than one valid IC/RC option, When the user creates or updates a quote/application, Then QA does not automatically select an IC/RC option And the user must manually choose an available IC/RC option.\n\nSteps to reproduce:\n1. Open a fresh priced quote (any valid persona).\n2. Set Flexi Rate = 12.5% on the quote.\n3. Open Adviser Use.\n4. Read the Select IC/RC dropdown selected value.\n\nExpected: Stays on "Please Select" — more than one valid Upfront option exists, adviser must choose.\nActual (current): Correctly stays on "Please Select".' });
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 12.5%', () => setFlexiRate(quote, '12.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'AC10: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'AC10: 12.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-0%', 'IC-75%, RC-50%',
    ]);
    expect(icRc.selectedIndex, 'AC15: must stay on "Please Select" — more than one valid option exists, adviser must choose').toBe(0);

    await closeAdviserUse(quote);
  });

});

// AC06/07/08 mutates the shared agency-wide Default for Agency setting, so it runs
// separately after the parallel tests above to avoid contaminating their reads.
test.describe('Select Default Commission Category — Save & Persistence', () => {

  test('AC06/AC07/AC08: Update button save, confirmation message, persistence', async ({ page }) => {
    test.info().annotations.push({ type: 'acceptance-criteria', description: 'AC06: Given the user has selected a different commission category, When the user clicks the Update button, Then the selected commission category is saved as the agency default And the updated value is available for future quotes and applications.\nAC07: Given the default commission category has been successfully saved, When the save operation completes, Then the following confirmation message is displayed: "Your default commission structure setting has been updated."\nAC08: Given a default commission category has been saved, When the user exits and later reopens the Adviser Use function, Then the previously saved default commission category is displayed.\n\nSteps to reproduce:\n1. Open a fresh priced quote, open Adviser Use.\n2. Confirm current default is Upfront.\n3. Change Default for Agency to Level 30.\n4. Click the Update button.\n5. Check for the confirmation message.\n6. Sign out completely.\n7. Sign back in with the same account.\n8. Open a new fresh priced quote, open Adviser Use.\n9. Check whether the value persisted as Level 30.\n\nExpected: Confirmation message appears (AC07); fresh session shows Level 30 (AC06/AC08).\nActual (current): No confirmation message. Fresh session still shows Upfront — value did not persist.' });
    test.setTimeout(900000);
    try {
      await test.step('AC03/ADV-03 baseline: agency default should be Upfront before this test changes it', async () => {
        const quote = await freshPricedQuote(page);
        await openAdviserUse(quote);
        const before = await currentDefaultAgencyValue(quote);
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
      expect(sawConfirmation, 'AC07: expected the confirmation message "Your default commission structure setting has been updated." to appear after clicking Update').toBe(true);

      await test.step('AC06/AC08: a brand-new quote in a brand-new login session should see the new default', async () => {
        await signOut(page);
        await login(page);
        const quote = await freshPricedQuote(page);
        await openAdviserUse(quote);
        const afterFreshLogin = await currentDefaultAgencyValue(quote);
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
