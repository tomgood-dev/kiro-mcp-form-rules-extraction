/**
 * Connection Test — Verifies full access: login → Quote list → New Quote form
 * Run this after IP whitelisting to confirm end-to-end connectivity.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(120_000);

test('CONNECTION: Login and reach Quote form', async ({ page }) => {
  // Step 1: Navigate to login page
  await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const loginUrl = page.url();
  const hasLoginBtn = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);

  // Force-fail with diagnostic info if login page didn't render
  if (!hasLoginBtn || !hasEmailField) {
    const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
    expect(`LOGIN_PAGE_FAILED | URL=${loginUrl} | BODY=${body}`).toBe('EXPECTED_LOGIN_FORM');
  }

  // Step 2: Log in
  await page.locator('input[type="text"]').first().fill('miguel.silva@resolutionlife.com.au');
  await page.locator('input[type="password"]').first().fill('P@ssw0rd135');
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);

  const postLoginUrl = page.url();
  const onDashboard = postLoginUrl.includes('AdviserCentral') || postLoginUrl.includes('Dashboard');

  if (!onDashboard) {
    const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
    expect(`LOGIN_FAILED | URL=${postLoginUrl} | BODY=${body}`).toBe('EXPECTED_DASHBOARD');
  }

  // Step 3: Navigate to Quote & Apply
  await page.goto('https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const quoteListUrl = page.url();
  const hasNewQuote = await page.locator('a:has-text("New Quote")').isVisible().catch(() => false);

  if (!hasNewQuote) {
    const body = await page.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' '));
    expect(`QUOTE_LIST_FAILED | URL=${quoteListUrl} | BODY=${body}`).toBe('EXPECTED_QUOTE_LIST');
  }

  // Step 4: Open New Quote
  await page.evaluate(() => {
    window.open = function(url) { window.location.href = url; };
    [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote').click();
  });
  await page.waitForTimeout(8000);

  const quoteFormUrl = page.url();
  const hasAgeField = await page.locator('input[id*="Input_AgeNextBirthday"]').isVisible().catch(() => false);

  // Final assertion — if we get here, everything works
  const result = `URL=${quoteFormUrl} | HAS_AGE_FIELD=${hasAgeField}`;

  expect(hasAgeField, `Quote form loaded: ${result}`).toBe(true);
});
