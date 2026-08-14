/**
 * SHOWCASE TEST SUITE — 5 High-Impact Business Rule Validations
 * 
 * These tests demonstrate automated verification of critical Asteron Life
 * Quote & Apply business rules that were reverse-engineered from the live
 * OutSystems application. Each test verifies a specific formula, cap, or
 * dependency rule by setting up a precise scenario and asserting the exact
 * server-side validation response.
 * 
 * Rules tested:
 *   1. LSC-19/20: Major Trauma cap formula (two-tier: 300% below $25k, global $2M above)
 *   2. DC-21:     Income Protection 3-tier progressive formula
 *   3. LSC-32:    Specific Injury companion-cover requirement
 *   4. PD-28:     Life Cover $50,000 age-band cap for ANB < 17
 *   5. PREM-23:   Bundling discount minimum threshold ($100k for Life/TPD)
 * 
 * Environment: OutSystems Reactive Web (React SPA)
 * Target: https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/
 * 
 * Key interaction patterns (OutSystems-specific):
 *   - Calc-mask fields need backspace-then-digit-by-digit entry (never .fill())
 *   - Cover buttons activate via evaluate .click() (standard click misses XHR)
 *   - Button groups (Gender, Smoking) need evaluate-based clicking
 *   - All field interactions must Tab out to trigger reactive binding
 *   - Wait for "Loading" indicator to clear after any server round-trip
 *   - After any auto-save (Tab out of Sum Insured), React re-renders the DOM —
 *     always re-query locators rather than caching them before the interaction
 */

const { test, expect } = require('@playwright/test');
const {
  openNewQuote,
  waitForSettle,
  setMinimumPersonalDetails,
  fillCalcMask,
  activateCover,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  getBundlingDiscount,
} = require('../helpers/quote-helpers');

// Each test gets its own fresh quote page
let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

/**
 * Helper: fills a calc-mask field found by a partial ID match.
 * Re-queries the DOM each time to avoid stale references after React re-renders.
 */
async function fillCalcMaskById(page, idSubstring, value, nth = 0) {
  // Wait for the field to exist after potential re-render
  const locator = page.locator(`input[id*="${idSubstring}"]`).nth(nth);
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await fillCalcMask(locator, value, page);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Major Trauma Cap Formula (LSC-19/LSC-20)
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-19: Major Trauma below $25k TRC — capped at 300% of TRC Sum Insured', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  // Activate Trauma cover
  await activateCover(quote, 'Trauma');

  // Set Trauma Sum Insured to $20,000 (below $25k threshold)
  await fillCalcMaskById(quote, 'SumInsured', '20000', 0);

  // Activate Major Trauma sub-benefit — wait extra for DOM to stabilize
  await quote.waitForTimeout(2000);
  await activateCover(quote, 'Major Trauma');
  await quote.waitForTimeout(2000);

  // Set Major Trauma Sum Insured — it's the SECOND SumInsured field now
  await fillCalcMaskById(quote, 'SumInsured', '60001', 1);

  // Assert: the 300% cap error fires
  await expectErrorContaining(quote,
    'maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $20000 is $60000'
  );
});

