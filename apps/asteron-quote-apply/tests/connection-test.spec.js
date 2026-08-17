/**
 * Connection Test — Verifies the Quote & Apply screen is reachable and renders.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('CONNECTION: Quote & Apply screen is reachable and renders', async ({ page }) => {
  await page.goto('https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(10000);

  const url = page.url();
  const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
  const hasError = url.includes('_error.html');
  const hasContent = body.length > 20;

  const result = `URL=${url} | HAS_ERROR_PAGE=${hasError} | BODY=${body.substring(0, 150)}`;

  // If it redirected to _error.html, whitelisting didn't work
  expect(hasError, `Got error page: ${result}`).toBe(false);
  
  // Should have some real content
  expect(hasContent, `Page is empty: ${result}`).toBe(true);
});
