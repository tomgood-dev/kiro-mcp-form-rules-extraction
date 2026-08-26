// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/lump-sum-covers/page.md
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
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

// Per LSC-02/LSC-03: a functionally-disabled cover button stays in the DOM — only
// clicking it is a no-op (no cover card / Sum Insured field gets added). So gating
// must be checked by attempting activation and confirming no card appeared, not by
// checking whether the button merely exists (coverButtonExists would be true either way).
async function countActiveCoverCards(quote) {
  return quote.evaluate(() => [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove').length);
}

// Per LSC-02/LSC-03 as documented (see the "known regression" callout at the top of
// lump-sum-covers/page.md — as of 2026-08-25 this gating does not fire for ANY code, so
// most of these are EXPECTED TO FAIL until that's resolved one way or the other). This
// full sweep exists so the regression's exact scope stays visible per-code/per-cover
// rather than only spot-checking AM, matching what the live investigation actually
// covered (see docs/bug-reports/occupation-cover-gating-universally-not-enforced.md).
test.describe('LSC-02/LSC-03 — Occupation gating on cover availability (full sweep)', () => {
  // 4 activate+cleanup cycles per code needs more headroom than the 240s global default.
  test.describe.configure({ timeout: 300_000 });

  const EXPECTATIONS = {
    // AA is the one code Needlestick is documented to work for; LSC-03 only names AM,
    // so nothing here should be gated at AA.
    AA: { Needlestick: true, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    // AM: LSC-02 (non-AA) gates Needlestick; LSC-03 additionally gates the other three.
    AM: { Needlestick: false, Cancer: false, 'Acd. Death': false, 'Specific Injury': false },
    // Every other non-AA code: LSC-02 gates Needlestick only — LSC-03 is AM-specific.
    A1: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    A2: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    B: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    C: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    S: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    U: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
    IC: { Needlestick: false, Cancer: true, 'Acd. Death': true, 'Specific Injury': true },
  };

  for (const [occCode, expected] of Object.entries(EXPECTATIONS)) {
    test(`LSC-02/LSC-03 @ Occupation Code = ${occCode}: gating matches the documented rule`, async () => {
      await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: occCode });
      await waitForSettle(quote);

      for (const [cover, shouldActivate] of Object.entries(expected)) {
        const before = await countActiveCoverCards(quote);
        await activateCover(quote, cover);
        await waitForSettle(quote, 1500); // extra margin — avoid a false no-op from a slow recalculation chain
        const after = await countActiveCoverCards(quote);
        const activated = after > before;
        expect(
          activated,
          `${cover} @ OCC=${occCode}: expected ${shouldActivate ? 'ACTIVATE' : 'no-op (gated)'}, got ${activated ? 'ACTIVATE' : 'no-op'}`
        ).toBe(shouldActivate);
        await removeAllCoverCards(quote).catch(() => {});
      }
    });
  }
});

test('LSC-02/LSC-03 control: Life/TPD/Trauma remain unaffected by occupation gating at AM', async () => {
  await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AM' });
  await waitForSettle(quote);

  for (const cover of ['Life', 'TPD', 'Trauma']) {
    const before = await countActiveCoverCards(quote);
    await activateCover(quote, cover);
    const after = await countActiveCoverCards(quote);
    expect(after, `${cover} should still activate normally at Occupation Code = AM`).toBe(before + 1);
  }
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

test('LSC-32/LSC-34: Specific Injury requires a companion cover — adding one unblocks Apply', async () => {
  // Specific Injury's Sum Insured is a calc-mask free-text input (LSC-32), same as
  // Life/TPD/Trauma/Cancer — NOT a fixed-tier select like Needlestick's.
  await activateCover(quote, 'Specific Injury');
  await fillCalcMask(sumInsuredInput(quote, 0), '5000');
  await clickApply(quote);
  await expectErrorContaining(quote, 'requires one of the following covers');

  // LSC-34: adding any companion cover (Life here) should clear the standalone block.
  await activateCover(quote, 'Life');
  await fillCalcMask(sumInsuredInput(quote, 1), '200000');
  await clickApply(quote);
  const errors = await getVisibleErrors(quote);
  expect(errors.some((e) => /requires one of the following covers/i.test(e)), 'adding a companion cover should clear the Specific Injury standalone-block error').toBe(false);
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
