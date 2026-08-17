// Verifies: output/confluence-pages/business-rules/quote-screen/lump-sum-covers/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  coverButtonExists,
  removeAllCoverCards,
  fillCalcMask,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  sumInsuredInput,
  waitForSettle,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote);
});

test.describe('LSC-02/LSC-03 — Occupation gating on cover availability', () => {
  test('LSC-02: Needlestick is only available for Occupation Code = AA', async () => {
    expect(await coverButtonExists(quote, 'Needlestick')).toBe(true);

    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AM' });
    await waitForSettle(quote);
    expect(await coverButtonExists(quote, 'Needlestick')).toBe(false);
  });

  test('LSC-03: Occupation Code = AM disables Cancer, Accidental Death, and Specific Injury', async () => {
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AM' });
    await waitForSettle(quote);

    for (const cover of ['Cancer', 'Acd. Death', 'Specific Injury']) {
      expect(await coverButtonExists(quote, cover)).toBe(false);
    }
    // Life/TPD/Trauma should remain available regardless.
    for (const cover of ['Life', 'TPD', 'Trauma']) {
      expect(await coverButtonExists(quote, cover)).toBe(true);
    }
  });
});

test('LSC-10: TPD maximum Sum Insured per life is $5,000,000', async () => {
  await activateCover(quote, 'TPD');
  await fillCalcMask(sumInsuredInput(quote, 0), '5000001');
  await clickApply(quote);
  await expectErrorContaining(quote, '$5,000,000');

  await fillCalcMask(sumInsuredInput(quote, 0), '5000000');
  await waitForSettle(quote);
  const errors = await getVisibleErrors(quote);
  expect(errors.some((e) => e.includes('maximum total Sum Insured'))).toBe(false);
});

test('LSC-17: Trauma and Cancer share a combined $2,000,000 per-life cap', async () => {
  await activateCover(quote, 'Trauma');
  await fillCalcMask(sumInsuredInput(quote, 0), '1500000');
  await activateCover(quote, 'Cancer');
  await fillCalcMask(sumInsuredInput(quote, 1), '500001'); // 1,500,000 + 500,001 > 2,000,000
  await clickApply(quote);
  await expectErrorContaining(quote, 'including Cancer Cover, is $2,000,000');
});

test('LSC-23/LSC-24: Cancer prices independently, with no hard dependency on Trauma', async () => {
  await activateCover(quote, 'Cancer');
  await fillCalcMask(sumInsuredInput(quote, 0), '50000');
  await clickApply(quote);

  const errors = await getVisibleErrors(quote);
  expect(errors.some((e) => /requires|must be purchased with|depend/i.test(e))).toBe(false);
});

test.describe('LSC-19/LSC-20 — Major Trauma cap formula', () => {
  test('LSC-19: below $25,000 TRC, Major Trauma is capped at 300% of TRC', async () => {
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '60001'); // 300% of 20,000 = 60,000
    await clickApply(quote);
    await expectErrorContaining(quote, '$60000');
  });

  test('LSC-20: at/above $25,000 TRC, Major Trauma has no % cap — only the shared $2,000,000 ceiling applies', async () => {
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '25000');
    await activateCover(quote, 'Major Trauma');

    // Would be way over 300% of TRC (300% of 25k = 75k), but should still be
    // accepted because the % cap no longer applies at/above the threshold —
    // only the combined $2M ceiling does.
    await fillCalcMask(sumInsuredInput(quote, 1), '1975000'); // 25,000 + 1,975,000 = 2,000,000 exactly
    await clickApply(quote);
    let errors = await getVisibleErrors(quote);
    expect(errors.some((e) => e.includes('$2,000,000'))).toBe(false);

    await fillCalcMask(sumInsuredInput(quote, 1), '1975001'); // now exceeds the combined cap by $1
    await clickApply(quote);
    await expectErrorContaining(quote, '$2,000,000');
  });
});

test('LSC-27: Accidental Death maximum Sum Insured is a flat $1,000,000', async () => {
  await activateCover(quote, 'Acd. Death');
  await fillCalcMask(sumInsuredInput(quote, 0), '1000001');
  await clickApply(quote);
  await expectErrorContaining(quote, '$1,000,000');
});

test('LSC-29: Needlestick Sum Insured is a fixed-tier dropdown, not free text', async () => {
  await activateCover(quote, 'Needlestick');
  const dropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$500,000' }) }).first();
  await expect(dropdown).toBeVisible();
  const options = await dropdown.locator('option').allInnerTexts();
  expect(options).toEqual(['$0', '$50,000', '$100,000', '$150,000', '$200,000', '$250,000', '$300,000', '$350,000', '$400,000', '$450,000', '$500,000']);
});

test('LSC-32/LSC-34: Specific Injury activates independently, with no companion-cover requirement', async () => {
  await activateCover(quote, 'Specific Injury');
  const dropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$500,000' }) }).first();
  await dropdown.selectOption({ label: '$50,000' });
  await clickApply(quote);

  const errors = await getVisibleErrors(quote);
  expect(errors.some((e) => /requires one of the following covers/i.test(e))).toBe(false);
});

test('LSC-35: TI Support caps at MIN(100% of Life Sum Insured, $300,000)', async () => {
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');
  await activateCover(quote, 'TI Support');
  await fillCalcMask(sumInsuredInput(quote, 1), '200001'); // 1 more than 100% of Life SI
  await clickApply(quote);
  await expectErrorContaining(quote, '$200,000');
});

test('LSC-39: activating an already-active top-level cover is a no-op (no duplicate instance)', async () => {
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 0), '200000');

  const countBefore = await quote.locator('input[id*="SumInsured"]').count();
  await activateCover(quote, 'Life');
  const countAfter = await quote.locator('input[id*="SumInsured"]').count();

  expect(countAfter).toBe(countBefore);
});

test('LSC-40: an activated Lump Sum cover left with no Sum Insured persists (zombie state) instead of vanishing', async () => {
  await activateCover(quote, 'Life');
  // Deliberately do NOT fill Sum Insured.
  await clickApply(quote);

  const cardStillPresent = await quote.evaluate(() =>
    [...document.querySelectorAll('a')].some((a) => a.innerText.trim() === 'Remove')
  );
  expect(cardStillPresent).toBe(true);
  await expectErrorContaining(quote, 'minimum premium is $240.00');
});

test.afterEach(async () => {
  await removeAllCoverCards(quote).catch(() => {});
});
