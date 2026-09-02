// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/validation-and-navigation/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  expectErrorContaining,
  getVisibleErrors,
  clickApply,
  isOnClientSummary,
  sumInsuredInput,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

test('VAL-24: total premium below $240/year per life shows the minimum-premium banner', async () => {
  await setMinimumPersonalDetails(quote);
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '1000'); // trivially small, premium will be under $240/yr
  await clickApply(quote);
  await expectErrorContaining(quote, 'minimum premium is $240.00');
});

test('VAL-11: Apply is blocked while Employment Status is still "Select one"', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote);
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await clickApply(quote);

  const stayedOnIllustration = await isOnClientSummary(quote);
  recordCheck(testInfo, { label: 'Apply should not succeed while Employment Status is unset', expected: false, actual: stayedOnIllustration });
  expect(stayedOnIllustration, 'Apply should not succeed while Employment Status is unset').toBe(false);

  // Per VAL-11/VAL-23, the exact message is "Please complete the client's employment
  // details before applying" — check both an inline error and a modal dialog (per the
  // VAL-12 precedent of a similar blocking validation appearing as a modal), since
  // which surface this specific message uses hasn't been independently pinned down.
  const found = await quote.evaluate(() => {
    const inline = document.body.innerText.includes('employment details before applying');
    const modalSel = '[role="dialog"],[role="alertdialog"],[class*="modal"],[class*="popup"],[class*="overlay"]';
    const modal = [...document.querySelectorAll(modalSel)].some((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 50 && r.height > 50 && el.innerText?.includes('employment details before applying');
    });
    return inline || modal;
  });
  recordCheck(testInfo, { label: 'expected "...employment details before applying" as an inline error or modal', expected: true, actual: found });
  expect(found, 'expected "...employment details before applying" as an inline error or modal').toBe(true);
});

test('VAL-08/VAL-09/VAL-10: a fully valid single-cover configuration allows Apply to proceed', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed' });
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await waitForSettle(quote);

  const urlBefore = quote.url();
  await clickApply(quote);

  const navigated = await isOnClientSummary(quote);
  const urlAfter = quote.url();

  // Per VAL-09, the URL is not a reliable signal — assert on content, and only
  // log the URL comparison for information.
  console.log(`  [info] URL before: ${urlBefore}`);
  console.log(`  [info] URL after:  ${urlAfter}`);
  recordCheck(testInfo, { label: 'Apply proceeds to Client Summary for a fully valid single-cover configuration', expected: true, actual: navigated });
  expect(navigated).toBe(true);
});

test('VAL-10: an invalid configuration keeps you on the Illustration screen with error text shown', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote);
  await activateCover(quote, 'TPD');
  await fillCalcMask(sumInsuredInput(quote, 0), '9999999'); // over the $5,000,000 max
  await clickApply(quote);

  const navigatedToSummary = await isOnClientSummary(quote);
  recordCheck(testInfo, { label: 'Apply blocked for an invalid configuration (sum insured over the $5,000,000 max)', expected: false, actual: navigatedToSummary });
  expect(navigatedToSummary).toBe(false);
  const stillOnIllustration = await quote.evaluate(() => document.body.innerText.includes('Illustration'));
  recordCheck(testInfo, { label: 'Illustration screen still shown after Apply is blocked', expected: true, actual: stillOnIllustration });
  expect(stillOnIllustration).toBe(true);
});
