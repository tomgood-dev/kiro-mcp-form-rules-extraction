/**
 * Showcase — each test logs in and validates one rule.
 * Uses { page } fixture for screenshots on failure.
 * 
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(180_000);

// ─── Shared helpers ────────────────────────────────────────────────────────────

async function login(page) {
  const BASE_URL = process.env.BASE_URL;
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(8000);

  if (page.url().includes('_error.html')) {
    throw new Error(`LOGIN PAGE BLOCKED. URL: ${page.url()}`);
  }

  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false))) {
    throw new Error(`LOGIN FORM NOT RENDERED. URL: ${page.url()}`);
  }

  await emailField.click();
  await page.keyboard.type(process.env.LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(process.env.LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(15000);

  if (page.url().includes('CentralPortalsLogin')) {
    throw new Error(`LOGIN FAILED (still on login page). URL: ${page.url()}`);
  }
}

async function openNewQuote(page) {
  const BASE_URL = process.env.BASE_URL;
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

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
  await page.waitForTimeout(5000);

  if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false))) {
    throw new Error(`QUOTE FORM NOT RENDERED. URL: ${page.url()}`);
  }
}

async function setPersonalDetails(page, age = '35') {
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(age, { delay: 40 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male');
    if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
  });
  await page.waitForTimeout(2000);

  await page.waitForFunction(
    () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
  await page.waitForTimeout(2000);
}

async function fillSumInsured(page, nth, value) {
  const field = page.locator('input[id*="SumInsured"]').nth(nth);
  await field.waitFor({ state: 'visible', timeout: 15000 });
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of value) { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function activateCover(page, label) {
  await page.evaluate((l) => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === l);
    if (btn) btn.click();
  }, label);
  await page.waitForTimeout(3000);
}

async function getErrors(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    return [...new Set(nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim()))];
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test('01 - Login and open Quote form', async ({ page }) => {
  await login(page);
  await openNewQuote(page);
  expect(true).toBe(true);
});

test('02 - RULE PD-28: Life Cover $50k cap for Age under 17', async ({ page }) => {
  await login(page);
  await openNewQuote(page);
  await setPersonalDetails(page, '15');
  await activateCover(page, 'Life');
  await fillSumInsured(page, 0, '999999');
  const errors = await getErrors(page);
  const hasCapError = errors.some(e => e.includes('50,000') || e.includes('under Age Next Birthday 17'));
  expect(hasCapError).toBe(true);
});

test('03 - RULE LSC-32: Specific Injury needs companion cover', async ({ page }) => {
  await login(page);
  await openNewQuote(page);
  await setPersonalDetails(page);
  await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
  await page.waitForTimeout(2000);
  await activateCover(page, 'Specific Injury');
  await fillSumInsured(page, 0, '5000');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(3000);
  const errors = await getErrors(page);
  const hasError = errors.some(e => e.includes('Specific Injury Lump Sum requires'));
  expect(hasError).toBe(true);
});
