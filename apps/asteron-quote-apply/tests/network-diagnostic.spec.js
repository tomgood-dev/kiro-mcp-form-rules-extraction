/**
 * Network Diagnostic v7 — Test with ignoreHTTPSErrors enabled
 * The previous run showed the app redirects to _error.html from the Test Suite.
 * This might be caused by SSL/TLS issues with the corporate proxy.
 */

const { test, expect, chromium } = require('@playwright/test');

test.setTimeout(60_000);

test('DIAGNOSTIC: Login page with ignoreHTTPSErrors', async () => {
  // Launch a fresh browser with HTTPS errors ignored
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.waitForTimeout(10000);

  const url = page.url();
  const title = await page.title();
  const hasLoginButton = await page.locator('button:has-text("Log in")').isVisible().catch(() => false);
  const hasEmailField = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
  const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200).replace(/\n/g, ' '));

  await browser.close();

  const result = `URL=${url} | TITLE=${title} | LOGIN_BTN=${hasLoginButton} | EMAIL=${hasEmailField} | HTML=${htmlLength} | BODY=${bodyText}`;

  expect(result).toBe('INTENTIONAL_FAIL');
});