test('LSC-20: Major Trauma at/above $25k TRC — no percentage cap, only $2M global ceiling', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  await activateCover(quote, 'Trauma');

  // Set Trauma Sum Insured to $25,000 (at threshold)
  await fillCalcMaskById(quote, 'SumInsured', '25000', 0);

  // Activate Major Trauma
  await quote.waitForTimeout(2000);
  await activateCover(quote, 'Major Trauma');
  await quote.waitForTimeout(2000);

  // Set Major Trauma to $1,975,001 — exceeds $2M global cap ($25k + $1,975,001 > $2M)
  // This also proves no 300% cap exists (300% of $25k = $75k, we're entering way more)
  await fillCalcMaskById(quote, 'SumInsured', '1975001', 1);

  // Assert: the global cap error fires (NOT the 300% error)
  const errors = await getVisibleErrors(quote);
  const has300Error = errors.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit based on'));
  const hasGlobalCap = errors.some(e => e.includes('maximum total Sum Insured per life for Trauma Recovery Cover'));
  
  expect(has300Error).toBe(false); // No percentage cap at $25k+
  expect(hasGlobalCap).toBe(true); // Only the $2M global cap applies
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Income Protection 3-Tier Progressive Formula (DC-21)
// ─────────────────────────────────────────────────────────────────────────────

test('DC-21: Income Protection uses 3-tier progressive formula (75%/50%/20%)', async () => {
  // $400,000 income touches tier 2:
  //   Tier 1: 75% × $320,000 = $240,000/year
  //   Tier 2: 50% × ($400,000 - $320,000) = $40,000/year
  //   Total: $280,000/year = $23,333/month
  await setMinimumPersonalDetails(quote, {
    age: 35,
    gender: 'Male',
    occupationCode: '1',
    employmentStatus: 'Employed',
    income: '400000',
  });

  // Activate Income Protection (disability cover)
  await activateCover(quote, 'Income Protection');
  await quote.waitForTimeout(4000);

  // Enter an oversized Monthly Benefit to trigger the cap error
  await fillCalcMaskById(quote, 'SumInsured', '99999', 0);

  // Assert: error names the exact tiered cap ($23,333)
  await expectErrorContaining(quote, '$23,333');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Specific Injury Companion-Cover Requirement (LSC-32)
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-32: Specific Injury requires a companion cover — blocked standalone', async () => {
  await setMinimumPersonalDetails(quote, {
    age: 35,
    gender: 'Male',
    occupationCode: '1',
    employmentStatus: 'Employed',
  });

  // Activate ONLY Specific Injury (no other covers)
  await activateCover(quote, 'Specific Injury');

  // Set a valid Sum Insured
  await fillCalcMaskById(quote, 'SumInsured', '5000', 0);

  // Click Apply
  await clickApply(quote);

  // Assert: companion-cover error fires
  await expectErrorContaining(quote,
    'Specific Injury Lump Sum requires one of the following covers to also be selected'
  );

  // Verify the error lists valid companions
  const errors = await getVisibleErrors(quote);
  const companionError = errors.find(e => e.includes('Specific Injury Lump Sum requires'));
  expect(companionError).toContain('Life');
  expect(companionError).toContain('TPD');
  expect(companionError).toContain('Income Protection');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Life Cover Age-Band Cap — $50,000 Maximum for ANB 11-16 (PD-28)
// ─────────────────────────────────────────────────────────────────────────────

test('PD-28: Life Cover maximum $50,000 for Age Next Birthday under 17', async () => {
  // Set age to 15 (inside the 11-16 band)
  await setMinimumPersonalDetails(quote, {
    age: 15,
    gender: 'Male',
    occupationCode: '1',
  });

  // Activate Life cover
  await activateCover(quote, 'Life');

  // Enter Sum Insured exceeding the youth cap
  await fillCalcMaskById(quote, 'SumInsured', '999999', 0);

  // Assert: age-band cap error fires
  await expectErrorContaining(quote,
    "Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Bundling Discount Minimum Threshold (PREM-23/24)
// ─────────────────────────────────────────────────────────────────────────────

test('PREM-23/24: Bundling discount requires Life/TPD minimum $100,000 each', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  // Activate Life — set to $99,999 (just UNDER threshold)
  await activateCover(quote, 'Life');
  await fillCalcMaskById(quote, 'SumInsured', '99999', 0);

  // Activate TPD — set to $200,000 (well above threshold)
  await quote.waitForTimeout(2000);
  await activateCover(quote, 'TPD');
  await quote.waitForTimeout(2000);
  await fillCalcMaskById(quote, 'SumInsured', '200000', 1);

  // Assert: NO bundling discount (Life below $100k threshold)
  const discountBelow = await getBundlingDiscount(quote);
  expect(discountBelow).toBe('None');

  // Now raise Life to exactly $100,000
  await fillCalcMaskById(quote, 'SumInsured', '100000', 0);

  // Assert: bundling discount activates
  const discountAtThreshold = await getBundlingDiscount(quote);
  expect(discountAtThreshold).toContain('15%');
});
