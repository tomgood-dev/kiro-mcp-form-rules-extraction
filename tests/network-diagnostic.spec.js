/**
 * Network Diagnostic — Navigate to login page, wait for SPA to render, report what's there.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('DIAGNOSTIC: Navigate to Asteron login page (wait for SPA render)', async ({ page }) => {
  const response = await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'networkidle',
    timeout: 30000,
  }).catch(async (e) => {
    // networkidle may not resolve for OutSystems — fallback
    return null;
  });

  // Wait up to 15s for the login form to render (SPA hydration)
  await page.waitForTimeout(5000);
  
  // Try waiting for any input field to appear
  await page.locator('input').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  const status = response?.status() || 'no response or networkidle timeout';
  const url = page.url();
  const title = await page.title();
  const hasLoginButton = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  const hasAnyInput = await page.locator('input').first().isVisible().catch(() => false);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);

  const result = [
    `STATUS=${status}`,
    `URL=${url}`,
    `TITLE=${title}`,
    `LOGIN_BTN=${hasLoginButton}`,
    `EMAIL_FIELD=${hasEmailField}`,
    `ANY_INPUT=${hasAnyInput}`,
    `HTML_SIZE=${htmlLength}`,
    `BODY=${bodyText.substring(0, 200).replace(/\n/g, ' ')}`,
  ].join(' | ');

  expect(result).toBe('INTENTIONAL_FAIL');
});
