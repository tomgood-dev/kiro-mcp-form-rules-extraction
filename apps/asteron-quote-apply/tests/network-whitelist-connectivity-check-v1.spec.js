/**
 * Connection Test — Verify outsystems-dev.resolutionlife.com.au is reachable
 * and the OutSystems app responds (not blocked by IP whitelist).
 * 
 * Expected behavior:
 *   /QuoteAndApply/ → redirects to /CentralPortalsLogin/ (unauthenticated)
 *   /CentralPortalsLogin/ → renders login form
 *   
 * If IP is NOT whitelisted: both redirect to /_error.html
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('CONNECTION: /QuoteAndApply/ redirects to login (not error page)', async ({ page }) => {
  await page.goto('https://outsystems-dev.resolutionlife.com.au/QuoteAndApply/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const url = page.url();
  const hasError = url.includes('_error.html');
  const redirectedToLogin = url.includes('CentralPortalsLogin');

  const result = `URL=${url} | HAS_ERROR=${hasError} | REDIRECTED_TO_LOGIN=${redirectedToLogin}`;

  // Should NOT hit error page (that means IP is blocked)
  expect(hasError, `BLOCKED - Got error page: ${result}`).toBe(false);
  
  // Should redirect to login (expected for unauthenticated access)
  expect(redirectedToLogin, `Unexpected destination: ${result}`).toBe(true);
});

test('CONNECTION: /CentralPortalsLogin/ renders login form', async ({ page }) => {
  await page.goto('https://outsystems-dev.resolutionlife.com.au/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(10000);

  const url = page.url();
  const hasError = url.includes('_error.html');
  const hasLoginBtn = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);

  const result = `URL=${url} | LOGIN_BTN=${hasLoginBtn} | EMAIL_FIELD=${hasEmailField} | HAS_ERROR=${hasError}`;

  // Should NOT hit error page
  expect(hasError, `BLOCKED - Got error page: ${result}`).toBe(false);
  
  // Should have a login form
  expect(hasLoginBtn || hasEmailField, `No login form found: ${result}`).toBe(true);
});
