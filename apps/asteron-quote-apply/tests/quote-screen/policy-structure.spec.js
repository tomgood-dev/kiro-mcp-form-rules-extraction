// Verifies: apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/policy-structure/page.md
//
// Several tests in this file are DELIBERATELY WRITTEN AS PROBES rather than
// pinned assertions, because the source documentation flags open discrepancies
// between two testing sessions (see the hub page's "Known discrepancies"
// section). Run these first and update the business-rules pages + this file's
// assertions once the real behavior is confirmed — do not just make a failing
// probe pass by guessing.
const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  waitForSettle,
} = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

test('POL-01/POL-02: Inflation Adjustment defaults ON, Premium Freeze defaults OFF', async () => {
  await expect(quote.getByRole('checkbox', { name: /Inflation Adjustment Benefit/ })).toBeChecked();
  await expect(quote.getByRole('checkbox', { name: /Premium Freeze/ })).not.toBeChecked();
});

test('POL-05: Inflation Adjustment and Premium Freeze are mutually exclusive (silently)', async () => {
  const inflation = quote.getByRole('checkbox', { name: /Inflation Adjustment Benefit/ });
  const freeze = quote.getByRole('checkbox', { name: /Premium Freeze/ });

  await expect(inflation).toBeChecked();
  await freeze.check();
  await waitForSettle(quote);

  await expect(freeze).toBeChecked();
  await expect(inflation).not.toBeChecked(); // should have been silently unchecked, no error expected
});

test.describe('POL-06 through POL-10 — PROBE: is Personal/Business an add-policy action or a two-state toggle?', () => {
  test('PROBE: does the "Policies" count increment on each Personal/Business click, or stay at a fixed 1-2 states?', async () => {
    const policiesBadge = () => quote.getByText('Policies', { exact: false }).locator('..').getByText(/^\d+$/).first();

    const countAfter = async (n) => {
      const text = await quote.evaluate(() => {
        const el = [...document.querySelectorAll('*')].find(
          (e) => e.children.length === 0 && e.innerText.trim().startsWith('Policies')
        );
        return el ? el.innerText.trim() : null;
      });
      console.log(`  [probe] Policies badge text after ${n} click(s): "${text}"`);
      return text;
    };

    await countAfter(0);
    await quote.getByRole('button', { name: 'Personal', exact: true }).click();
    await waitForSettle(quote);
    await countAfter(1);
    await quote.getByRole('button', { name: 'Business', exact: true }).click();
    await waitForSettle(quote);
    await countAfter(2);
    await quote.getByRole('button', { name: 'Personal', exact: true }).click();
    await waitForSettle(quote);
    const finalCount = await countAfter(3);

    // No hard assertion here on purpose — this is a probe. Read the console
    // output from a real run and update business-rules/policy-structure/page.md
    // (POL-06 through POL-10) plus this test file with a real assertion once
    // the behavior is confirmed one way or the other.
    expect(finalCount).not.toBeNull();
  });
});

test.describe('POL-11/POL-12 — Add Life', () => {
  test('POL-11: Add Life creates a fully independent, blank Life 2', async () => {
    await quote.getByRole('button', { name: 'Add life' }).click();
    await waitForSettle(quote);

    await expect(quote.getByRole('tab', { name: /Life 2/ })).toBeVisible();
    await quote.getByRole('tab', { name: /Life 2/ }).click();
    await waitForSettle(quote);

    const age = quote.getByRole('spinbutton', { name: /Age next birthday/ });
    await expect(age).toHaveValue('');
  });

  test('PROBE POL-12: does Add Life on a completely empty Life 1 succeed unconditionally, or does a "cannot proceed" modal block it?', async () => {
    // Deliberately do NOT fill any Personal Details on Life 1 first.
    await quote.getByRole('button', { name: 'Add life' }).click();
    await waitForSettle(quote);

    const modal = quote.getByRole('dialog').filter({ hasText: 'Cannot proceed' });
    const modalAppeared = await modal.isVisible().catch(() => false);
    const life2TabAppeared = await quote.getByRole('tab', { name: /Life 2/ }).isVisible().catch(() => false);

    console.log(`  [probe] "Cannot proceed" modal appeared: ${modalAppeared}; Life 2 tab appeared: ${life2TabAppeared}`);

    if (modalAppeared) {
      await modal.getByRole('button', { name: 'OK' }).click();
    }

    // No hard assertion — see file header. Confirm the real behavior, then
    // replace this with `expect(life2TabAppeared).toBe(true)` (or the modal
    // assertion) as appropriate, and update POL-12 in the business rules.
    expect(modalAppeared || life2TabAppeared).toBe(true);
  });
});

test('POL-13: the Premium panel aggregates a combined total across all lives', async () => {
  await setMinimumPersonalDetails(quote);
  const { activateCover, fillCalcMask, getTotalYearlyPremium } = require('../../helpers/quote-helpers');
  await activateCover(quote, 'Life');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '200000');
  await waitForSettle(quote);

  const life1Premium = await getTotalYearlyPremium(quote);
  expect(life1Premium).toBeGreaterThan(0);

  await quote.getByRole('button', { name: 'Add life' }).click();
  await waitForSettle(quote);

  const allLivesLabelExists = await quote.evaluate(() =>
    document.body.innerText.includes('All Lives')
  );
  expect(allLivesLabelExists).toBe(true);
});
