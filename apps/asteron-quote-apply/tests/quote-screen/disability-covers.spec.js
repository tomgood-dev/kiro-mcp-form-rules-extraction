// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/disability-covers/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  removeAllCoverCards,
  fillCalcMask,
  commitWithoutTyping,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  getBundlingDiscount,
  sumInsuredInput,
  waitForSettle,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed', income: 150000 });
});

test.describe('DC-01/DC-02/DC-03 — The commitment trap', () => {
  test('DC-01/DC-02: an activated Disability cover with a never-focused benefit field contributes $0 and does not persist', async () => {
    const before = await getTotalYearlyPremium(quote);

    await activateCover(quote, 'Income Protection');
    // Deliberately do NOT click into the benefit field at all.
    await waitForSettle(quote);
    const duringActivation = await getTotalYearlyPremium(quote);
    expect(duringActivation).toBe(before ?? 0);

    await clickApply(quote);
    const disabilityCoverCount = await quote.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && e.innerText.trim().startsWith('Disability Covers')
      );
      return el ? el.innerText.trim() : null;
    });
    // Should have reverted to "Disability Covers" with no trailing count digit (i.e. 0 active).
    expect(disabilityCoverCount === 'Disability Covers' || disabilityCoverCount === 'Disability Covers0').toBeTruthy();
  });

  test('DC-03: focusing and blurring the benefit field with nothing typed triggers the auto-default max', async () => {
    await activateCover(quote, 'Income Protection');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote);

    const premium = await getTotalYearlyPremium(quote);
    expect(premium).toBeGreaterThan(0);
  });
});

test('DC-15: Mortgage & Living maximum monthly benefit = 45% of annual income ÷ 12', async () => {
  // income = 150,000 -> 45% / 12 = $5,625
  await activateCover(quote, 'Mortgage & Living');
  await fillCalcMask(sumInsuredInput(quote, 0), '5626');
  await clickApply(quote);
  await expectErrorContaining(quote, '$5,625');
});

test('DC-21: Income Protection maximum monthly benefit = 75% of annual income ÷ 12', async () => {
  // income = 150,000 -> 75% / 12 = $9,375
  await activateCover(quote, 'Income Protection');
  await fillCalcMask(sumInsuredInput(quote, 0), '9376');
  await clickApply(quote);
  await expectErrorContaining(quote, '$9,375');
});

test.describe('DC-27/DC-28 — Workability', () => {
  test('DC-27: Workability maximum monthly benefit = 75% of annual income ÷ 12', async () => {
    await activateCover(quote, 'Workability');
    await fillCalcMask(sumInsuredInput(quote, 0), '9376');
    await clickApply(quote);
    await expectErrorContaining(quote, '$9,375');
  });

  test('DC-28: Workability cannot coexist with Mortgage & Living', async () => {
    await activateCover(quote, 'Mortgage & Living');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await activateCover(quote, 'Workability');
    await commitWithoutTyping(sumInsuredInput(quote, 1));
    await clickApply(quote);
    await expectErrorContaining(quote, 'not available to be taken in conjunction with');
  });

  test('DC-28: Workability cannot coexist with Income Protection', async () => {
    await activateCover(quote, 'Income Protection');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await activateCover(quote, 'Workability');
    await commitWithoutTyping(sumInsuredInput(quote, 1));
    await clickApply(quote);
    await expectErrorContaining(quote, 'not available to be taken in conjunction with');
  });

  test('DC-28 (contrast check): Mortgage & Living and Income Protection CAN coexist', async () => {
    await activateCover(quote, 'Mortgage & Living');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await activateCover(quote, 'Income Protection');
    await commitWithoutTyping(sumInsuredInput(quote, 1));
    await clickApply(quote);
    const errors = await getVisibleErrors(quote);
    expect(errors.some((e) => e.includes('not available to be taken in conjunction with'))).toBe(false);
  });
});

test('PREM-20/PREM-21 cross-check: 2 committed covers (1 Lump Sum + 1 Disability) trigger the 15% bundling discount', async () => {
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await activateCover(quote, 'Income Protection');
  await commitWithoutTyping(sumInsuredInput(quote, 1));
  await waitForSettle(quote);

  const discount = await getBundlingDiscount(quote);
  expect(discount).toContain('15%');
});

test.describe('Business-only Disability covers (DC-06, DC-33, DC-39, DC-44)', () => {
  test.beforeEach(async () => {
    await quote.getByRole('button', { name: 'Business', exact: true }).click();
    await waitForSettle(quote);
  });

  test('DC-33: Business Expenses maximum monthly benefit is a flat $16,666', async () => {
    await activateCover(quote, 'Business Expenses');
    await fillCalcMask(sumInsuredInput(quote, 0), '99999');
    await clickApply(quote);
    await expectErrorContaining(quote, '$16,666');
  });

  test('DC-39: Business Disability maximum monthly benefit is a flat $50,000', async () => {
    await activateCover(quote, 'Business Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '99999');
    await clickApply(quote);
    await expectErrorContaining(quote, '$50,000');
  });

  test('DC-06/DC-44: Farmers Disability requires Self-Employed/Own-company AND a flat $10,000 cap', async () => {
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'B' });
    await waitForSettle(quote);

    await activateCover(quote, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(quote, 0), '99999');
    await clickApply(quote);
    await expectErrorContaining(quote, '$10,000');
    // Employment status was set to "Employed" in the outer beforeEach — should be blocked.
    await expectErrorContaining(quote, "Self Employed");
  });
});

test.afterEach(async () => {
  await removeAllCoverCards(quote).catch(() => {});
});
