/**
 * DIAGNOSTIC — Each test is independent and numbered for ordering.
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

test.setTimeout(120_000);

test('01 - Environment variables are set', async ({ page }) => {
  expect(BASE_URL).toBeTruthy();
  expect(LOGIN_EMAIL).toBeTruthy();
  expect(LOGIN_PASSWORD).toBeTruthy();
});

test('02 - Login page loads without error', async ({ page }) => {
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  expect(page.url().includes('_error.html')).toBe(false);
});

test('03 - Login form renders', async ({ page }) => {
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  const visible = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  expect(visible).toBe(true);
});

test('04 - Login succeeds with credentials', async ({ page }) => {
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  const emailField = page.locator('input[type="text"]').first();
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);
  const url = page.url();
  const stillOnLogin = url.includes('CentralPortalsLogin') || url.includes('NewLogin');
  expect(stillOnLogin).toBe(false);
});

test('05 - QuoteAndApply page loads after login', async ({ page }) => {
  // Login first
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.locator('input[type="text"]').first().click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);

  // Navigate to QuoteAndApply
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  expect(page.url().includes('_error.html')).toBe(false);
});

test('06 - New Quote form opens with Age field visible', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.locator('input[type="text"]').first().click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);

  // Quote list
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // New Quote
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
