/**
 * Failure modes test — tests different failure types to see how the Test Console renders each.
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(120_000);

test('FAIL MODE 1: Timeout on nonexistent element (should show screenshot)', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  // This will timeout and should show a screenshot of the current page
  await page.locator('text=RULE FAILED: This element does not exist on the page').click({ timeout: 5000 });
});

test('FAIL MODE 2: expect() assertion (may not show screenshot)', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  expect(false, 'This is an expect failure - does screenshot show?').toBe(true);
});

test('FAIL MODE 3: throw Error (may not show screenshot)', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  throw new Error('This is a throw failure - does screenshot show?');
});
