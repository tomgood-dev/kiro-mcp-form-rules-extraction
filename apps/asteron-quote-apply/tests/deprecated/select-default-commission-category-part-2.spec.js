// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md
// Source user story: docs/user-stories/User Story- Select Default Commission Category.md
//
// Part 2 of 2 (Parts 5-7 of the original 7-part investigation, the Flexi Rate IC/RC
// worked examples). Split from Part 1 to respect the ~4-5-fresh-quotes-per-session
// limit — see "Sustained session load" in test-expansion-process.md. Every check below
// opens its OWN fresh quote — reusing one quote across Flexi Rate values previously
// caused a stale Select IC/RC selection to carry over from the last-viewed value (see
// "Stateful-component carryover" in the same doc; this was the root cause of two
// retracted false-positive findings during the original investigation).
//
// ADV-09 AND ADV-10 ARE EXPECTED TO FAIL as of 2026-08-25/26 — confirmed, real
// regressions (Select IC/RC no longer auto-selects the single Upfront-valid option at
// 7.5%/15% Flexi Rate), independently re-verified. ADV-11 (12.5%, multiple valid
// options, correctly no auto-select) still passes. Full evidence: see part-1.spec.js's
// header, or test-runs/select-default-commission-category-part-1/2026-08-25T19-26-35/
// bug-reports/adviser-use-commission-regressions.md. Left asserting the documented
// (intended) behavior on purpose - do not "fix" to match the current broken behavior.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
} = require('../../helpers/quote-helpers');
const {
  openAdviserUse,
  closeAdviserUse,
  setFlexiRate,
  getIcRcSelectInfo,
  getLifeCoverCategoryInfo,
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

test.describe('Select Default Commission Category — Part 2', () => {
  test('ADV-09: Example 2, Flexi Rate 7.5% — single valid IC/RC option (AC10, AC14)', async ({ page }) => {
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 7.5%', () => setFlexiRate(quote, '7.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'ADV-09: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'ADV-09: 7.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-100%, RC-50%', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-100%',
    ]);
    expect(icRc.options[icRc.selectedIndex], 'ADV-09: default IC/RC for Upfront (single valid option)').toBe('IC-75%, RC-100%');

    await closeAdviserUse(quote);
  });

  test('ADV-10: Example 3, Flexi Rate 15% — single valid IC/RC option (AC10, AC14)', async ({ page }) => {
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 15.0%', () => setFlexiRate(quote, '15.0%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'ADV-10: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'ADV-10: 15% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-0%, RC-100%', 'IC-100%, RC-0%', 'IC-50%, RC-50%',
    ]);
    expect(icRc.options[icRc.selectedIndex], 'ADV-10: default IC/RC for Upfront (single valid option)').toBe('IC-50%, RC-50%');

    const lifeCover = await getLifeCoverCategoryInfo(quote);
    expect(lifeCover, 'ADV-10: Life Cover commission category row must exist').not.toBeNull();
    expect(lifeCover.options[lifeCover.selectedIndex], 'ADV-10: Life Cover default category').toBe('Upfront');

    await closeAdviserUse(quote);
  });

  test('ADV-11: Example 4, Flexi Rate 12.5% — multiple valid IC/RC options, no auto-select (AC10, AC15)', async ({ page }) => {
    const quote = await freshPricedQuote(page);
    await test.step('set Flexi Rate = 12.5%', () => setFlexiRate(quote, '12.5%'));
    await test.step('open Adviser Use', () => openAdviserUse(quote));

    const icRc = await getIcRcSelectInfo(quote);
    expect(icRc, 'ADV-11: Select IC/RC dropdown must exist').not.toBeNull();
    expect(icRc.options, 'ADV-11: 12.5% Flexi Rate IC/RC pick list').toEqual([
      'Please Select', 'IC-25%, RC-100%', 'IC-50%, RC-100%', 'IC-75%, RC-0%', 'IC-75%, RC-50%',
    ]);
    expect(icRc.selectedIndex, 'ADV-11: must stay on "Please Select" — more than one valid UPFRONT option exists, adviser must choose (AC15)').toBe(0);

    await closeAdviserUse(quote);
  });
});
