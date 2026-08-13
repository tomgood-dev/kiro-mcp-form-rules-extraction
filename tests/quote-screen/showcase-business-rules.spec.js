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
  sumInsuredInput,
} = require('../helpers/quote-helpers');

// Each test gets its own fresh quote page
let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Major Trauma Cap Formula (LSC-19/LSC-20)
//
// Business Rule:
//   When Trauma Recovery Cover (TRC) < $25,000:
//     Major Trauma max = 300% × TRC Sum Insured
//   When TRC >= $25,000:
//     Major Trauma max = $2,000,000 - TRC - Cancer (global combined cap only)
//
// Why this matters:
//   The tooltip only mentions the <$25k case. The ≥$25k behavior was unknown
//   until we tested it — there is NO percentage cap, only the global ceiling.
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-19: Major Trauma below $25k TRC — capped at 300% of TRC Sum Insured', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  // Activate Trauma cover
  await activateCover(quote, 'Trauma');
  await waitForSettle(quote);

  // Set Trauma Sum Insured to $20,000 (below $25k threshold)
  const traumaSI = quote.locator('input[id*="SumInsured"]').first();
  await fillCalcMask(traumaSI, '20000', quote);

  // Activate Major Trauma sub-benefit
  await activateCover(quote, 'Major Trauma');
  await waitForSettle(quote);

  // Set Major Trauma Sum Insured to $60,001 (just over 300% of $20k = $60,000)
  const majorTraumaSI = quote.locator('input[id*="SumInsured"]').nth(1);
  await fillCalcMask(majorTraumaSI, '60001', quote);

  // Assert: the 300% cap error fires
  await expectErrorContaining(quote,
    'The maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $20000 is $60000'
  );
});

test('LSC-20: Major Trauma at/above $25k TRC — no percentage cap, only $2M global ceiling', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  await activateCover(quote, 'Trauma');
  await waitForSettle(quote);

  // Set Trauma Sum Insured to $25,000 (at threshold)
  const traumaSI = quote.locator('input[id*="SumInsured"]').first();
  await fillCalcMask(traumaSI, '25000', quote);

  await activateCover(quote, 'Major Trauma');
  await waitForSettle(quote);

  // Set Major Trauma to $1,975,000 — exactly $2M combined with TRC ($25k + $1.975M = $2M)
  const majorTraumaSI = quote.locator('input[id*="SumInsured"]').nth(1);
  await fillCalcMask(majorTraumaSI, '1975000', quote);

  // Assert: NO percentage-based error (300% of $25k = $75k, but we're way past that)
  const errors = await getVisibleErrors(quote);
  const has300Error = errors.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit based on'));
  expect(has300Error).toBe(false);

  // Now exceed the global $2M cap
  await fillCalcMask(majorTraumaSI, '1975001', quote);

  // Assert: the global cap error fires
  await expectErrorContaining(quote,
    'The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Income Protection 3-Tier Progressive Formula (DC-21)
//
// Business Rule:
//   Tier 1: 75% of first $320,000 income
//   Tier 2: 50% of income between $320,001 - $560,000
//   Tier 3: 20% of income above $560,000
//   Product cap: $30,000/month regardless of income
//
// Why this matters:
//   Previously documented as a simple 75% formula (only tested at $150k income).
//   The progressive tiers only surface at higher incomes. A policy with $400k+
//   income would be under-insured if the simple formula were used.
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

  await activateCover(quote, 'Income Protection');
  await waitForSettle(quote);

  // Enter an oversized Monthly Benefit to trigger the cap error
  const benefitField = quote.locator('input[id*="SumInsured"]').nth(1);
  await fillCalcMask(benefitField, '99999', quote);

  // Assert: error names the exact tiered cap ($23,333)
  await expectErrorContaining(quote, '$23,333');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Specific Injury Companion-Cover Requirement (LSC-32)
//
// Business Rule:
//   Specific Injury cannot be activated standalone. It requires at least one of:
//   Life, Trauma Recovery, Cancer, TPD, Accidental Death, Income Protection,
//   Mortgage & Living, or Workability on the same policy.
//
// Why this matters:
//   Previously documented as "no companion cover required" (incorrect). An
//   adviser attempting to sell Specific Injury as a standalone product would
//   be blocked at Apply time with no prior warning in the UI.
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
  await waitForSettle(quote);

  // Set a valid Sum Insured
  const siField = quote.locator('input[id*="SumInsured"]').first();
  await fillCalcMask(siField, '5000', quote);

  // Click Apply
  await clickApply(quote);

  // Assert: companion-cover error fires
  await expectErrorContaining(quote,
    'Specific Injury Lump Sum requires one of the following covers to also be selected'
  );

  // Verify the error lists the valid companions
  const errors = await getVisibleErrors(quote);
  const companionError = errors.find(e => e.includes('Specific Injury Lump Sum requires'));
  expect(companionError).toContain('Life');
  expect(companionError).toContain('TPD');
  expect(companionError).toContain('Income Protection');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Life Cover Age-Band Cap — $50,000 Maximum for ANB 11-16 (PD-28)
//
// Business Rule:
//   Life Cover Sum Insured is capped at $50,000 for clients with
//   Age Next Birthday between 11 and 16 (inclusive).
//   Above ANB 17, the standard caps apply ($5,000,000 for 22+).
//
// Why this matters:
//   All previous testing used Age 35 (adult band). A child policy would
//   silently fail to price if sum insured exceeds the youth cap. This rule
//   protects against over-insurance of minors.
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
  await waitForSettle(quote);

  // Enter Sum Insured exceeding the youth cap ($999,999 >> $50,000)
  const lifeSI = quote.locator('input[id*="SumInsured"]').first();
  await fillCalcMask(lifeSI, '999999', quote);

  // Assert: age-band cap error fires with exact text
  await expectErrorContaining(quote,
    "The Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Bundling Discount Minimum Threshold (PREM-23/24)
//
// Business Rule:
//   The bundling discount requires 2+ covers from different categories, BUT
//   each cover must meet its category's minimum Sum Insured to count:
//     - Life: minimum $100,000
//     - TPD:  minimum $100,000
//   A cover below its threshold does NOT count toward the bundling tally.
//
// Why this matters:
//   Without this rule, a low-value policy ($10k Life + $200k TPD) would
//   appear to qualify for a discount but actually doesn't. This prevents
//   advisers from gaming the discount with trivial cover amounts.
// ─────────────────────────────────────────────────────────────────────────────

test('PREM-23/24: Bundling discount requires Life/TPD minimum $100,000 each', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  // Activate Life at $99,999 (just UNDER the $100k minimum) + TPD at $200,000
  await activateCover(quote, 'Life');
  await waitForSettle(quote);
  const lifeSI = quote.locator('input[id*="SumInsured"]').first();
  await fillCalcMask(lifeSI, '99999', quote);

  await activateCover(quote, 'TPD');
  await waitForSettle(quote);
  const tpdSI = quote.locator('input[id*="SumInsured"]').nth(1);
  await fillCalcMask(tpdSI, '200000', quote);

  // Assert: NO bundling discount (Life below threshold, only TPD qualifies = 1 cover)
  const discountBelow = await getBundlingDiscount(quote);
  expect(discountBelow).toBe('None');

  // Now raise Life to exactly $100,000 (meets threshold)
  await fillCalcMask(lifeSI, '100000', quote);

  // Assert: bundling discount activates (2 qualifying covers)
  const discountAtThreshold = await getBundlingDiscount(quote);
  expect(discountAtThreshold).toContain('15%');
});
