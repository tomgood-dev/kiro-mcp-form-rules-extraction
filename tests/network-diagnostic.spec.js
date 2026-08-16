/**
 * Network Diagnostic v6 — uses domcontentloaded (not networkidle) + simple waits
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(60_000);

test('DIAGNOSTIC: Login page after waiting for SPA', async ({ page }) => {
  await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // Wait 10s for SPA to hydrate
  await page.waitForTimeout(10000);

  const url = page.url();
  const title = await page.title();
  const hasLoginButton = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  const hasAnyInput = await page.locator('input').first().isVisible().catch(() => false);
  const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));

  const result = `URL=${url} | TITLE=${title} | LOGIN_BTN=${hasLoginButton} | EMAIL=${hasEmailField} | ANY_INPUT=${hasAnyInput} | HTML=${htmlLength} | BODY=${bodyText}`;

  expect(result).toBe('INTENTIONAL_FAIL');
});
