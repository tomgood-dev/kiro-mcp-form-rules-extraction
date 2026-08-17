/**
 * STANDALONE SHOWCASE TEST SUITE — Asteron Life Quote & Apply Business Rules
 * 
 * This file is fully self-contained. No external helpers or config required.
 * Drop it into any Playwright project and run directly.
 * 
 * Requirements:
 *   - @playwright/test installed
 *   - Network access to https://outsystems-dev.asteronlife.co.nz
 *   - Set environment variables: ENV_LOGIN_EMAIL, ENV_LOGIN_PASSWORD
 *     (or edit the credentials in the login() function below)
 * 
 * Run:
 *   npx playwright test showcase-business-rules-standalone.spec.js --headed
 * 
 * Rules tested:
 *   1. LSC-19: Major Trauma cap = 300% of TRC when TRC < $25,000
 *   2. LSC-20: Major Trauma cap = global $2M ceiling when TRC >= $25,000
 *   3. DC-21:  Income Protection 3-tier progressive formula (75%/50%/20%)
 *   4. LSC-32: Specific Injury requires a companion cover
 *   5. PD-28:  Life Cover $50,000 max for Age Next Birthday < 17
 *   6. PREM-23/24: Bundling discount requires $100k minimum per Life/TPD
 */

const { test, expect } = require('@playwright/test');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
const LOGIN_EMAIL = process.env.ENV_LOGIN_EMAIL || 'hanno.coetzee+1123@resolutionlife.com.au';
const LOGIN_PASSWORD = process.env.ENV_LOGIN_PASSWORD || 'P@ssw0rd135';

// Increase timeout — OutSystems is slow (form load + server round-trips)
test.setTimeout(240_000);

// ═══════════════════════════════════════════════════════════════════════════════
// INLINED HELPER FUNCTIONS (OutSystems-specific interaction patterns)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Logs in and navigates to a fresh New Quote form.
 * Returns the page object positioned on the quote form.
 */
async function loginAndOpenNewQuote(page) {
  // --- Login ---
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000); // Wait for SPA to hydrate

  const emailField = page.locator('input[type="text"]').first();
  const passwordField = page.locator('input[type="password"]').first();

  // Wait for login form to actually render
  await emailField.waitFor({ state: 'visible', timeout: 30000 });

  // Use click + type (not fill) for OutSystems reactive binding
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await passwordField.click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // --- Navigate to Quote & Apply list ---
  await page.goto(`${BASE_URL}/QuoteAndApply/`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // --- Click New Quote (uses window.open which we intercept) ---
  const quoteUrl = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.open = function(url) { resolve(url); };
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    });
  });

  if (quoteUrl) {
    await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto(`${BASE_URL}/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`, { waitUntil: 'domcontentloaded' });
  }

  // Wait for the quote form to render
  await page.waitForTimeout(3000);
  await page.locator('input[id*="Input_AgeNextBirthday"], input[id*="Input_FirstName"]').first()
    .waitFor({ state: 'visible', timeout: 30000 });
  await waitForSettle(page);
  return page;
}

