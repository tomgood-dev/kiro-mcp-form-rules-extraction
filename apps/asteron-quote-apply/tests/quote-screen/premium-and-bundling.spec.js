// Verifies: output/confluence-pages/business-rules/quote-screen/premium-and-bundling/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  removeAllCoverCards,
  fillCalcMask,
  getBundlingDiscount,
  sumInsuredInput,
  waitForSettle,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote);
});

test.describe('PREM-19/PREM-20 — Bundling Discount thresholds', () => {
  test('1 committed cover -> "None"', async () => {
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote);
    expect(await getBundlingDiscount(quote)).toBe('None');
  });

  test('2 committed covers -> "15% (2 covers)"', async () => {
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote);
    expect(await getBundlingDiscount(quote)).toContain('15%');
  });

  test('3 committed covers -> "20% (3 covers or more)"', async () => {
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 2), '100000');
    await waitForSettle(quote);
    expect(await getBundlingDiscount(quote)).toContain('20%');
  });
});

test('PREM-18: Fortnightly premium = Yearly ÷ 26, independently rounded per period', async () => {
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await waitForSettle(quote);

  const bodyTextYearlyMonthly = await quote.evaluate(() => document.body.innerText);
  const yearlyMatch = bodyTextYearlyMonthly.match(/Total Yearly Premium\s*\$([\d,.]+)/);
  expect(yearlyMatch).not.toBeNull();
  const yearlyFromMonthlyView = Number(yearlyMatch[1].replace(/,/g, ''));

  await quote.getByRole('combobox', { name: 'Payment frequency' }).selectOption({ label: 'Fortnightly' });
  await waitForSettle(quote);

  const bodyTextFortnightly = await quote.evaluate(() => document.body.innerText);
  const fortnightlyTotalMatch = bodyTextFortnightly.match(/Total\s*\n\s*\$([\d,.]+)/);
  const fortnightlyYearlyMatch = bodyTextFortnightly.match(/Total Yearly Premium\s*\$([\d,.]+)/);
  expect(fortnightlyTotalMatch).not.toBeNull();
  expect(fortnightlyYearlyMatch).not.toBeNull();

  const fortnightlyAmount = Number(fortnightlyTotalMatch[1].replace(/,/g, ''));
  const expectedFortnightly = Math.round((yearlyFromMonthlyView / 26) * 100) / 100;
  expect(fortnightlyAmount).toBeCloseTo(expectedFortnightly, 2);

  // The "Total Yearly Premium" figure shown while in Fortnightly mode is its
  // OWN rounded-per-period-derived total, and can legitimately differ slightly
  // from the Monthly-derived figure — assert they're close, not identical.
  const fortnightlyDerivedYearly = Number(fortnightlyYearlyMatch[1].replace(/,/g, ''));
  expect(Math.abs(fortnightlyDerivedYearly - yearlyFromMonthlyView)).toBeLessThan(1);
});

test.afterEach(async () => {
  await removeAllCoverCards(quote).catch(() => {});
});
