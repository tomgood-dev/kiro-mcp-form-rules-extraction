/**
 * Network Diagnostic — Navigate to the Asteron login page and report what's there.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('DIAGNOSTIC: Navigate to Asteron login page', async ({ page }) => {
  const response = await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  const status = response?.status() || 'no response';
  const url = page.url();
  const title = await page.title();
  const hasLoginButton = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));

  const result = [
    `STATUS=${status}`,
    `URL=${url}`,
    `TITLE=${title}`,
    `LOGIN_BUTTON_VISIBLE=${hasLoginButton}`,
    `EMAIL_FIELD_VISIBLE=${hasEmailField}`,
    `BODY_PREVIEW=${bodyText.substring(0, 150)}`,
  ].join(' | ');

  // Force fail to show the result
  expect(result).toBe('INTENTIONAL_FAIL');
});
