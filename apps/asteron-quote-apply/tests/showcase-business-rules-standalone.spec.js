/**
 * SHOWCASE TEST SUITE — Asteron Life Quote & Apply Business Rules
 * 
 * Self-contained. Uses environment variables:
 *   BASE_URL      — e.g. https://outsystems-dev.asteronlife.co.nz
 *   LOGIN_EMAIL   — e.g. hanno.coetzee+1123@resolutionlife.com.au
 *   LOGIN_PASSWORD — e.g. P@ssw0rd135
 * 
 * Every step has explicit error messages so failures are diagnosable.
 */

const { test, expect } = require('@playwright/test');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

test.setTimeout(240_000);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function loginAndOpenNewQuote(page) {
  // --- STEP 1: Validate environment variables ---
  if (!BASE_URL) throw new Error('STEP 1 FAILED: BASE_URL environment variable is not set');
  if (!LOGIN_EMAIL) throw new Error('STEP 1 FAILED: LOGIN_EMAIL environment variable is not set');
  if (!LOGIN_PASSWORD) throw new Error('STEP 1 FAILED: LOGIN_PASSWORD environment variable is not set');

  // --- STEP 2: Navigate to login page ---
  let response;
  try {
    response = await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (e) {
    throw new Error(`STEP 2 FAILED: Could not navigate to login page. URL=${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ. Error: ${e.message.substring(0, 100)}`);
  }

  const loginPageUrl = page.url();
  if (loginPageUrl.includes('_error.html')) {
    throw new Error(`STEP 2 FAILED: Got error page (IP not whitelisted?). URL=${loginPageUrl}`);
  }

  // --- STEP 3: Wait for login form to render ---
  await page.waitForTimeout(5000);
  const emailField = page.locator('input[type="text"]').first();
  const emailVisible = await emailField.isVisible().catch(() => false);
  if (!emailVisible) {
    const body = await page.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));
    throw new Error(`STEP 3 FAILED: Login form did not render after 5s. URL=${page.url()}. Body: ${body}`);
  }

  // --- STEP 4: Enter credentials ---
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });

  // --- STEP 5: Click login ---
  await page.locator('button:has-text("Log in")').click();

  // --- STEP 6: Wait for redirect to dashboard ---
  await page.waitForTimeout(10000);
  const postLoginUrl = page.url();
  if (postLoginUrl.includes('CentralPortalsLogin') || postLoginUrl.includes('NewLogin')) {
    const body = await page.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));
    throw new Error(`STEP 6 FAILED: Login did not succeed (still on login page). URL=${postLoginUrl}. Body: ${body}`);
  }

  // --- STEP 7: Navigate to Quote & Apply list ---
  try {
    await page.goto(`${BASE_URL}/QuoteAndApply/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (e) {
    throw new Error(`STEP 7 FAILED: Could not navigate to /QuoteAndApply/. Error: ${e.message.substring(0, 100)}`);
  }
  await page.waitForTimeout(3000);

  const quoteListUrl = page.url();
  if (quoteListUrl.includes('_error.html')) {
    throw new Error(`STEP 7 FAILED: /QuoteAndApply/ redirected to error page. URL=${quoteListUrl}`);
  }

  // --- STEP 8: Click New Quote ---
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

  // --- STEP 9: Wait for quote form to render ---
  await page.waitForTimeout(3000);
  const formField = page.locator('input[id*="Input_AgeNextBirthday"], input[id*="Input_FirstName"]').first();
  const formVisible = await formField.isVisible().catch(() => false);
  if (!formVisible) {
    await page.waitForTimeout(5000);
    const stillNotVisible = !(await formField.isVisible().catch(() => false));
    if (stillNotVisible) {
      const body = await page.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));
      throw new Error(`STEP 9 FAILED: Quote form did not render. URL=${page.url()}. Body: ${body}`);
    }
  }
  await waitForSettle(page);
  return page;
}

async function waitForSettle(page, ms = 400) {
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function setMinimumPersonalDetails(page, opts = {}) {
  const { age = 35, gender = 'Male', occupationCode = '1', employmentStatus, income } = opts;

  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(String(age), { delay: 40 });
  await page.keyboard.press('Tab');
  await waitForSettle(page, 1000);

  await page.evaluate((g) => {
    const btn = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')]
      .find(b => b.innerText.trim() === g);
    if (btn && !btn.className.includes('selected')) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  }, gender);
  await waitForSettle(page, 2000);

  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await occDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(
    () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await occDropdown.selectOption(occupationCode);
  await waitForSettle(page, 1500);

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
  if (income !== undefined) {
    await fillCalcMask(page.locator('input[id*="MaskedInput"]').first(), String(income), page);
    await waitForSettle(page, 1000);
  }
}

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

async function fillCalcMaskById(page, idSubstring, value, nth = 0) {
  const locator = page.locator(`input[id*="${idSubstring}"]`).nth(nth);
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await fillCalcMask(locator, value, page);
}

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

async function getVisibleErrors(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    const texts = nodes
      .filter((n) => n.innerText && n.innerText.trim() && n.getBoundingClientRect().width > 0)
      .map((n) => n.innerText.trim());
    return [...new Set(texts)].filter((t) => t !== 'Remove');
  });
}

async function expectErrorContaining(page, substring) {
  const errors = await getVisibleErrors(page);
  const found = errors.some((e) => e.includes(substring));
  if (!found) {
    throw new Error(`Expected an error containing "${substring}", got: ${JSON.stringify(errors, null, 2)}`);
  }
}

async function clickApply(page) {
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await waitForSettle(page, 2000);
}

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

test('LSC-20: Major Trauma at/above $25k TRC — no percentage cap, only $2M global ceiling', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Trauma');
  await fillCalcMaskById(quote, 'SumInsured', '25000', 0);
  await quote.waitForTimeout(2000);
  await activateCover(quote, 'Major Trauma');
  await quote.waitForTimeout(2000);
  await fillCalcMaskById(quote, 'SumInsured', '1975001', 1);
  const errors = await getVisibleErrors(quote);
  const has300Error = errors.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit based on'));
  const hasGlobalCap = errors.some(e => e.includes('maximum total Sum Insured per life for Trauma Recovery Cover'));
  expect(has300Error, 'Should NOT have 300% cap error at $25k TRC').toBe(false);
  expect(hasGlobalCap, 'Should have $2M global cap error').toBe(true);
});

test('DC-21: Income Protection uses 3-tier progressive formula (75%/50%/20%)', async () => {
  await setMinimumPersonalDetails(quote, {
    age: 35, gender: 'Male', occupationCode: '1',
    employmentStatus: 'Employed', income: '400000',
  });
  await activateCover(quote, 'Income Protection');
  await quote.waitForTimeout(4000);
  await fillCalcMaskById(quote, 'SumInsured', '99999', 0);
  await expectErrorContaining(quote, '$23,333');
});

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
});

test('PD-28: Life Cover maximum $50,000 for Age Next Birthday under 17', async () => {
  await setMinimumPersonalDetails(quote, { age: 15, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMaskById(quote, 'SumInsured', '999999', 0);
  await expectErrorContaining(quote,
    "Maximum 'Life Cover' sum insurable for clients under Age Next Birthday 17 is $50,000"
  );
});

test('PREM-23/24: Bundling discount requires Life/TPD minimum $100,000 each', async () => {
  await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
  await activateCover(quote, 'Life');
  await fillCalcMaskById(quote, 'SumInsured', '100000', 0);
  await quote.waitForTimeout(2000);
  await activateCover(quote, 'TPD');
  await quote.waitForTimeout(2000);
  await fillCalcMaskById(quote, 'SumInsured', '200000', 1);
  const discount = await getBundlingDiscount(quote);
  expect(discount, `Expected bundling discount to contain "15%", got: ${discount}`).toContain('15%');
});