/** Waits for the OutSystems "Loading" indicator to clear. */
async function waitForSettle(page, ms = 400) {
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Fills minimum Personal Details needed to price covers.
 * OutSystems quirks handled:
 *   - Age: type char-by-char + Tab (not .fill())
 *   - Gender: evaluate-based button-group click (not a radio input)
 *   - Dropdowns: wait for enabled state after Gender triggers full recalculation
 */
async function setMinimumPersonalDetails(page, opts = {}) {
  const {
    age = 35,
    gender = 'Male',
    occupationCode = '1', // '1'=AA
    employmentStatus,
    income,
  } = opts;

  // Age
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(String(age), { delay: 40 });
  await page.keyboard.press('Tab');
  await waitForSettle(page, 1000);

  // Gender (button group — NOT a radio input)
  await page.evaluate((g) => {
    const btn = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')]
      .find(b => b.innerText.trim() === g);
    if (btn && !btn.className.includes('selected')) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  }, gender);
  await waitForSettle(page, 2000);

  // Occupation Code dropdown (may be temporarily disabled after Gender change)
  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await occDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(
    () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await occDropdown.selectOption(occupationCode);
  await waitForSettle(page, 1500);

  // Employment Status (optional)
  if (employmentStatus) {
    const empDropdown = page.locator('select[id*="EmploymentStatus_Dropdown"]').first();
    await empDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(
      () => !document.querySelector('select[id*="EmploymentStatus_Dropdown"]')?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await empDropdown.selectOption({ label: employmentStatus });
    await waitForSettle(page, 1500);
  }

  // Annual Income (optional — uses calc-mask)
  if (income !== undefined) {
    await fillCalcMask(page.locator('input[id*="MaskedInput"]').first(), String(income), page);
    await waitForSettle(page, 1000);
  }
}

/**
 * Enters a value into an OutSystems calc-mask field (Sum Insured, Monthly Benefit).
 * These fields use right-to-left digit shifting — .fill() corrupts them.
 * Must: click → backspace 12× → type each digit → Tab out.
 */
async function fillCalcMask(locator, value, page) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(200);
  for (const digit of String(value).replace(/[^0-9]/g, '')) {
    await page.keyboard.press(digit);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

/** Fills a calc-mask field located by partial ID, with automatic re-query. */
async function fillCalcMaskById(page, idSubstring, value, nth = 0) {
  const locator = page.locator(`input[id*="${idSubstring}"]`).nth(nth);
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await fillCalcMask(locator, value, page);
}

/**
 * Activates a cover by button text. Uses evaluate .click() because standard
 * Playwright .click() doesn't trigger OutSystems' XHR binding on these buttons.
 */
async function activateCover(page, buttonLabel) {
  await page.evaluate((label) => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.trim().split('\n')[0] === label
    );
    if (!btn) throw new Error(`Cover button not found: "${label}"`);
    if (btn.disabled) throw new Error(`Cover button is disabled: "${label}"`);
    btn.click();
  }, buttonLabel);
  await waitForSettle(page, 2000);
}

/** Returns all currently-visible validation error strings. */
async function getVisibleErrors(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    const texts = nodes
      .filter((n) => n.innerText && n.innerText.trim() && n.getBoundingClientRect().width > 0)
      .map((n) => n.innerText.trim());
    return [...new Set(texts)].filter((t) => t !== 'Remove');
  });
}

/** Asserts at least one visible error contains the given substring. */
async function expectErrorContaining(page, substring) {
  const errors = await getVisibleErrors(page);
  const found = errors.some((e) => e.includes(substring));
  if (!found) {
    throw new Error(`Expected an error containing "${substring}", got: ${JSON.stringify(errors, null, 2)}`);
  }
}

/** Clicks the footer Apply button. */
async function clickApply(page) {
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await waitForSettle(page, 2000);
}

