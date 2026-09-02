// Verifies: apps/asteron-quote-apply/docs/business-rules/quote-screen/policy-structure/page.md
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
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  waitForSettle,
} = require('../../helpers/quote-helpers');
const { recordCheck } = require('../../../../tools/artifact-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

// These checkboxes have no real <label> association — just a checkbox followed by a
// plain sibling text node (confirmed live: getByRole('checkbox', {name: ...}) matches
// nothing). Identify them by walking up from the matching visible text to the nearest
// ancestor containing a checkbox, same pattern as numberOfKidsSelect in kids-cover.spec.js.
async function checkboxByLabel(page, labelText) {
  const id = await page.evaluate((text) => {
    const labelEl = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && e.innerText && e.innerText.trim() === text
    );
    let container = labelEl?.parentElement;
    for (let i = 0; i < 5 && container; i++) {
      const cb = container.querySelector('input[type="checkbox"]');
      if (cb) return cb.id || null;
      container = container.parentElement;
    }
    return null;
  }, labelText);
  if (!id) throw new Error(`Checkbox for label "${labelText}" not found`);
  return page.locator(`#${id}`);
}

test('POL-01/POL-02: Inflation Adjustment defaults ON, Premium Freeze defaults OFF', async ({}, testInfo) => {
  const inflationCheckbox = await checkboxByLabel(quote, 'Inflation Adjustment Benefit');
  recordCheck(testInfo, { label: 'POL-01: Inflation Adjustment Benefit defaults ON', expected: true, actual: await inflationCheckbox.isChecked() });
  await expect(inflationCheckbox).toBeChecked();

  const freezeCheckbox = await checkboxByLabel(quote, 'Premium Freeze');
  recordCheck(testInfo, { label: 'POL-02: Premium Freeze defaults OFF', expected: false, actual: await freezeCheckbox.isChecked() });
  await expect(freezeCheckbox).not.toBeChecked();
});

test('POL-05: Inflation Adjustment and Premium Freeze are mutually exclusive (silently)', async ({}, testInfo) => {
  const inflation = await checkboxByLabel(quote, 'Inflation Adjustment Benefit');
  const freeze = await checkboxByLabel(quote, 'Premium Freeze');

  recordCheck(testInfo, { label: 'Inflation Adjustment Benefit is checked before Premium Freeze is toggled', expected: true, actual: await inflation.isChecked() });
  await expect(inflation).toBeChecked();
  await freeze.check();
  await waitForSettle(quote);

  recordCheck(testInfo, { label: 'Premium Freeze becomes checked after user checks it', expected: true, actual: await freeze.isChecked() });
  await expect(freeze).toBeChecked();
  recordCheck(testInfo, { label: 'Inflation Adjustment Benefit is silently unchecked when Premium Freeze is checked (mutual exclusivity)', expected: false, actual: await inflation.isChecked() });
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

    // These buttons' accessible names carry a leading icon glyph (confirmed live:
    // exact:true match fails), and a trailing-anchor regex alone is ambiguous — the
    // wrapping accordion header's own accessible name aggregates all nested button
    // text, so it also ends in "Personal"/"Business". Intersect with a real <button>
    // tag filter to exclude that div[role="button"] header.
    const personalBtn = () => quote.getByRole('button', { name: /Personal$/ }).and(quote.locator('button'));
    const businessBtn = () => quote.getByRole('button', { name: /Business$/ }).and(quote.locator('button'));

    await countAfter(0);
    await personalBtn().click();
    await waitForSettle(quote);
    await countAfter(1);
    await businessBtn().click();
    await waitForSettle(quote);
    await countAfter(2);
    await personalBtn().click();
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
  test('POL-11: Add Life creates a fully independent, blank Life 2', async ({}, testInfo) => {
    // Per POL-12, Add Life is blocked with a "Cannot proceed" modal if Life 1 doesn't
    // meet its minimum requirements — meet them first so this test exercises the
    // normal-success path, not the blocked one (that's POL-12's own probe below).
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote);

    await quote.getByRole('button', { name: 'Add life' }).click();
    await waitForSettle(quote);

    await expect(quote.getByRole('tab', { name: /Life 2/ })).toBeVisible();
    await quote.getByRole('tab', { name: /Life 2/ }).click();
    await waitForSettle(quote);

    const age = quote.getByRole('spinbutton', { name: /Age next birthday/ });
    const ageValue = await age.inputValue();
    recordCheck(testInfo, { label: 'Age next birthday on new Life 2 is blank (independent of Life 1)', expected: '', actual: ageValue });
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

test('POL-13: the Premium panel aggregates a combined total across all lives', async ({}, testInfo) => {
  await setMinimumPersonalDetails(quote);
  const { activateCover, fillCalcMask, getTotalYearlyPremium } = require('../../helpers/quote-helpers');
  await activateCover(quote, 'Life');
  await fillCalcMask(quote.locator('input[id*="SumInsured"]').first(), '200000');
  await waitForSettle(quote);

  const life1Premium = await getTotalYearlyPremium(quote);
  recordCheck(testInfo, { label: 'Life 1 yearly premium is calculated as a positive amount', expected: '> 0', actual: life1Premium });
  expect(life1Premium).toBeGreaterThan(0);

  await quote.getByRole('button', { name: 'Add life' }).click();
  await waitForSettle(quote);

  const allLivesLabelExists = await quote.evaluate(() =>
    document.body.innerText.includes('All Lives')
  );
  recordCheck(testInfo, { label: 'Premium panel shows "All Lives" aggregated total after adding a second life', expected: true, actual: allLivesLabelExists });
  expect(allLivesLabelExists).toBe(true);
});
