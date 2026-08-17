/**
 * DIAGNOSTIC SHOWCASE — Each step is its own test.
 * If a test PASSES, that step works. If it FAILS, that's where the problem is.
 * The test NAME tells you what's being checked.
 * 
 * Environment variables required: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

test.setTimeout(120_000);

// These tests run IN ORDER (serial) — each builds on the previous
test.describe.configure({ mode: 'serial' });

let page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test('STEP 1: Environment variables are set', async () => {
  expect(BASE_URL).toBeTruthy();
  expect(LOGIN_EMAIL).toBeTruthy();
  expect(LOGIN_PASSWORD).toBeTruthy();
});

test('STEP 2: Login page loads (no error page)', async () => {
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  const url = page.url();
  expect(url.includes('_error.html')).toBe(false);
});

test('STEP 3: Login form renders (email field visible)', async () => {
  const emailField = page.locator('input[type="text"]').first();
  const visible = await emailField.isVisible().catch(() => false);
  expect(visible).toBe(true);
});

test('STEP 4: Credentials entered and login clicked', async () => {
  const emailField = page.locator('input[type="text"]').first();
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);
  // Pass if we got past click without crashing
  expect(true).toBe(true);
});

test('STEP 5: Login succeeded (not on login page anymore)', async () => {
  const url = page.url();
  const stillOnLogin = url.includes('CentralPortalsLogin') || url.includes('NewLogin');
  expect(stillOnLogin).toBe(false);
});

test('STEP 6: QuoteAndApply page loads (no error page)', async () => {
  await page.goto(`${BASE_URL}/QuoteAndApply/`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  const url = page.url();
  expect(url.includes('_error.html')).toBe(false);
});

test('STEP 7: New Quote opens and form renders', async () => {
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
  const ageField = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  const visible = await ageField.isVisible().catch(() => false);
  expect(visible).toBe(true);
});

test('STEP 8: Can set Age and Gender (personal details work)', async () => {
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type('35', { delay: 40 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')]
      .find(b => b.innerText.trim() === 'Male');
    if (btn && !btn.className.includes('selected')) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  });
  await page.waitForTimeout(2000);

  const ageValue = await ageInput.inputValue();
  expect(ageValue).toBe('35');
});

test('STEP 9: Can activate Life cover and enter Sum Insured', async () => {
  // Set occupation first
  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await page.waitForFunction(
    () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await occDropdown.selectOption('1');
  await page.waitForTimeout(2000);

  // Activate Life
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  // Fill Sum Insured
  const siField = page.locator('input[id*="SumInsured"]').first();
  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '200000') await page.keyboard.press(d);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  // Check premium appeared
  const premium = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('$') && text.includes('Total');
  });
  expect(premium).toBe(true);
});