/** Reads the Bundling Discount label text (e.g. "None", "15% (2 covers)"). */
async function getBundlingDiscount(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const idx = text.indexOf('Bundling Discounts');
    if (idx === -1) return null;
    const chunk = text.slice(idx, idx + 60);
    const line = chunk.split('\n')[1];
    return line ? line.trim() : null;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

let quote;

test.beforeEach(async ({ page }) => {
  quote = await loginAndOpenNewQuote(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: LSC-19 — Major Trauma below $25k TRC, capped at 300%
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-19: Major Trauma below $25k TRC — capped at 300% of TRC Sum Insured', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  await activateCover(quote, 'Trauma');
  await fillCalcMaskById(quote, 'SumInsured', '20000', 0);

  await quote.waitForTimeout(2000);
  await activateCover(quote, 'Major Trauma');
  await quote.waitForTimeout(2000);

  await fillCalcMaskById(quote, 'SumInsured', '60001', 1);

  await expectErrorContaining(quote,
    'maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $20000 is $60000'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: LSC-20 — Major Trauma at/above $25k TRC, only $2M global ceiling
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-20: Major Trauma at/above $25k TRC — no percentage cap, only $2M global ceiling', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  await activateCover(quote, 'Trauma');
  await fillCalcMaskById(quote, 'SumInsured', '25000', 0);

  await quote.waitForTimeout(2000);
  await activateCover(quote, 'Major Trauma');
  await quote.waitForTimeout(2000);

  // $25k TRC + $1,975,001 Major Trauma > $2M global cap
  await fillCalcMaskById(quote, 'SumInsured', '1975001', 1);

  const errors = await getVisibleErrors(quote);
  const has300Error = errors.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit based on'));
  const hasGlobalCap = errors.some(e => e.includes('maximum total Sum Insured per life for Trauma Recovery Cover'));

  expect(has300Error).toBe(false); // No percentage cap at $25k+
  expect(hasGlobalCap).toBe(true); // Only the $2M global cap applies
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: DC-21 — Income Protection 3-tier progressive formula
// ─────────────────────────────────────────────────────────────────────────────

test('DC-21: Income Protection uses 3-tier progressive formula (75%/50%/20%)', async () => {
  // At $400k income: 75%×$320k + 50%×$80k = $280k/yr = $23,333/month cap
  await setMinimumPersonalDetails(quote, {
    age: 35, gender: 'Male', occupationCode: '1',
    employmentStatus: 'Employed', income: '400000',
  });

  await activateCover(quote, 'Income Protection');
  await quote.waitForTimeout(4000);

  await fillCalcMaskById(quote, 'SumInsured', '99999', 0);

  await expectErrorContaining(quote, '$23,333');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: LSC-32 — Specific Injury requires companion cover
// ─────────────────────────────────────────────────────────────────────────────

test('LSC-32: Specific Injury requires a companion cover — blocked standalone', async () => {
  await setMinimumPersonalDetails(quote, {
    age: 35, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed',
  });

  await activateCover(quote, 'Specific Injury');
  await fillCalcMaskById(quote, 'SumInsured', '5000', 0);

  await clickApply(quote);

  await expectErrorContaining(quote,
    'Specific Injury Lump Sum requires one of the following covers to also be selected'
  );

  const errors = await getVisibleErrors(quote);
  const companionError = errors.find(e => e.includes('Specific Injury Lump Sum requires'));
  expect(companionError).toContain('Life');
  expect(companionError).toContain('TPD');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: PD-28 — Life Cover $50k max for Age Next Birthday under 17
// ─────────────────────────────────────────────────────────────────────────────

test('PD-28: Life Cover maximum $50,000 for Age Next Birthday under 17', async () => {
  await setMinimumPersonalDetails(quote, { age: 15, gender: 'Male', occupationCode: '1' });

  await activateCover(quote, 'Life');
  await fillCalcMaskById(quote, 'SumInsured', '999999', 0);

  await expectErrorContaining(quote,
    "Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: PREM-23/24 — Bundling discount requires $100k minimum per cover
// ─────────────────────────────────────────────────────────────────────────────

test('PREM-23/24: Bundling discount requires Life/TPD minimum $100,000 each', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });

  // Life at $100,000 (meets threshold) + TPD at $200,000 → should get 15% discount
  await activateCover(quote, 'Life');
  await fillCalcMaskById(quote, 'SumInsured', '100000', 0);

  await quote.waitForTimeout(2000);
  await activateCover(quote, 'TPD');
  await quote.waitForTimeout(2000);
  await fillCalcMaskById(quote, 'SumInsured', '200000', 1);

  // Both covers meet $100k threshold → 15% bundling discount
  const discount = await getBundlingDiscount(quote);
  expect(discount).toContain('15%');
});
