// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
// Source user story: docs/user-stories/User Story- Select Default Commission Category.md
// ACB-13175 is treated as already-built per .kiro/steering/test-expansion-process.md's
// acceptance-criteria mode — a mismatch here is a candidate defect, not evidence the
// feature isn't shipped.
//
// Part 1 of 2 (Parts 1-4 of the original 7-part investigation). Split from Part 2
// to respect the ~4-5-fresh-quotes-per-session limit discovered this session — see
// "Sustained session load" in test-expansion-process.md. Every check below opens its
// OWN fresh quote per the "fresh-quote-per-driving-field-value" rule (switching Flexi
// Rate and reopening Adviser Use within the same quote can leave a stale Select IC/RC
// selection from the previous value — see "Stateful-component carryover" in the same doc).
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
} = require('../../helpers/adviser-use-helpers');

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

test.describe('Select Default Commission Category — Part 1', () => {
  test('AC01/AC02/AC03/AC14: Default for Agency display + Flexi Rate N/A auto-select', async ({ page }) => {
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
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 30.0%', () => setFlexiRate(quote, '30.0%'));
    // AC11's trigger is "when the user navigates to the Adviser Use page" — scoped to
    // opening Adviser Use, not to selecting the Flexi Rate on the main quote page.
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
      // Reverting means picking Upfront again, since that's this dev environment's live default.
      await quote.locator(`#${defaultAgency.id}`).selectOption({ label: 'Upfront' });
      await quote.waitForTimeout(500);
      const updateReverted = await getUpdateButtonInfo(quote);
      expect(updateReverted.disabled, 'AC04/AC05: disabled again after reverting to the saved value').toBe(true);
    });

    await closeAdviserUse(quote);
  });

  test('ADV-08: Example 1, Flexi Rate 2.5% — single valid IC/RC option (AC10, AC14)', async ({ page }) => {
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 2.5%', () => setFlexiRate(quote, '2.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'ADV-08: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'ADV-08: 2.5% Flexi Rate IC/RC pick list').toEqual(['Please Select', 'IC-100%, RC-50%', 'IC-75%, RC-100%']);
    expect(icRc.options[icRc.selectedIndex], 'ADV-08: default IC/RC for Upfront, single valid option (AC14)').toBe('IC-100%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'ADV-08: Life Cover commission category row must exist').not.toBeNull();
    expect(lifeCover.options[lifeCover.selectedIndex], 'ADV-08: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });
});
