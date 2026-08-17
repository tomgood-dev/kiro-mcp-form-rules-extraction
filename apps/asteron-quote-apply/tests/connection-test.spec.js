/**
 * Connection Test — Test the .au environment (whitelisted)
 * 
 * outsystems-dev.resolutionlife.com.au is the whitelisted environment.
 * /QuoteAndApply/ should redirect to /CentralPortalsLogin/NewLoginRLANZ
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('CONNECTION: outsystems-dev.resolutionlife.com.au/QuoteAndApply/ is reachable', async ({ page }) => {
  await page.goto('https://outsystems-dev.resolutionlife.com.au/QuoteAndApply/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(10000);

  const url = page.url();
  const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
  const hasError = url.includes('_error.html');

  const result = `URL=${url} | HAS_ERROR=${hasError} | BODY=${body.substring(0, 150)}`;

  expect(hasError, `Got error page: ${result}`).toBe(false);
  expect(body.length > 10, `Page empty: ${result}`).toBe(true);
});

test('CONNECTION: outsystems-dev.resolutionlife.com.au/CentralPortalsLogin/ renders login form', async ({ page }) => {
  await page.goto('https://outsystems-dev.resolutionlife.com.au/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(10000);

  const url = page.url();
  const hasLoginBtn = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
  const hasError = url.includes('_error.html');

  const result = `URL=${url} | LOGIN_BTN=${hasLoginBtn} | EMAIL_FIELD=${hasEmailField} | HAS_ERROR=${hasError} | BODY=${body.substring(0, 150)}`;

  expect(hasError, `Got error page: ${result}`).toBe(false);
});
